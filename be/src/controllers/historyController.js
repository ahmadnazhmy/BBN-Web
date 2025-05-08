const db = require('../config/db');

const getUserHistory = async (req, res) => {
  const user_id = req.user.id;

  try {
    const conn = await db.getConnection();
    const [orders] = await conn.execute(`
      SELECT o.order_id, o.order_date, o.status AS order_status, o.total_price,
             p.status AS payment_status, p.proof_of_payment
      FROM \`order\` o
      LEFT JOIN payment p ON o.order_id = p.order_id
      WHERE o.user_id = ? AND (p.status IS NOT NULL OR p.status = 'pending')
      ORDER BY o.order_date DESC
    `, [user_id]);      

    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const [items] = await conn.execute(`
        SELECT 
          oi.order_item_id, 
          oi.product_id, 
          oi.quantity, 
          oi.subtotal,
          p.product_name,
          p.type,
          p.thick,
          p.avg_weight_per_stick
        FROM order_item oi
        JOIN product p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?
      `, [order.order_id]);

      order.items = items;
      return order;
    }));

    conn.release();
    res.json(ordersWithItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil riwayat pesanan' });
  }
};

module.exports = {
  getUserHistory
};
