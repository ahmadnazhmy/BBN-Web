const db = require('../config/db');

const getCustomer = async (req, res) => {
  try {

    const query = 'SELECT user_id, shop_name, email, phone, address FROM user';
    const [rows] = await db.query(query);

    if (rows.length > 0) {
      res.status(200).json(rows);
    } else {
      res.status(404).json({ message: 'Pelanggan tidak ditemukan' });
    }
  } catch (error) {
    console.error('Gagal mengambil data pelanggan', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data pelanggan' });
  }
};

const deleteCustomer = async (req, res) => {
  const customerId = req.params.id;

  try {
    const query = 'DELETE FROM user WHERE user_id = ?';
    const [result] = await db.query(query, [customerId]);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: 'Pelanggan berhasil dihapus' });
    } else {
      res.status(404).json({ message: 'Pelanggan tidak ditemukan' });
    }
  } catch (error) {
    console.error('Gagal menghapus pelanggan', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menghapus pelanggan' });
  }
};

module.exports = { getCustomer, deleteCustomer };
