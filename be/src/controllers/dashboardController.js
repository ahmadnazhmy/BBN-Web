const db = require('../config/db');

async function getDashboardSummary(req, res) {
  try {
    const [ordersCountResult] = await db.query('SELECT COUNT(*) AS total_orders FROM `order`');
    const totalOrders = ordersCountResult[0].total_orders;

    const [revenueResult] = await db.query(`
      SELECT IFNULL(SUM(o.total_price), 0) AS total_revenue
      FROM \`order\` o
      JOIN payment p ON o.order_id = p.order_id
      WHERE p.status = 'completed'
    `);
    const totalRevenue = revenueResult[0].total_revenue;

    const [usersCountResult] = await db.query('SELECT COUNT(*) AS total_users FROM user');
    const totalUsers = usersCountResult[0].total_users;

    const [productsCountResult] = await db.query('SELECT COUNT(*) AS total_products FROM product');
    const totalProducts = productsCountResult[0].total_products;

    const [notificationsCountResult] = await db.query('SELECT COUNT(*) AS unread_notifications FROM notification WHERE is_read = 0');
    const unreadNotifications = notificationsCountResult[0].unread_notifications;

    const [paymentSuccessResult] = await db.query(`
      SELECT COUNT(*) AS success_count FROM payment WHERE status = 'completed'
    `);
    const paymentSuccess = paymentSuccessResult[0].success_count;

    const [paymentFailedResult] = await db.query(`
      SELECT COUNT(*) AS failed_count FROM payment WHERE status = 'failed'
    `);
    const paymentFailed = paymentFailedResult[0].failed_count;

    const [monthlySalesRows] = await db.query(`
      SELECT 
        DATE_FORMAT(o.order_date, '%Y-%m') AS month,
        IFNULL(SUM(o.total_price), 0) AS sales
      FROM \`order\` o
      JOIN payment p ON o.order_id = p.order_id
      WHERE p.status = 'completed'
      GROUP BY month
      ORDER BY month
      LIMIT 12
    `);


    const [stockRows] = await db.query(`
      SELECT
        p.product_name AS item,
        SUM(CASE WHEN sh.type = 'in' THEN sh.quantity ELSE 0 END) AS masuk,
        SUM(CASE WHEN sh.type = 'out' THEN sh.quantity ELSE 0 END) AS keluar
      FROM stock_history sh
      JOIN product p ON sh.product_id = p.product_id
      GROUP BY p.product_name
      ORDER BY p.product_name
    `);

    const stockChanges = stockRows.map(row => ({
      item: row.item,
      masuk: Number(row.masuk),
      keluar: Number(row.keluar),
      jumlah: Number(row.masuk) - Number(row.keluar),
    }));

    res.json({
      totalOrders,
      totalRevenue,
      totalUsers,
      totalProducts,
      unreadNotifications,
      payments: {
        success: paymentSuccess,
        failed: paymentFailed
      },
      monthlySales: monthlySalesRows,
      stockChanges,
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  getDashboardSummary,
};
