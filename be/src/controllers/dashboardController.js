const db = require('../config/db');

const getDateRange = (timeframe) => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date(now);

    switch (timeframe) {
        case 'daily':
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'weekly':
            const dayOfWeek = now.getDay();
            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            startDate.setDate(diff);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'monthly':
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'yearly':
            startDate.setMonth(0);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        default:
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
    }
    return { startDate, endDate };
};


async function getDashboardSummary(req, res) {
    try {
        const { timeframe } = req.query;
        const { startDate, endDate } = getDateRange(timeframe);

        const mysqlStartDate = startDate.toISOString().slice(0, 19).replace('T', ' ');

        const orderDateFilterCondition = `WHERE o.order_date >= '${mysqlStartDate}'`;
        const paymentDateFilterCondition = `WHERE p.created_at >= '${mysqlStartDate}'`;
        const userDateFilterCondition = `WHERE created_at >= '${mysqlStartDate}'`;
        const stockDateFilterCondition = `WHERE sh.created_at >= '${mysqlStartDate}'`;

        const [ordersCountResult] = await db.query(`
            SELECT COUNT(*) AS total_orders
            FROM \`order\` o
            ${orderDateFilterCondition}
        `);
        const totalOrders = ordersCountResult[0].total_orders;

        const [successfulRevenueResult] = await db.query(`
            SELECT IFNULL(SUM(o.total_price), 0) AS success_amount
            FROM \`order\` o
            JOIN payment p ON o.order_id = p.order_id
            WHERE (p.status = 'completed' OR p.status = 'dp_paid') AND p.created_at >= '${mysqlStartDate}'
        `);
        const successAmount = successfulRevenueResult[0].success_amount;

        const [usersCountResult] = await db.query(`
            SELECT COUNT(*) AS total_users
            FROM user
            ${userDateFilterCondition}
        `);
        const totalUsers = usersCountResult[0].total_users;

        const [productsCountResult] = await db.query('SELECT COUNT(*) AS total_products FROM product');
        const totalProducts = productsCountResult[0].total_products;

        const [notificationsCountResult] = await db.query('SELECT COUNT(*) AS unread_notifications FROM notification WHERE is_read = 0');
        const unreadNotifications = notificationsCountResult[0].unread_notifications;

        const [paymentSuccessResult] = await db.query(`
            SELECT COUNT(*) AS success_count
            FROM payment p
            WHERE (p.status = 'completed' OR p.status = 'dp_paid') AND p.created_at >= '${mysqlStartDate}';
        `);
        const paymentSuccess = paymentSuccessResult[0].success_count;

        const [paymentFailedResult] = await db.query(`
            SELECT COUNT(*) AS failed_count
            FROM payment p
            WHERE p.status = 'failed' AND p.created_at >= '${mysqlStartDate}'
        `);
        const paymentFailed = paymentFailedResult[0].failed_count;

        let salesQuery = '';
        let xAxisLabel = '';

        switch (timeframe) {
            case 'daily':
                salesQuery = `
                    SELECT
                        DATE_FORMAT(o.order_date, '%Y-%m-%d') AS date_label,
                        IFNULL(SUM(o.total_price), 0) AS sales
                    FROM \`order\` o
                    JOIN payment p ON o.order_id = p.order_id
                    WHERE (p.status = 'completed' OR p.status = 'dp_paid') AND o.order_date >= '${mysqlStartDate}'
                    GROUP BY date_label
                    ORDER BY date_label
                    LIMIT 31
                `;
                xAxisLabel = 'day';
                break;
            case 'weekly':
                salesQuery = `
                    SELECT
                        YEARWEEK(o.order_date, 1) AS week_label,
                        DATE_FORMAT(MIN(o.order_date), '%Y-%m-%d') AS week_start_date,
                        IFNULL(SUM(o.total_price), 0) AS sales
                    FROM \`order\` o
                    JOIN payment p ON o.order_id = p.order_id
                    WHERE (p.status = 'completed' OR p.status = 'dp_paid') AND o.order_date >= '${mysqlStartDate}'
                    GROUP BY week_label
                    ORDER BY week_label
                    LIMIT 52
                `;
                xAxisLabel = 'week_start_date';
                break;
            case 'yearly':
                salesQuery = `
                    SELECT
                        DATE_FORMAT(o.order_date, '%Y') AS year_label,
                        IFNULL(SUM(o.total_price), 0) AS sales
                    FROM \`order\` o
                    JOIN payment p ON o.order_id = p.order_id
                    WHERE (p.status = 'completed' OR p.status = 'dp_paid') AND o.order_date >= '${mysqlStartDate}'
                    GROUP BY year_label
                    ORDER BY year_label
                    LIMIT 5
                `;
                xAxisLabel = 'year';
                break;
            case 'monthly':
            default:
                salesQuery = `
                    SELECT
                        DATE_FORMAT(o.order_date, '%Y-%m') AS month_label,
                        IFNULL(SUM(o.total_price), 0) AS sales
                    FROM \`order\` o
                    JOIN payment p ON o.order_id = p.order_id
                    WHERE (p.status = 'completed' OR p.status = 'dp_paid') AND o.order_date >= '${mysqlStartDate}'
                    GROUP BY month_label
                    ORDER BY month_label
                    LIMIT 12
                `;
                xAxisLabel = 'month';
                break;
        }

        const [salesRows] = await db.query(salesQuery);

        const formattedSalesData = salesRows.map(row => {
            if (timeframe === 'weekly') {
                return {
                    week_start_date: row.week_start_date,
                    sales: Number(row.sales)
                };
            } else if (timeframe === 'daily') {
                return {
                    day: row.date_label,
                    sales: Number(row.sales)
                };
            } else if (timeframe === 'yearly') {
                return {
                    year: row.year_label,
                    sales: Number(row.sales)
                };
            }
            return {
                month: row.month_label,
                sales: Number(row.sales)
            };
        });

        const [stockRows] = await db.query(`
            SELECT
                p.product_name AS item,
                SUM(CASE WHEN sh.type = 'in' THEN sh.quantity ELSE 0 END) AS masuk,
                SUM(CASE WHEN sh.type = 'out' THEN sh.quantity ELSE 0 END) AS keluar
            FROM stock_history sh
            JOIN product p ON sh.product_id = p.product_id
            ${stockDateFilterCondition}
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
            stats: {
                totalOrders,
                totalUsers,
                totalProducts,
                totalRevenue: successAmount,
                payments: {
                    success: paymentSuccess,
                    failed: paymentFailed,
                    successAmount: successAmount,
                },
                unreadNotifications
            },
            monthlySales: formattedSalesData,
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