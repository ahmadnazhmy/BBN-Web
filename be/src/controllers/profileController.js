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

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      'SELECT shop_name, email, phone, address FROM user WHERE user_id = ?',
      [userId]
    );

    if (!rows.length) return res.status(404).json({ message: 'User tidak ditemukan' });

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil profil' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shop_name, email, phone, address } = req.body;

    await db.query(
      'UPDATE user SET shop_name = ?, email = ?, phone = ?, address = ? WHERE user_id = ?',
      [shop_name, email, phone, address, userId]
    );

    res.status(200).json({ message: 'Profil berhasil diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal memperbarui profil' });
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const [rows] = await db.query(
      'SELECT shop_name, email, phone, address FROM user WHERE user_id = ?',
      [userId]
    );

    if (!rows.length) return res.status(404).json({ message: 'User tidak ditemukan' });

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data user' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT user_id, shop_name, email, phone, address FROM user'
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Tidak ada user ditemukan' });
    }
    res.status(200).json({ users: rows });
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({ message: 'Gagal mengambil data semua user', error: error.message });
  }
};

const getUserPurchaseHistory = async (req, res) => {
  try {
    const userId = req.params.id;

    const [paymentRecords] = await db.query(
      `
      SELECT
          p.payment_id,
          p.created_at AS payment_date, 
          p.amount AS total_price,    
          p.payment_type AS description_or_product_name,
          p.status
      FROM
          payment p
      WHERE
          p.user_id = ?
      ORDER BY
          p.created_at DESC
      `,
      [userId]
    );

    if (paymentRecords.length === 0) {
      return res.status(200).json({ history: [], total_amount: 0, message: 'Belum ada riwayat pembayaran untuk user ini.' });
    }

    const totalAmount = paymentRecords.reduce((sum, record) => sum + record.total_price, 0);

    res.status(200).json({ history: paymentRecords, total_amount: totalAmount });

  } catch (error) {
    console.error(`Error fetching payment history for user ${req.params.id}:`, error);
    res.status(500).json({ message: 'Gagal mengambil riwayat pembayaran', error: error.message });
  }
};

const addRewardToUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { reward_type, discount_percentage, expiry_date, min_purchase_amount, description } = req.body;

    if (!reward_type || !discount_percentage) {
      return res.status(400).json({ message: 'Tipe reward dan persentase diskon harus disediakan.' });
    }

    const rewardCode = `DISCOUNT-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now()}`;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [rewardResult] = await connection.execute(
        `INSERT INTO reward (user_id, reward_type, discount_percentage, code, expiry_date, min_purchase_amount, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, reward_type, discount_percentage, rewardCode, expiry_date, min_purchase_amount, description]
      );
      const rewardId = rewardResult.insertId; 

      const notificationMessage = `Selamat! Anda mendapatkan reward ${reward_type} sebesar ${discount_percentage}%. Gunakan kode: ${rewardCode} sebelum ${new Date(expiry_date).toLocaleDateString('id-ID')}.`;

      await connection.execute(
        `INSERT INTO notification (user_id, order_id, message, is_read, created_at)
        VALUES (?, ?, ?, ?, ?)`,
        [userId, null, notificationMessage, 0, getJakartaDateTime()]
      );

      await connection.commit();

      res.status(201).json({ message: 'Reward berhasil ditambahkan dan notifikasi dikirim!', rewardCode: rewardCode, rewardId: rewardId });

    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release(); 
    }

  } catch (error) {
    console.error(`Error adding reward for user ${req.params.id}:`, error);
    res.status(500).json({ message: 'Gagal menambahkan reward dan/atau notifikasi', error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserById,
  getAllUsers,
  getUserPurchaseHistory,
  addRewardToUser
};