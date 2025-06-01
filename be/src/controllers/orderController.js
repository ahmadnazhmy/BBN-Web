const db = require('../config/db');

function getJakartaDateTime() {
  const now = new Date();
  const offset = 7 * 60 * 60 * 1000;
  return new Date(now.getTime() + offset)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
}

const checkout = async (req, res) => {
  let conn;
  try {
    const { delivery_method, location, cart, payment_type, amount, message } = req.body;
    const user_id = req.user.id;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Keranjang kosong' });
    }
    if (!delivery_method || !location) {
      return res.status(400).json({ error: 'Delivery method dan lokasi wajib diisi' });
    }

    const paymentTypeLower = payment_type?.toLowerCase();
    if (!['fullpayment', 'downpayment'].includes(paymentTypeLower)) {
      return res.status(400).json({ error: 'Payment type tidak valid' });
    }

    const total_price = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    if (paymentTypeLower === 'downpayment' && amount < total_price * 0.2) {
      return res.status(400).json({ error: `DP minimal 20% dari total harga (${total_price * 0.2})` });
    }
    if (paymentTypeLower === 'fullpayment' && amount < total_price) {
      return res.status(400).json({ error: 'Fullpayment harus sama atau lebih dari total harga' });
    }

    conn = await db.getConnection();
    await conn.beginTransaction();

    const orderDateTime = getJakartaDateTime();
    const [orderResult] = await conn.execute(
      `INSERT INTO \`order\` (user_id, order_date, status, total_price, delivery_method, location)
         VALUES (?, ?, 'unpaid', ?, ?, ?)`,
      [user_id, orderDateTime, total_price, delivery_method, location]
    );
    const order_id = orderResult.insertId;

    for (const item of cart) {
      const subtotal = item.unit_price * item.quantity;
      await conn.execute(
        `INSERT INTO order_item (order_id, product_id, quantity, subtotal)
           VALUES (?, ?, ?, ?)`,
        [order_id, item.product_id, item.quantity, subtotal]
      );
    }

    const initialStatus = paymentTypeLower === 'downpayment' ? 'pending_dp' : 'pending_fullpayment';

    const [paymentResult] = await conn.execute(
      `INSERT INTO payment (order_id, user_id, amount, payment_type, status, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [order_id, user_id, amount, paymentTypeLower, initialStatus, message || '']
    );
    const payment_id = paymentResult.insertId;

    await conn.commit();
    res.status(201).json({ message: 'Checkout berhasil. Silakan upload bukti pembayaran.', order_id, payment_id });
  } catch (error) {
    console.error('Checkout error:', error);
    if (conn) await conn.rollback();
    res.status(500).json({ error: 'Gagal melakukan checkout' });
  } finally {
    if (conn) conn.release();
  }
};

const getOrderDetailByPaymentId = async (req, res) => {
  try {
    const tokenUserId = req.user?.id;
    const paymentId = req.params.id;

    if (!tokenUserId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID harus disertakan' });
    }

    const [payments] = await db.execute(
      `SELECT order_id, user_id, payment_type, status, amount, payment_method, proof_of_payment, message
         FROM payment
         WHERE payment_id = ?`,
      [paymentId]
    );

    if (!payments.length) {
      return res.status(404).json({ message: 'Payment tidak ditemukan' });
    }

    const payment = payments[0];
    const orderId = payment.order_id;
    const paymentUserId = payment.user_id;

    const [orders] = await db.execute(
      `SELECT o.order_id, o.user_id, o.delivery_method, o.location, o.total_price,
              o.status, o.order_date, o.do_file_url, u.shop_name
         FROM \`order\` o
         JOIN user u ON o.user_id = u.user_id
         WHERE o.order_id = ? AND o.user_id = ?`,
      [orderId, paymentUserId]
    );

    if (!orders.length) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }

    const order = orders[0];

    const [items] = await db.execute(
      `SELECT oi.order_item_id, oi.quantity, oi.subtotal,
              p.product_name, p.type, p.thick, p.avg_weight_per_stick
         FROM order_item oi
         JOIN product p ON oi.product_id = p.product_id
         WHERE oi.order_id = ?`,
      [orderId]
    );

    const [allPaymentsForOrder] = await db.execute(
      `SELECT payment_id, order_id, user_id, amount, payment_type, status, payment_method, proof_of_payment, message
         FROM payment
         WHERE order_id = ? AND user_id = ?
         ORDER BY created_at ASC`,
      [orderId, paymentUserId]
    );

    return res.json({
      order: {
        ...order,
        amount_for_this_payment: payment.amount,
      },
      items,
      payment,
      payments: allPaymentsForOrder,
    });

  } catch (err) {
    console.error('Gagal mengambil data detail berdasarkan payment_id:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.execute(
      `SELECT o.*, u.shop_name
         FROM \`order\` o
         JOIN \`user\` u ON o.user_id = u.user_id
         ORDER BY o.order_date DESC`
    );

    const orderIds = orders.map(o => o.order_id);
    let items = [];
    let payments = [];

    if (orderIds.length) {
      const [itemResults] = await db.query(
        `SELECT oi.order_item_id, oi.order_id, oi.quantity, oi.subtotal,
                p.product_id, p.product_name, p.type, p.thick, p.avg_weight_per_stick
           FROM order_item oi
           JOIN product p ON oi.product_id = p.product_id
           WHERE oi.order_id IN (${orderIds.map(() => '?').join(',')})`,
        orderIds
      );
      items = itemResults;

      const [paymentResults] = await db.query(
        `SELECT payment_id, order_id, user_id, amount, payment_type, status, payment_method, proof_of_payment, message FROM payment WHERE order_id IN (?)`,
        [orderIds]
      );
      payments = paymentResults;
    }

    const orderWithDetails = orders.map(order => ({
      ...order,
      items: items.filter(i => i.order_id === order.order_id),
      payments: payments.filter(p => p.order_id === order.order_id)
    }));

    res.json(orderWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil data order' });
  }
};

const updateOrderStatus = async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  const allowedStatuses = [
    'unpaid', 'pending_fullpayment', 'pending_dp', 'processing',
    'ready', 'shipped', 'delivered', 'picked_up', 'cancel'
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status tidak valid.' });
  }

  const allowedTransitions = {
    unpaid: ['pending_dp', 'pending_fullpayment', 'cancel'],
    pending_dp: ['processing', 'cancel'],
    pending_fullpayment: ['processing', 'cancel'],
    processing: ['ready', 'cancel'],
    ready: ['shipped', 'picked_up', 'cancel'],
    shipped: ['delivered'],
    picked_up: [],
    delivered: [],
    cancel: []
  };

  const generateNotificationMessage = (orderId, oldStatus, newStatus) => {
    const messages = {
      shipped: `Pesanan Anda #${orderId} sedang diantar.`,
      picked_up: `Pesanan Anda #${orderId} telah berhasil diambil.`,
      ready: `Pesanan Anda #${orderId} siap untuk diambil.`,
      delivered: `Pesanan Anda #${orderId} telah berhasil diantar.`,
      cancel: `Pesanan Anda #${orderId} telah dibatalkan.`,
      processing: `Pesanan Anda #${orderId} sedang diproses.`
    };

    return oldStatus !== newStatus ? messages[newStatus] || '' : '';
  };

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [orderRows] = await conn.execute(
      'SELECT status, user_id FROM \`order\` WHERE order_id = ? FOR UPDATE',
      [orderId]
    );

    if (orderRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Order tidak ditemukan.' });
    }

    const currentStatus = orderRows[0].status;
    const userId = orderRows[0].user_id === undefined ? null : orderRows[0].user_id;

    if (['delivered', 'picked_up', 'cancel'].includes(currentStatus)) {
      await conn.rollback();
      return res.status(400).json({ error: 'Status pesanan sudah final dan tidak dapat diubah.' });
    }

    const validNextStatuses = allowedTransitions[currentStatus] || [];
    if (!validNextStatuses.includes(status)) {
      await conn.rollback();
      return res.status(400).json({ error: `Transisi status dari '${currentStatus}' ke '${status}' tidak diperbolehkan.` });
    }

    if ((status === 'shipped' && currentStatus !== 'shipped') || (status === 'picked_up' && currentStatus !== 'picked_up')) {
      const [orderItems] = await conn.execute(
        'SELECT product_id, quantity FROM order_item WHERE order_id = ?',
        [orderId]
      );

      if (orderItems.length === 0) {
        await conn.rollback();
        return res.status(400).json({ error: 'Tidak ada item dalam pesanan ini.' });
      }

      for (const item of orderItems) {
        const [stockRows] = await conn.execute(
          'SELECT SUM(quantity_change) AS current_stock FROM stock_history WHERE product_id = ? FOR UPDATE',
          [item.product_id]
        );

        const currentStock = stockRows[0].current_stock || 0;

        if (currentStock < item.quantity) {
          await conn.rollback();
          return res.status(400).json({
            error: `Stok tidak cukup untuk produk ID ${item.product_id}. Stok saat ini: ${currentStock}, Dibutuhkan: ${item.quantity}. Harap update stok terlebih dahulu.`
          });
        }
      }

      for (const item of orderItems) {
        await conn.execute(
          'INSERT INTO stock_history (product_id, quantity, quantity_change, type, source) VALUES (?, ?, ?, ?, ?)',
          [item.product_id, item.quantity, -item.quantity, 'out', 'shipment']
        );
      }
    }

    const notifMessage = generateNotificationMessage(orderId, currentStatus, status);
    if (notifMessage && userId !== null) {
      await conn.execute(
        'INSERT INTO notification (user_id, order_id, message, is_read, created_at) VALUES (?, ?, ?, ?, NOW())',
        [userId, orderId, notifMessage, false]
      );
    } else if (notifMessage && userId === null) {
      console.warn(`Peringatan: Notifikasi untuk order ${orderId} (${notifMessage}) tidak dibuat karena user_id null.`);
    }

    await conn.execute(
      'UPDATE \`order\` SET status = ? WHERE order_id = ?',
      [status, orderId]
    );

    await conn.commit();
    res.json({ message: 'Status order berhasil diupdate.' });

  } catch (err) {
    await conn.rollback();
    console.error('Error updating order status:', err);

    res.status(500).json({ error: 'Gagal update status order: ' + err.message });
  } finally {
    if (conn) {
      conn.release();
    }
  }
};

const cancelPayment = async (req, res) => {
  const userId = req.user.id;
  const orderId = req.params.id;

  const conn = await db.getConnection();
  try { 
    await conn.beginTransaction();

    const [orders] = await conn.execute(
      'SELECT * FROM \`order\` WHERE order_id = ? AND user_id = ? AND status IN (?, ?, ?)',
      [orderId, userId, 'pending_fullpayment', 'pending_dp', 'unpaid']
    );
    if (!orders.length) {
      await conn.rollback(); conn.release();
      return res.status(404).json({ error: 'Order tidak ditemukan atau tidak bisa dibatalkan' });
    }

    await conn.execute('UPDATE \`order\` SET status = ? WHERE order_id = ?', ['cancel', orderId]);
    await conn.execute('DELETE FROM payment WHERE order_id = ? AND user_id = ?', [orderId, userId]);

    await conn.commit();
    conn.release();
    res.json({ message: 'Pesanan dibatalkan' });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error(err);
    res.status(500).json({ error: 'Gagal membatalkan pesanan' });
  }
};

const confirmDelivery = async (req, res) => {
  const userId = req.user?.id;
  const orderId = req.params.id;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [orders] = await db.execute(
      'SELECT * FROM \`order\` WHERE order_id = ? AND user_id = ? AND status = ?',
      [orderId, userId, 'shipped']
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan atau tidak bisa dikonfirmasi' });
    }

    await db.execute(
      'UPDATE \`order\` SET status = ? WHERE order_id = ?',
      ['delivered', orderId]
    );

    res.json({ message: 'Pesanan berhasil dikonfirmasi sebagai selesai' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal konfirmasi pesanan' });
  }
};

const uploadDOFile = async (req, res) => {
  const { orderId } = req.params;
  const doFileUrl = req.file?.path;

  if (!doFileUrl) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `UPDATE \`order\` SET file_delivery_order = ? WHERE order_id = ?`,
      [doFileUrl, orderId]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ message: 'Pesanan tidak ditemukan atau tidak dapat diperbarui.' });
    }

    await conn.commit();
    conn.release();
    res.status(200).json({
      message: 'File DO berhasil diunggah dan disimpan!',
      orderId: orderId,
      doFileUrl: doFileUrl,
    });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error('Error saat mengunggah file DO:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengunggah file DO.' });
  }
};

const updateEstimatedDate = async (req, res) => {
  const { orderId } = req.params;
  const { estimated_date } = req.body;

  if (!estimated_date) {
    return res.status(400).json({ message: 'Field estimated_date wajib diisi' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      'UPDATE \`order\` SET estimated_date = ? WHERE order_id = ?',
      [estimated_date, orderId]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ message: 'Order tidak ditemukan.' });
    }

    await conn.commit();
    res.json({ message: 'Estimasi waktu berhasil disimpan' });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  checkout,
  getOrderDetailByPaymentId,
  getAllOrders,
  updateOrderStatus,
  cancelPayment,
  confirmDelivery,
  uploadDOFile,
  updateEstimatedDate
};