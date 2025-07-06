const db = require('../config/db');

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

async function cancelOverdueOrders() {
  let conn;
  console.log('[CRON] Menjalankan cancelOverdueOrders...');
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const [overdueOrders] = await conn.execute(
      `SELECT o.order_id, o.user_id, o.order_date
       FROM \`order\` o
       LEFT JOIN payment p ON o.order_id = p.order_id
       WHERE o.status IN ('unpaid', 'pending', 'pending_dp', 'pending_fullpayment')
       AND TIMESTAMPDIFF(MINUTE, o.order_date, UTC_TIMESTAMP()) >= 1
       AND p.payment_type IN ('downpayment', 'fullpayment')
       AND p.status IN ('pending_dp', 'pending_fullpayment')
       GROUP BY o.order_id, o.user_id, o.order_date`
    );

    console.log(`[CRON] Total order kadaluwarsa ditemukan: ${overdueOrders.length}`);

    if (overdueOrders.length === 0) {
      await conn.commit();
      return;
    }

    for (const order of overdueOrders) {
      const { order_id, user_id, order_date } = order;

      console.log(`[CRON] Membatalkan order #${order_id} (dibuat: ${order_date})`);

      await conn.execute(
        `UPDATE \`order\` SET status = 'expired' WHERE order_id = ?`,
        [order_id]
      );

      await conn.execute(
        `UPDATE payment
         SET status = 'failed',
             message = 'Dibatalkan karena melewati batas waktu pembayaran awal.'
         WHERE order_id = ?
           AND payment_type IN ('downpayment', 'fullpayment')
           AND status IN ('pending_dp', 'pending_fullpayment')`,
        [order_id]
      );

      const notifMessage = `Pesanan #${order_id} telah dibatalkan secara otomatis karena melewati batas waktu pembayaran awal.`;

      await conn.execute(
        `INSERT INTO notification (user_id, order_id, message, is_read, created_at)
         VALUES (?, ?, ?, FALSE, ?)`,
        [user_id, order_id, notifMessage, getJakartaDateTime()]
      );
    }

    await conn.commit();
  } catch (error) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackError) {
        console.error('[CRON] Rollback gagal:', rollbackError.message);
      }
    }
    console.error('[CRON] Gagal membatalkan pesanan kadaluarsa:', error);
  } finally {
    if (conn) conn.release();
  }
}

module.exports = cancelOverdueOrders;
