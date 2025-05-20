const db = require('../config/db');

const uploadProof = async (req, res) => {
  const user_id = req.user.id;
  const order_id = req.body.order_id;
  const amount = parseInt(req.body.amount) || 0;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'Bukti pembayaran tidak ditemukan' });
  }

  const filePath = file.path;  

  try {
    const conn = await db.getConnection();
    const [orders] = await conn.execute(`
      SELECT order_id FROM \`order\` WHERE order_id = ? AND user_id = ?
    `, [order_id, user_id]);

    if (orders.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Order tidak ditemukan atau bukan milik Anda' });
    }

    const [existingPayments] = await conn.execute(`
      SELECT payment_id FROM payment
      WHERE order_id = ? AND user_id = ? AND status IN ('pending', 'failed')
      LIMIT 1
    `, [order_id, user_id]);

    if (existingPayments.length > 0) {
      const paymentId = existingPayments[0].payment_id;
      await conn.execute(`
        UPDATE payment
        SET proof_of_payment = ?, amount = ?, status = 'pending', message = NULL
        WHERE payment_id = ?
      `, [filePath, amount, paymentId]);
    } else {
      await conn.execute(`
        INSERT INTO payment (order_id, user_id, amount, status, proof_of_payment, created_at)
        VALUES (?, ?, ?, 'pending', ?, NOW())
      `, [order_id, user_id, amount, filePath]);
    }

    conn.release();
    res.status(201).json({ message: 'Bukti pembayaran berhasil diupload' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal upload bukti pembayaran' });
  }
};


const getAllPayments = async (req, res) => {
  try {
    let query = `
      SELECT 
        p.payment_id,
        p.order_id,
        p.amount,
        p.status,
        p.message,
        p.proof_of_payment,
        p.created_at,
        p.verified_at,
        u.shop_name,
        o.status AS order_status
      FROM payment p
      JOIN user u ON p.user_id = u.user_id
      JOIN \`order\` o ON p.order_id = o.order_id
      ORDER BY p.created_at DESC
    `;

    const [payments] = await db.execute(query);

    if (payments.length === 0) {
      return res.status(404).json({ error: 'Tidak ada data pembayaran' });
    }

    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data pembayaran' });
  }
};

const updatePaymentStatus = async (req, res) => {
  const paymentId = req.params.id;
  const { status } = req.body;
  const allowedStatus = ['pending', 'completed', 'failed'];

  if (!status || !allowedStatus.includes(status)) {
    return res.status(400).json({ error: 'Status tidak valid' });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    if (status === 'completed') {
      await conn.execute(`
        UPDATE payment 
        SET status = ?, message = NULL, verified_at = NOW()
        WHERE payment_id = ?
      `, [status, paymentId]);

      const [[paymentRow]] = await conn.execute(
        `SELECT order_id FROM payment WHERE payment_id = ?`,
        [paymentId]
      );

      if (paymentRow) {
        await conn.execute(`
          UPDATE \`order\` SET status = 'dikemas' WHERE order_id = ?
        `, [paymentRow.order_id]);
      }

    } else if (status === 'pending' || status === 'failed') {
      await conn.execute(`
        UPDATE payment 
        SET status = ?, verified_at = NULL
        WHERE payment_id = ?
      `, [status, paymentId]);
    }

    const [[paymentRowUser]] = await conn.execute(
      `SELECT user_id, order_id FROM payment WHERE payment_id = ?`,
      [paymentId]
    );

    if (!paymentRowUser) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
    }

    const textMap = {
      pending: 'pembayaran Anda masih menunggu verifikasi.',
      completed: 'pembayaran Anda telah berhasil.',
      failed: 'pembayaran Anda gagal. Silakan cek kembali dan coba upload bukti baru.'
    };

    const notifMessage = `Status pembayaran untuk Pesanan #${paymentRowUser.order_id} ${textMap[status]}`;

    await conn.execute(
      `INSERT INTO notification (user_id, order_id, message, is_read, created_at)
       VALUES (?, ?, ?, FALSE, NOW())`,
      [paymentRowUser.user_id, paymentRowUser.order_id, notifMessage]
    );

    await conn.commit();
    conn.release();

    res.status(200).json({ message: 'Status pembayaran berhasil diubah' });
  } catch (err) {
    console.error(err);
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
      INSERT INTO notification (user_id, message, is_read, created_at)
      VALUES (?, ?, FALSE, NOW())
    `, [paymentRow.user_id, notifMessage]);

    await conn.commit();
    conn.release();

    res.status(200).json({ message: 'Pesan pembayaran berhasil diperbarui dan notifikasi terkirim' });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error(err);
    res.status(500).json({ error: 'Gagal memperbarui pesan pembayaran' });
  }
};


module.exports = { 
  uploadProof,
  getAllPayments,
  updatePaymentStatus,
  updatePaymentMessage
};
