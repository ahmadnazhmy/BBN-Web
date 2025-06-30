const db = require('../config/db');
const pool = require('../config/db');

function getJakartaDateTime() {
  const now = new Date();
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  };

  const jakartaTimeString = new Intl.DateTimeFormat('en-CA', options).format(now);

  return jakartaTimeString.replace(/(\d{4})-(\d{2})-(\d{2}),? (\d{2}):(\d{2}):(\d{2})/, '$1-$2-$3 $4:$5:$6');
}

async function getOrderPaymentDetailsWithItems(req, res) {
  const { payment_id } = req.query;
  if (!payment_id) return res.status(400).json({ error: 'payment_id harus disertakan' });

  try {
    const [paymentRows] = await pool.query('SELECT *, proof_of_payment AS proof_of_payment FROM payment WHERE payment_id = ?', [payment_id]);
    if (paymentRows.length === 0) return res.status(404).json({ error: 'Payment tidak ditemukan' });
    const payment = paymentRows[0];

    const [orderRows] = await pool.query('SELECT * FROM \`order\`WHERE order_id = ?', [payment.order_id]);
    if (orderRows.length === 0) return res.status(404).json({ error: 'Order tidak ditemukan' });
    const order = orderRows[0];

    const [payments] = await pool.query('SELECT *, proof_of_payment FROM payment WHERE order_id = ?', [order.order_id]);

    const [items] = await pool.query(
      `SELECT
          oi.order_item_id,
          oi.order_id,
          oi.product_id,
          oi.quantity,
          oi.subtotal,
          p.product_name AS product_name,
          p.type,
          p.thick,
          p.avg_weight_per_stick
        FROM
          order_item oi
        JOIN
          product p ON oi.product_id = p.product_id
        WHERE
          oi.order_id = ?`,
      [order.order_id]
    );

    res.json({
      order,
      payment,
      payments,
      items,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil data order' });
  }
}

const uploadProof = async (req, res) => {
    const user_id = req.user.id;
    const order_id = req.body.order_id;
    const amount = parseInt(req.body.amount) || 0;
    const proofUrl = req.file?.path;
    const paymentType = req.body.payment_type || '';
    const paymentTypeLower = paymentType.toLowerCase();

    if (paymentTypeLower && !['downpayment', 'fullpayment', 'settlement'].includes(paymentTypeLower)) {
        return res.status(400).json({ message: 'Invalid payment type' });
    }

    if (!proofUrl) {
        return res.status(400).json({ error: 'Bukti pembayaran tidak ditemukan' });
    }

    const payment_method = req.body.payment_method;
    const validMethods = [
        'bank_mandiri', 'bank_bca', 'bank_bni', 'bank_bri',
        'bank_btn', 'bank_bsi', 'shopeepay', 'gopay', 'dana'
    ];
    if (!payment_method || !validMethods.includes(payment_method)) {
        return res.status(400).json({ error: 'Metode pembayaran tidak valid' });
    }

    try {
        const conn = await db.getConnection();
        const [orders] = await conn.execute(`SELECT order_id FROM \`order\` WHERE order_id = ? AND user_id = ?`, [order_id, user_id]);

        if (orders.length === 0) {
            conn.release();
            return res.status(404).json({ error: 'Order tidak ditemukan atau bukan milik Anda' });
        }

        const allowedStatuses = ['pending_dp', 'pending_fullpayment', 'failed'];
        const placeholders = allowedStatuses.map(() => '?').join(', ');
        const sql = `SELECT payment_id FROM payment WHERE order_id = ? AND user_id = ? AND status IN (${placeholders}) LIMIT 1`;
        const params = [order_id, user_id, ...allowedStatuses];
        const [existingPayments] = await conn.execute(sql, params);

        const initialStatus = 'pending_verification';
        const currentJakartaTime = getJakartaDateTime();

        if (existingPayments.length > 0) {
            const paymentId = existingPayments[0].payment_id;
            await conn.execute(`UPDATE payment SET proof_of_payment = ?, amount = ?, payment_method = ?, status = ?, message = NULL, created_at = ? WHERE payment_id = ?`, [proofUrl, amount, payment_method, initialStatus, currentJakartaTime, paymentId]);
        } else {
            await conn.execute(`INSERT INTO payment (order_id, user_id, amount, status, proof_of_payment, payment_method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, [order_id, user_id, amount, initialStatus, proofUrl, payment_method, currentJakartaTime]);
        }

        await conn.execute(`UPDATE \`order\` SET status = 'pending' WHERE order_id = ?`, [order_id]);

        conn.release();
        res.status(201).json({ message: 'Bukti pembayaran berhasil diupload', proofUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal upload bukti pembayaran' });
    }
};

const getAllPayments = async (req, res) => {
  const userId = req.query.user_id;

  let query = `
    SELECT
      p.payment_id,
      p.order_id,
      p.amount,
      p.payment_type,
      p.payment_method,
      p.status,
      p.message,
      p.proof_of_payment,
      p.created_at,
      p.verified_at,
      p.due_date,
      COALESCE(u.shop_name, '-') AS shop_name,
      COALESCE(o.status, '-') AS order_status,
      COALESCE(o.total_price, 0) AS total_price
    FROM payment p
    LEFT JOIN user u ON p.user_id = u.user_id
    LEFT JOIN \`order\` o ON p.order_id = o.order_id
  `;

  const params = [];

  if (userId) {
    query += ` WHERE p.user_id = ? `;
    params.push(userId);
  }

  query += ` ORDER BY p.created_at DESC `;

  try {
    const [rows] = await db.execute(query, params);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Tidak ada data pembayaran' });
    }

    return res.status(200).json(rows);
  } catch (err) {
    console.error('Error dalam getAllPayments:', err);
    res.status(500).json({ error: 'Gagal mengambil data pembayaran', detail: err.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  const paymentId = req.params.id;
  const { status } = req.body;

  const allowedStatus = [
    'pending_dp',
    'dp_paid',
    'pending_fullpayment',
    'fullpayment_paid',
    'pending_verification',
    'completed',
    'failed'
  ];

  if (!status || !allowedStatus.includes(status)) {
    console.log(`[DEBUG] Status "${status}" tidak valid atau tidak ditemukan.`);
    return res.status(400).json({ error: 'Status tidak valid' });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [[paymentRow]] = await conn.execute(
      `SELECT order_id FROM payment WHERE payment_id = ?`,
      [paymentId]
    );

    if (!paymentRow) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
    }

    const orderId = paymentRow.order_id;

    if (
      status === 'dp_paid' ||
      status === 'fullpayment_paid' ||
      status === 'completed'
    ) {
      await conn.execute(`
        UPDATE payment
        SET status = ?, message = NULL, verified_at = ?
        WHERE payment_id = ?
      `, [status, getJakartaDateTime(), paymentId]);

      await conn.execute(`
        UPDATE \`order\`
        SET status = 'processing'
        WHERE order_id = ?
      `, [orderId]);
    } else if (
      status === 'pending_dp' ||
      status === 'pending_fullpayment' ||
      status === 'pending_verification' ||
      status === 'failed'
    ) {
      await conn.execute(`
        UPDATE payment
        SET status = ?, verified_at = NULL
        WHERE payment_id = ?
      `, [status, paymentId]);

      let newOrderStatus = 'pending';
      if (status === 'failed') {
        newOrderStatus = 'unpaid';
      }

      await conn.execute(`
        UPDATE \`order\`
        SET status = ?
        WHERE order_id = ?
      `, [newOrderStatus, orderId]);
    }

    const [[paymentRowUser]] = await conn.execute(
      `SELECT user_id FROM payment WHERE payment_id = ?`,
      [paymentId]
    );

    const textMap = {
      pending_dp: 'pembayaran uang muka masih menunggu verifikasi.',
      dp_paid: 'uang muka telah diterima. Silakan lanjutkan pelunasan.',
      pending_fullpayment: 'pelunasan masih menunggu verifikasi.',
      fullpayment_paid: 'pelunasan telah diterima.',
      pending_verification: 'pembayaran Anda masih menunggu verifikasi.',
      completed: 'pembayaran Anda telah berhasil.',
      failed: 'pembayaran Anda gagal. Silakan cek kembali dan coba upload bukti baru.'
    };

    const notifMessage = `Status pembayaran untuk Pesanan #${orderId} ${textMap[status]}`;

    await conn.execute(
      `INSERT INTO notification (user_id, order_id, message, is_read, created_at)
      VALUES (?, ?, ?, FALSE, ?)`,
      [paymentRowUser.user_id, orderId, notifMessage, getJakartaDateTime()]
    );

    await conn.commit();
    conn.release();

    res.status(200).json({ message: 'Status pembayaran berhasil diubah' });
  } catch (err) {
    console.error(`[ERROR] Terjadi kesalahan saat memperbarui status pembayaran:`, err);
    await conn.rollback();
    conn.release();
    res.status(500).json({ error: 'Terjadi kesalahan saat memperbarui status pembayaran' });
  }
};

const updatePaymentMessage = async (req, res) => {
  const paymentId = req.params.id;
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Pesan tidak valid' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [updateResult] = await conn.execute(`
      UPDATE payment
      SET message = ?
      WHERE payment_id = ?
    `, [message, paymentId]);

    if (updateResult.affectedRows === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
    }

    const [[paymentRow]] = await conn.execute(`
      SELECT user_id, order_id FROM payment WHERE payment_id = ?
    `, [paymentId]);

    if (!paymentRow) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Pembayaran tidak ditemukan saat ambil data user dan order' });
    }

    const notifMessage =
      `Admin menambahkan pesan pada pembayaran Pesanan #${paymentRow.order_id}: "${message}"`;

    await conn.execute(`
      INSERT INTO notification (user_id, order_id, message, is_read, created_at)
      VALUES (?, ?, ?, FALSE, ?)
    `, [paymentRow.user_id, paymentRow.order_id, notifMessage, getJakartaDateTime()]);

    await conn.commit();
    conn.release();

    res.status(200).json({ message: 'Pesan pembayaran berhasil diperbarui dan notifikasi terkirim' });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Error updatePaymentMessage:', err);
    res.status(500).json({ error: 'Gagal memperbarui pesan pembayaran' });
  }
};

const getPaymentByPaymentId = async (req, res) => {
  const paymentId = req.query.payment_id;

  if (!paymentId) {
    return res.status(400).json({ error: "Payment ID diperlukan" });
  }

  try {
    const [paymentRows] = await db.execute(`
      SELECT
          p.*,
          p.proof_of_payment,
          u.shop_name,
          u.email,
          u.phone,
          o.location,
          o.delivery_method,
          o.order_date
      FROM payment p
      JOIN user u ON p.user_id = u.user_id
      JOIN \`order\` o ON p.order_id = o.order_id
      WHERE p.payment_id = ?
      LIMIT 1
    `, [paymentId]);

    if (paymentRows.length === 0) {
      return res.status(404).json({ error: "Pembayaran tidak ditemukan" });
    }

    const payment = paymentRows[0];
    const orderId = payment.order_id;
    const [items] = await db.execute(`
      SELECT
          oi.*,
          pr.unit_price,
          pr.product_name,
          pr.type,
          pr.thick,
          pr.avg_weight_per_stick
      FROM order_item oi
      JOIN product pr ON oi.product_id = pr.product_id
      WHERE oi.order_id = ?
    `, [orderId]);

    res.json({
      payment: {
          ...payment,
      },
      user: {
        shop_name: payment.shop_name,
        email: payment.email,
        phone: payment.phone
      },
      delivery: {
        location: payment.location,
        delivery_method: payment.delivery_method
      },
      items: items.map(item => ({
          ...item,
          order_item_id: item.order_item_id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          product_name: item.product_name,
          type: item.type,
          thick: item.thick,
          avg_weight_per_stick: item.avg_weight_per_stick
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data pembayaran" });
  }
};

async function getUnpaidCount(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT COUNT(*) AS count
         FROM \`order\`
         WHERE user_id = ? AND LOWER(status) = 'unpaid'`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      return res.json({ count: 0 });
    }

    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Error fetching unpaid count:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

const createInvoiceSettlement = async (req, res) => {
  try {
    const { order_id, due_date } = req.body;
    const [orders] = await db.query(
      'SELECT total_price, user_id FROM \`order\` WHERE order_id = ?',
      [order_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }

    const totalOrder = orders[0].total_price;
    const orderUserId = orders[0].user_id;

    const [payments] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_paid 
       FROM payment 
       WHERE order_id = ? AND status IN ('dp_paid', 'completed')`,
      [order_id]
    );
    const totalPaid = payments[0].total_paid;

    const remainingAmount = totalOrder - totalPaid;

    if (remainingAmount <= 0) {
      return res.status(400).json({ message: 'Tidak ada sisa pelunasan, pembayaran sudah lunas.' });
    }

    let dueDateToUse;
    if (due_date) {
      dueDateToUse = due_date;
    } else {
      const now = new Date();
      now.setDate(now.getDate() + 7);
      dueDateToUse = now.toISOString().split('T')[0];
    }

    const [insertResult] = await db.execute(
      `INSERT INTO payment 
       (order_id, user_id, payment_type, amount, status, created_at, due_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        order_id,
        orderUserId,
        'settlement',
        remainingAmount,
        'pending_fullpayment',
        getJakartaDateTime(),
        dueDateToUse
      ]
    );

    res.status(201).json({
      message: 'Invoice pelunasan berhasil dibuat',
      payment_id: insertResult.insertId,
      remaining_amount: remainingAmount,
      due_date: dueDateToUse
    });

  } catch (err) {
    console.error('Gagal membuat invoice pelunasan:', err);
    res.status(500).json({ message: 'Gagal membuat invoice pelunasan' });
  }
};

module.exports = {
  getOrderPaymentDetailsWithItems,
  uploadProof,
  getAllPayments,
  updatePaymentStatus,
  updatePaymentMessage,
  getPaymentByPaymentId,
  getUnpaidCount,
  createInvoiceSettlement,
};