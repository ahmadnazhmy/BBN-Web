const db = require('../config/db');

const getUserHistory = async (req, res) => {
    const user_id = req.user.id;
    let conn;
    try {
        conn = await db.getConnection();

        const [orders] = await conn.execute(`
            SELECT
                o.order_id,
                o.order_date,
                o.status AS order_status,
                o.total_price,
                u.shop_name,
                o.delivery_method,
                o.file_delivery_order,
                o.estimated_date
            FROM \`order\` o
            JOIN user u ON o.user_id = u.user_id
            WHERE o.user_id = ?
              AND o.status IN ('unpaid','pending','processing','ready','shipped','delivered','picked_up', 'cancel')
            ORDER BY o.order_date DESC
        `, [user_id]); 

        const ordersWithDetails = await Promise.all(orders.map(async (order) => {

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

            const [payments] = await conn.execute(`
                SELECT
                    payment_id,
                    amount,
                    status,
                    payment_type,
                    payment_method,
                    created_at AS date,
                    due_date
                FROM payment
                WHERE order_id = ?
                ORDER BY created_at ASC
            `, [order.order_id]);

            const hasPendingVerificationPayment = payments.some(payment =>

                payment.status === 'pending' || payment.status === 'pending_verification'
            );

            order.items = items;
            order.payments = payments;
            order.hasPendingVerificationPayment = hasPendingVerificationPayment;

            return order;
        }));

        res.json(ordersWithDetails);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Gagal mengambil riwayat pesanan' });
    } finally {
        if (conn) conn.release();
    }
};

module.exports = {
    getUserHistory,
};