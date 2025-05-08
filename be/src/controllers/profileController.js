const db = require('../config/db');

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

module.exports = { 
  getProfile, 
  updateProfile, 
  getUserById, 
  getAllUsers 
};

