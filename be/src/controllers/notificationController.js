const db = require('../config/db')

const getNotifications = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [notifs] = await db.execute(
      `SELECT n.*, 
              o.order_id, o.method AS delivery_method, o.status,
              CASE WHEN o.status = 'shipped' THEN FALSE ELSE TRUE END AS is_confirmed,
              'order_delivered' AS type
       FROM notification n
       LEFT JOIN \`order\` o ON n.user_id = o.user_id AND n.message LIKE CONCAT('%#', o.order_id, '%')
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC`,
      [userId]
    );

    res.json(notifs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil notifikasi' });
  }
};

const markNotificationAsRead = async (req, res) => {
  const userId = req.user?.id;
  const notifId = req.params.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [result] = await db.execute(
      'UPDATE notification SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notifId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notifikasi tidak ditemukan' });
    }

    res.json({ message: 'Notifikasi ditandai sebagai dibaca' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memperbarui notifikasi' });
  }
};

const deleteNotification = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [result] = await db.execute(
      'DELETE FROM notification WHERE user_id = ?',
      [userId]
    );

    res.json({ message: 'Semua notifikasi berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus semua notifikasi' });
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  deleteNotification
};
