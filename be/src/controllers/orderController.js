const db = require('../config/db')
const path = require('path')
const fs = require('fs')

const checkout = async (req, res) => {
  const { method, location, cart } = req.body
  const user_id = req.user.id

  if (!cart || cart.length === 0) {
    return res.status(400).json({ error: 'Keranjang kosong' })
  }

  const total_price = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    for (const item of cart) {
      const [[product]] = await conn.execute(
        'SELECT stock FROM product WHERE product_id = ?',
        [item.product_id]
      )
      if (!product) {
        throw new Error(`Produk dengan ID ${item.product_id} tidak ditemukan`)
      }
      if (product.stock < item.quantity) {
        throw new Error(`Stok tidak cukup untuk produk ID ${item.product_id}`)
      }
    }

    const [orderResult] = await conn.execute(
      `INSERT INTO \`order\` (user_id, order_date, status, total_price, method, location)
       VALUES (?, NOW(), 'pending', ?, ?, ?)`,
      [user_id, total_price, method, location]
    )
    const order_id = orderResult.insertId

    for (const item of cart) {
      const subtotal = item.unit_price * item.quantity
      await conn.execute(
        `UPDATE product SET stock = stock - ? WHERE product_id = ?`,
        [item.quantity, item.product_id]
      )

      await conn.execute(
        `INSERT INTO stock_history (product_id, quantity, type)
         VALUES (?, ?, 'out')`,
        [item.product_id, item.quantity]
      )

      await conn.execute(
        `INSERT INTO order_item (order_id, product_id, quantity, subtotal)
         VALUES (?, ?, ?, ?)`,
        [order_id, item.product_id, item.quantity, subtotal]
      )
    }

    await conn.commit()
    conn.release()
    res.status(201).json({ message: 'Checkout berhasil', order_id })
  } catch (error) {
    await conn.rollback()
    conn.release()
    console.error(error)
    res.status(500).json({ error: error.message || 'Gagal memproses checkout' })
  }
}

const createPayment = async (req, res) => {
  const user_id = req.user.id
  const order_id = req.params.id
  const amount = req.body.amount
  const proof = req.file?.filename

  if (!proof) return res.status(400).json({ error: 'Bukti pembayaran wajib diupload' })

  try {
    await db.execute(
      `INSERT INTO payment (order_id, user_id, amount, status, proof_of_payment, created_at)
       VALUES (?, ?, ?, 'pending', ?, NOW())`,
      [order_id, user_id, amount, proof]
    )
    res.status(201).json({ message: 'Bukti pembayaran berhasil dikirim' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Gagal menyimpan pembayaran' })
  }
}

const getOrderDetail = async (req, res) => {
  const userId = req.user.id
  const orderId = req.params.id

  try {
    const [orders] = await db.execute(
      'SELECT * FROM `order` WHERE order_id = ? AND user_id = ?',
      [orderId, userId]
    )
    const order = orders[0]
    if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' })

    const [items] = await db.execute(
      `SELECT oi.order_item_id, oi.quantity, oi.subtotal,
              p.product_name, p.type, p.thick, p.avg_weight_per_stick
       FROM order_item oi
       JOIN product p ON oi.product_id = p.product_id
       WHERE oi.order_id = ?`,
      [orderId]
    )

    const [payments] = await db.execute(
      `SELECT payment_id, amount, status, proof_of_payment, created_at, verified_at
       FROM payment WHERE order_id = ? AND user_id = ?`,
      [orderId, userId]
    )

    res.json({
      ...order,
      items,
      payment: payments[0] || null
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
}

const getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.execute(
      `SELECT o.*, u.shop_name FROM \`order\` o
       JOIN \`user\` u ON o.user_id = u.user_id
       ORDER BY o.order_date DESC`
    )

    const orderIds = orders.map(o => o.order_id)
    let items = []

    if (orderIds.length) {
      const [itemResults] = await db.query(
        `SELECT oi.order_item_id, oi.order_id, oi.quantity, oi.subtotal,
                p.product_id, p.product_name, p.type, p.thick, p.avg_weight_per_stick
         FROM order_item oi
         JOIN product p ON oi.product_id = p.product_id
         WHERE oi.order_id IN (?)`,
        [orderIds]
      )
      items = itemResults
    }

    const orderWithItems = orders.map(order => ({
      ...order,
      items: items.filter(i => i.order_id === order.order_id)
    }))

    res.json(orderWithItems)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Gagal mengambil data order' })
  }
}

const updateOrderStatus = async (req, res) => {
  const orderId = req.params.id
  const { status } = req.body

  const allowed = ['pending','processing','shipped','delivered','picked_up']
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Status tidak valid' })

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const [result] = await conn.execute(
      'UPDATE `order` SET status = ? WHERE order_id = ?',
      [status, orderId]
    )
    if (result.affectedRows === 0) {
      await conn.rollback(); conn.release();
      return res.status(404).json({ error: 'Order tidak ditemukan' })
    }

    const [[orderRow]] = await conn.execute(
      'SELECT user_id FROM `order` WHERE order_id = ?',
      [orderId]
    )

    const textMap = {
      pending:    'dibatalkan',
      processing: 'sedang dikemas',
      shipped:    'sedang diantar',
      delivered:  'telah diantar',
      picked_up:  'telah diambil'
    }
    const message = `Pesanan #${orderId} Anda ${textMap[status] || status}.`

    await conn.execute(
      'INSERT INTO notification (user_id, order_id, message, is_read, created_at) VALUES (?, ?, ?, FALSE, NOW())',
      [orderRow.user_id, orderId, message]
    )

    await conn.commit()
    conn.release()
    res.json({ message: 'Status diperbarui dan notifikasi terkirim' })
  } catch (err) {
    await conn.rollback()
    conn.release()
    console.error(err)
    res.status(500).json({ error: 'Gagal memperbarui status' })
  }
}

const cancelPayment = async (req, res) => {
  const userId = req.user.id
  const orderId = req.params.id

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const [orders] = await conn.execute(
      'SELECT * FROM `order` WHERE order_id = ? AND user_id = ? AND status = ?',
      [orderId, userId, 'pending']
    )
    if (!orders.length) {
      await conn.rollback(); conn.release();
      return res.status(404).json({ error: 'Order tidak ditemukan atau tidak bisa dibatalkan' })
    }

    const [items] = await conn.execute(
      'SELECT product_id, quantity FROM order_item WHERE order_id = ?',
      [orderId]
    )
    for (const it of items) {
      await conn.execute(
        'UPDATE product SET stock = stock + ? WHERE product_id = ?',
        [it.quantity, it.product_id]
      )
    }

    await conn.execute('DELETE FROM payment WHERE order_id = ? AND user_id = ?', [orderId, userId])
    await conn.execute('DELETE FROM order_item WHERE order_id = ?', [orderId])
    await conn.execute('DELETE FROM `order` WHERE order_id = ? AND user_id = ?', [orderId, userId])

    await conn.commit()
    conn.release()
    res.json({ message: 'Pembayaran dibatalkan dan stok dikembalikan' })
  } catch (err) {
    await conn.rollback()
    conn.release()
    console.error(err)
    res.status(500).json({ error: 'Gagal membatalkan pembayaran' })
  }
}

const confirmDelivery = async (req, res) => {
  const userId = req.user?.id;
  const orderId = req.params.id;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [orders] = await db.execute(
      'SELECT * FROM `order` WHERE order_id = ? AND user_id = ? AND status = ?',
      [orderId, userId, 'shipped']
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan atau tidak bisa dikonfirmasi' });
    }

    await db.execute(
      'UPDATE `order` SET status = ? WHERE order_id = ?',
      ['delivered', orderId]
    );

    res.json({ message: 'Pesanan berhasil dikonfirmasi sebagai selesai' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal konfirmasi pesanan' });
  }
};

module.exports = {
  checkout,
  createPayment,
  getOrderDetail,
  getAllOrders,
  updateOrderStatus,
  cancelPayment,
  confirmDelivery
}
