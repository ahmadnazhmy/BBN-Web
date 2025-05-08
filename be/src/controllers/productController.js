const db = require('../config/db');

const getAllProducts = async (req, res) => {
  const { product_name } = req.query;
  let query = 'SELECT * FROM product WHERE 1';
  const values = [];

  if (product_name) {
    query += ' AND product_name LIKE ?';
    values.push(`%${product_name}%`);
  }

  try {
    const [rows] = await db.execute(query, values);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan pada database', details: err.message });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute('SELECT * FROM product WHERE product_id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan pada database', details: err.message });
  }
};

const addProduct = async (req, res) => {
  try {
    const {
      product_name,
      type,
      thick,
      avg_weight_per_stick,
      unit_price,
      stock,
    } = req.body;

    const query = `
      INSERT INTO product (product_name, type, thick, avg_weight_per_stick, unit_price, stock)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [product_name, type, thick, avg_weight_per_stick, unit_price, stock];

    const [result] = await db.execute(query, values);

    const newProduct = {
      product_id: result.insertId,
      product_name,
      type,
      thick,
      avg_weight_per_stick,
      unit_price,
      stock,
    };

    res.status(201).json(newProduct);
  } catch (err) {
    console.error('POST /product error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada database', details: err.message });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { product_name, type, thick, avg_weight_per_stick, unit_price, stock } = req.body;
  try {
    const [result] = await db.execute(
      `UPDATE product SET product_name=?, type=?, thick=?, avg_weight_per_stick=?, unit_price=?, stock=? WHERE product_id=?`,
      [product_name, type || null, thick || null, avg_weight_per_stick || null, unit_price, stock, id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    const [updated] = await db.execute('SELECT * FROM product WHERE product_id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan pada database', details: err.message });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute('DELETE FROM product WHERE product_id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    res.json({ message: 'Produk berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan pada database', details: err.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
};
