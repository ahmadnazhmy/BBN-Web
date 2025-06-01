const db = require('../config/db');

function getJakartaDateTime() {
  const now = new Date();
  const offset = 7 * 60 * 60 * 1000; 
  return new Date(now.getTime() + offset)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
}
const getAllProducts = async (req, res) => {
  const { product_name } = req.query;
  let query = 'SELECT * FROM product WHERE 1';
  const values = [];

  if (product_name) {
    query += ' AND product_name LIKE ?';
    values.push(`%${product_name}%`);
  }

  try {
    const [products] = await db.execute(query, values);

    const productIds = products.map(p => p.product_id);
    if (productIds.length === 0) {
      return res.json([]);
    }

    const placeholders = productIds.map(() => '?').join(',');

    const [stocks] = await db.execute(`
      SELECT
          s.product_id,
          COALESCE(
              (SELECT sh.quantity_change
               FROM stock_history sh
               WHERE sh.product_id = s.product_id AND sh.type = 'correction'
               ORDER BY sh.created_at DESC
               LIMIT 1),
          0) +
          COALESCE(
              (SELECT SUM(
                  CASE
                      WHEN sh2.type = 'in' THEN sh2.quantity
                      WHEN sh2.type = 'out' THEN -sh2.quantity
                      ELSE 0
                  END
              )
              FROM stock_history sh2
              WHERE sh2.product_id = s.product_id AND sh2.created_at > COALESCE(
                  (SELECT sh3.created_at
                   FROM stock_history sh3
                   WHERE sh3.product_id = s.product_id AND sh3.type = 'correction'
                   ORDER BY sh3.created_at DESC
                   LIMIT 1), '1900-01-01'
              )
              ), 0
          ) AS stock
      FROM stock_history s
      WHERE s.product_id IN (${placeholders})
      GROUP BY s.product_id
    `, productIds);

    const stockMap = {};
    stocks.forEach(row => stockMap[row.product_id] = row.stock);

    const result = products.map(product => ({
      ...product,
      stock: stockMap[product.product_id] || 0
    }));

    res.json(result);
  } catch (err) {
    console.error('GET /api/product error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada database', details: err.message });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const [[product]] = await db.execute('SELECT * FROM product WHERE product_id = ?', [id]);
    if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' });

    const [[stockData]] = await db.execute(`
      SELECT
          COALESCE(
              (SELECT sh.quantity_change
               FROM stock_history sh
               WHERE sh.product_id = ? AND sh.type = 'correction'
               ORDER BY sh.created_at DESC
               LIMIT 1),
          0) +
          COALESCE(
              (SELECT SUM(
                  CASE
                      WHEN sh2.type = 'in' THEN sh2.quantity
                      WHEN sh2.type = 'out' THEN -sh2.quantity
                      ELSE 0
                  END
              )
              FROM stock_history sh2
              WHERE sh2.product_id = ? AND sh2.created_at > COALESCE(
                  (SELECT sh3.created_at
                   FROM stock_history sh3
                   WHERE sh3.product_id = ? AND sh3.type = 'correction'
                   ORDER BY sh3.created_at DESC
                   LIMIT 1), '1900-01-01'
              )
              ), 0
          ) AS stock
    `, [id, id, id]);


    res.json({ ...product, stock: stockData?.stock || 0 });
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
            initial_stock,
            source
        } = req.body;

        const conn = await db.getConnection(); 
        try {
            await conn.beginTransaction();

            const insertProductQuery = `
                INSERT INTO product (product_name, type, thick, avg_weight_per_stick, unit_price)
                VALUES (?, ?, ?, ?, ?)
            `;
            const [productResult] = await conn.execute(insertProductQuery, [
                product_name,
                type,
                thick,
                avg_weight_per_stick,
                unit_price
            ]);
            const productId = productResult.insertId;

            if (initial_stock !== undefined && parseInt(initial_stock) > 0) {
                const formattedDate = getJakartaDateTime();
                const stockValue = parseInt(initial_stock);

                await conn.execute(`
                    INSERT INTO stock_history (product_id, quantity, quantity_change, type, source, date)
                    VALUES (?, ?, ?, 'in', ?, ?)
                `, [productId, stockValue, stockValue, source || 'initial', formattedDate]);
            }

            await conn.commit();
            conn.release();

            res.status(201).json({
                product_id: productId,
                product_name,
                type,
                thick,
                avg_weight_per_stick,
                unit_price,
                stock: initial_stock || 0
            });
        } catch (txnErr) {
            await conn.rollback(); 
            conn.release();
            throw txnErr;
        }
    } catch (err) {
        console.error('POST /product error:', err);
        res.status(500).json({ error: 'Terjadi kesalahan pada database', details: err.message });
    }
};

const updateProduct = async (req, res) => {
    const { id } = req.params;
    const {
        product_name,
        type,
        thick,
        avg_weight_per_stick,
        unit_price,
        stock_change,
        stock_note_source, 
    } = req.body;

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const finalType = type === '' ? null : type;
        const finalThick = thick === '' || thick === 0 || thick === null ? null : thick;
        const finalAvgWeightPerStick = avg_weight_per_stick === '' || avg_weight_per_stick === 0 || avg_weight_per_stick === null ? null : avg_weight_per_stick;
        const finalUnitPrice = parseFloat(unit_price) || null;

        const [result] = await conn.execute(`
            UPDATE product
            SET product_name = ?, type = ?, thick = ?, avg_weight_per_stick = ?, unit_price = ?
            WHERE product_id = ?
        `, [
            product_name,
            finalType,
            finalThick,
            finalAvgWeightPerStick,
            finalUnitPrice,
            id,
        ]);

        if (result.affectedRows === 0) { 
            await conn.rollback();
            conn.release();
            return res.status(404).json({ error: 'Produk tidak ditemukan' });
        }

        if (stock_change !== undefined && stock_change !== 0) {
            const formattedDate = getJakartaDateTime();
            const changeAmount = parseFloat(stock_change);

            let historyType;
            let quantityForHistory;
            let quantityChangeForHistory;
            let sourceForHistory = stock_note_source || 'correction'; 

            if (sourceForHistory === 'correction') {
                historyType = 'correction';
                quantityForHistory = 0;
                quantityChangeForHistory = changeAmount;
            } else if (changeAmount > 0) {
                historyType = 'in';
                quantityForHistory = changeAmount;
                quantityChangeForHistory = changeAmount; 
            } else { 
                historyType = 'out';
                quantityForHistory = Math.abs(changeAmount);
                quantityChangeForHistory = changeAmount;
            }

            await conn.execute(`
                INSERT INTO stock_history (product_id, quantity, quantity_change, type, source, date)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [id, quantityForHistory, quantityChangeForHistory, historyType, sourceForHistory, formattedDate]);
        }

        const [[stockData]] = await conn.execute(
            'SELECT COALESCE(SUM(quantity_change), 0) AS current_stock FROM stock_history WHERE product_id = ?',
            [id]
        );
        const currentStock = stockData.current_stock;

        const [[updatedProduct]] = await conn.execute(`
            SELECT product_id, product_name, type, thick, avg_weight_per_stick, unit_price
            FROM product WHERE product_id = ?
        `, [id]);


        await conn.commit();

        res.json({ ...updatedProduct, stock: currentStock });

    } catch (err) {
        await conn.rollback();
        console.error('PUT /product error:', err);
        res.status(500).json({ error: 'Terjadi kesalahan pada database', details: err.message });
    } finally {
        conn.release();
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
    const [rows] = await db.execute(`
      SELECT
        stock_id,
        product_id,
        date,
        quantity,
        quantity_change,
        type,
        source,
        created_at
      FROM stock_history
      WHERE product_id = ?
      ORDER BY created_at DESC
      `, [product_id]);

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
  getStockHistoryByProduct
};