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
    const productId = result.insertId;

    if (stock && parseInt(stock) > 0) {
      await db.execute(
        `INSERT INTO stock_history (product_id, quantity, type) VALUES (?, ?, 'in')`,
        [productId, stock]
      );
    }

    const newProduct = {
      product_id: productId,
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
    const [oldData] = await db.execute('SELECT stock FROM product WHERE product_id = ?', [id]);
    if (!oldData.length) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    const oldStock = parseInt(oldData[0].stock);
    const newStock = parseInt(stock);

    const [result] = await db.execute(
      `UPDATE product SET product_name=?, type=?, thick=?, avg_weight_per_stick=?, unit_price=?, stock=? WHERE product_id=?`,
      [product_name, type || null, thick || null, avg_weight_per_stick || null, unit_price, stock, id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    if (!isNaN(oldStock) && !isNaN(newStock) && oldStock !== newStock) {
      const diff = newStock - oldStock;
      const type = diff > 0 ? 'in' : 'out';
      await db.execute(
        `INSERT INTO stock_history (product_id, quantity, type) VALUES (?, ?, ?)`,
        [id, Math.abs(diff), type]
      );
    }

    const [updated] = await db.execute('SELECT * FROM product WHERE product_id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('PUT /product error:', err);
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

const getStockHistoryByProduct = async (req, res) => {
  const { product_id } = req.params;

  try {
    const [rows] = await db.execute(
      'SELECT id, product_id, date, quantity, type FROM stock_history WHERE product_id = ? ORDER BY date DESC',
      [product_id]
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /stock/product/:product_id error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada database', details: err.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getStockHistoryByProduct,   
};
