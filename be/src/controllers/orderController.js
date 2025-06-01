const db = require('../config/db');

function getJakartaDateTime() {
    const now = new Date();
    const offset = 7 * 60 * 60 * 1000;
    const jakartaTime = new Date(now.getTime() + offset);
    return jakartaTime.toISOString().slice(0, 19).replace('T', ' ');
}

const checkout = async (req, res) => {
    let conn;
    try {
        const { delivery_method, location, cart, payment_type, amount, message } = req.body;
        const user_id = req.user.id;

        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ error: 'Keranjang kosong' });
        }
        if (!delivery_method || !location) {
            return res.status(400).json({ error: 'Delivery method dan lokasi wajib diisi' });
        }

        const paymentTypeLower = payment_type?.toLowerCase();
        if (!['fullpayment', 'downpayment'].includes(paymentTypeLower)) {
            return res.status(400).json({ error: 'Payment type tidak valid' });
        }

        const total_price = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

        if (paymentTypeLower === 'downpayment' && amount < total_price * 0.2) {
            return res.status(400).json({ error: `DP minimal 20% dari total harga (${(total_price * 0.2).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })})` });
        }
        if (paymentTypeLower === 'fullpayment' && amount < total_price) {
            return res.status(400).json({ error: 'Fullpayment harus sama atau lebih dari total harga' });
        }

        conn = await db.getConnection();
        await conn.beginTransaction();

        const orderDateTime = getJakartaDateTime();
        const [orderResult] = await conn.execute(
            `INSERT INTO \`order\` (user_id, order_date, status, total_price, delivery_method, location)
            VALUES (?, ?, 'unpaid', ?, ?, ?)`,
            [user_id, orderDateTime, total_price, delivery_method, location]
        );
        const order_id = orderResult.insertId;

        for (const item of cart) {
            const subtotal = item.unit_price * item.quantity;
            await conn.execute(
                `INSERT INTO order_item (order_id, product_id, quantity, subtotal)
                VALUES (?, ?, ?, ?)`,
                [order_id, item.product_id, item.quantity, subtotal]
            );
        }

        const initialPaymentStatus = paymentTypeLower === 'downpayment' ? 'pending_dp' : 'pending_fullpayment';

        const [paymentResult] = await conn.execute(
            `INSERT INTO payment (order_id, user_id, amount, payment_type, status, message, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [order_id, user_id, amount, paymentTypeLower, initialPaymentStatus, message || '']
        );
        const payment_id = paymentResult.insertId;

        await conn.commit();
        res.status(201).json({ message: 'Checkout berhasil. Silakan upload bukti pembayaran.', order_id, payment_id });
    } catch (error) {
        console.error('Checkout error:', error);
        if (conn) await conn.rollback();
        res.status(500).json({ error: 'Gagal melakukan checkout' });
    } finally {
        if (conn) conn.release();
    }
};

const getOrderDetailByPaymentId = async (req, res) => {
    let conn;
    try {
        const tokenUserId = req.user?.id;
        const paymentId = req.params.paymentId;

        if (!tokenUserId) {
            return res.status(401).json({ message: 'User tidak terautentikasi' });
        }

        if (!paymentId) {
            return res.status(400).json({ message: 'Payment ID harus disertakan' });
        }

        conn = await db.getConnection();
        const [payments] = await conn.execute( 
            `SELECT payment_id, order_id, user_id, payment_type, status, amount, payment_method, proof_of_payment, message
            FROM payment
            WHERE payment_id = ?`,
            [paymentId]
        );

        if (!payments.length) {
            conn.release();
            return res.status(404).json({ message: 'Payment tidak ditemukan' });
        }

        const payment = payments[0];
        const orderId = payment.order_id;
        const paymentUserId = payment.user_id;

        const [orders] = await conn.execute(
            `SELECT o.order_id, o.user_id, o.delivery_method, o.location, o.total_price,
                    o.status, o.order_date, o.file_delivery_order, u.shop_name, o.estimated_date
            FROM \`order\` o
            JOIN user u ON o.user_id = u.user_id
            WHERE o.order_id = ? AND o.user_id = ?`,
            [orderId, paymentUserId]
        );

        if (!orders.length) {
            conn.release();
            return res.status(404).json({ message: 'Order tidak ditemukan' });
        }

        const order = orders[0];

        const [items] = await conn.execute(
            `SELECT oi.order_item_id, oi.quantity, oi.subtotal,
                    p.product_name, p.type, p.thick, p.avg_weight_per_stick
            FROM order_item oi
            JOIN product p ON oi.product_id = p.product_id
            WHERE oi.order_id = ?`,
            [orderId]
        );

        const [allPaymentsForOrder] = await conn.execute(
            `SELECT payment_id, order_id, user_id, amount, payment_type, status, payment_method, proof_of_payment, message, created_at
            FROM payment
            WHERE order_id = ? AND user_id = ?
            ORDER BY created_at ASC`,
            [orderId, paymentUserId]
        );

        conn.release();

        return res.json({
            order: {
                ...order,
                amount_for_this_payment: payment.amount,
            },
            items,
            payment,
            payments: allPaymentsForOrder,
        });

    } catch (err) {
        console.error('Gagal mengambil data detail berdasarkan payment_id:', err);
        if (conn) conn.release();
        return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

const getAllOrders = async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const [orders] = await conn.execute(
            `SELECT o.*, u.shop_name
            FROM \`order\` o
            JOIN \`user\` u ON o.user_id = u.user_id
            ORDER BY o.order_date DESC`
        );

        const orderIds = orders.map(o => o.order_id);
        let items = [];
        let payments = [];

        if (orderIds.length) {
            const [itemResults] = await conn.query(
                `SELECT oi.order_item_id, oi.order_id, oi.quantity, oi.subtotal,
                        p.product_id, p.product_name, p.type, p.thick, p.avg_weight_per_stick
                FROM order_item oi
                JOIN product p ON oi.product_id = p.product_id
                WHERE oi.order_id IN (?)`,
                [orderIds]
            );
            items = itemResults;

            const [paymentResults] = await conn.query(
                `SELECT payment_id, order_id, user_id, amount, payment_type, status, payment_method, proof_of_payment, message, created_at
                FROM payment
                WHERE order_id IN (?)`,
                [orderIds]
            );
            payments = paymentResults;
        }

        const orderWithDetails = orders.map(order => ({
            ...order,
            items: items.filter(i => i.order_id === order.order_id),
            payments: payments.filter(p => p.order_id === order.order_id)
        }));

        res.json(orderWithDetails);
    } catch (error) {
        console.error('Error in getAllOrders:', error);
        res.status(500).json({ error: 'Gagal mengambil data order' });
    } finally {
        if (conn) conn.release(); 
    }
};

const getPaymentStatus = async (conn, orderId) => {
    const [paymentsRows] = await conn.execute(
        'SELECT payment_type, status FROM payment WHERE order_id = ?',
        [orderId]
    );

    const payments = paymentsRows || [];

    const hasFullPayment = payments.some(p => p.payment_type === 'fullpayment' && p.status === 'completed');
    if (hasFullPayment) return 'Lunas';

    const hasDpPaid = payments.some(p => p.payment_type === 'downpayment' && p.status === 'dp_paid');
    const hasSettlementComplete = payments.some(p => p.payment_type === 'settlement' && p.status === 'completed');
    if (hasDpPaid && hasSettlementComplete) return 'Lunas';

    const totalPaid = payments.reduce((sum, p) => {
        if (p.status === 'completed' || p.status === 'dp_paid') {
            return sum + p.amount;
        }
        return sum;
    }, 0);

    const [orderInfo] = await conn.execute(
        'SELECT total_price FROM `order` WHERE order_id = ?',
        [orderId]
    );

    if (orderInfo.length > 0 && totalPaid >= orderInfo[0].total_price) {
        return 'Lunas';
    }

    return 'Belum Lunas';
};

const updateOrderStatus = async (req, res) => {
    const orderId = req.params.orderId;
    const { status } = req.body;

    const allowedStatuses = [
        'unpaid', 'pending_fullpayment', 'pending_dp', 'processing',
        'ready', 'shipped', 'delivered', 'picked_up', 'cancel'
    ];

    if (status === undefined || status === null) {
        return res.status(400).json({ error: 'Parameter "status" tidak boleh kosong.' });
    }

    if (typeof status !== 'string' || status.trim().length === 0) {
        return res.status(400).json({ error: 'Parameter "status" harus berupa teks yang valid.' });
    }

    const trimmedStatus = status.trim();

    if (!allowedStatuses.includes(trimmedStatus)) {
        return res.status(400).json({ error: `Status "${trimmedStatus}" tidak valid.` });
    }

    const allowedTransitions = {
        unpaid: ['pending_dp', 'pending_fullpayment', 'cancel'],
        pending_dp: ['processing', 'cancel'],
        pending_fullpayment: ['processing', 'cancel'],
        processing: ['ready', 'cancel'],
        ready: ['shipped', 'picked_up', 'cancel'],
        shipped: ['delivered', 'cancel'],
        picked_up: [],
        delivered: [],
        cancel: []
    };

    const generateNotificationMessage = (orderId, oldStatus, newStatus) => {
        const messages = {
            shipped: `Pesanan Anda #${orderId} sedang diantar.`,
            picked_up: `Pesanan Anda #${orderId} telah berhasil diambil.`,
            ready: `Pesanan Anda #${orderId} siap untuk diambil.`,
            delivered: `Pesanan Anda #${orderId} telah berhasil diantar.`,
            cancel: `Pesanan Anda #${orderId} telah dibatalkan.`,
            processing: `Pesanan Anda #${orderId} sedang diproduksi.`
        };
        return oldStatus !== newStatus ? messages[newStatus] || '' : '';
    };

    let conn; 
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        const [orderRows] = await conn.execute(
            'SELECT status, user_id, delivery_method FROM `order` WHERE order_id = ? FOR UPDATE',
            [orderId]
        );

        if (orderRows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Order tidak ditemukan.' });
        }

        const currentStatus = orderRows[0].status;
        const userId = orderRows[0].user_id ?? null;
        const deliveryMethod = orderRows[0].delivery_method;

        if (['delivered', 'picked_up', 'cancel'].includes(currentStatus)) {
            await conn.rollback();
            return res.status(400).json({ error: 'Status pesanan sudah final dan tidak dapat diubah.' });
        }

        const validNextStatuses = allowedTransitions[currentStatus] || [];
        if (!validNextStatuses.includes(trimmedStatus)) {
            await conn.rollback();
            return res.status(400).json({
                error: `Transisi status dari '${currentStatus}' ke '${trimmedStatus}' tidak diperbolehkan.`
            });
        }

        const paymentStatus = await getPaymentStatus(conn, orderId);

        if (deliveryMethod === 'delivery') {
            if (trimmedStatus === 'shipped' && paymentStatus === 'Belum Lunas') {
                await conn.rollback();
                return res.status(400).json({
                    error: `Pesanan tidak dapat diubah ke status 'Diantar' karena belum lunas.`
                });
            }
            if (trimmedStatus === 'delivered' && paymentStatus === 'Belum Lunas') {
                await conn.rollback();
                return res.status(400).json({
                    error: `Pesanan tidak dapat diubah ke status 'Diterima' karena belum lunas.`
                });
            }
        } else if (deliveryMethod === 'pickup') {
            if (trimmedStatus === 'picked_up' && paymentStatus === 'Belum Lunas') {
                await conn.rollback();
                return res.status(400).json({
                    error: `Pesanan tidak dapat diubah ke status 'Diambil' karena belum lunas.`
                });
            }
        }

        if ((trimmedStatus === 'shipped' && currentStatus !== 'shipped') ||
            (trimmedStatus === 'picked_up' && currentStatus !== 'picked_up')) {

            const [orderItems] = await conn.execute(
                'SELECT product_id, quantity FROM order_item WHERE order_id = ?',
                [orderId]
            );

            if (orderItems.length === 0) {
                await conn.rollback();
                return res.status(400).json({ error: 'Tidak ada item dalam pesanan ini.' });
            }

            for (const item of orderItems) {
                if (item.product_id === undefined || item.quantity === undefined) {
                    await conn.rollback();
                    return res.status(400).json({
                        error: `Data item pesanan tidak lengkap: ${JSON.stringify(item)}`
                    });
                }

                const [stockRows] = await conn.execute(
                    'SELECT SUM(quantity_change) AS current_stock FROM stock_history WHERE product_id = ? FOR UPDATE',
                    [item.product_id]
                );

                const currentStock = stockRows[0].current_stock || 0;

                if (currentStock < item.quantity) {
                    await conn.rollback();
                    return res.status(400).json({
                        error: `Stok tidak cukup untuk produk ID ${item.product_id}. Stok saat ini: ${currentStock}, Dibutuhkan: ${item.quantity}. Harap update stok terlebih dahulu.`
                    });
                }
            }

            for (const item of orderItems) {
                await conn.execute(
                    'INSERT INTO stock_history (product_id, quantity, quantity_change, type, source) VALUES (?, ?, ?, ?, ?)',
                    [item.product_id, item.quantity, -item.quantity, 'out', 'shipment']
                );
            }
        }

        const notifMessage = generateNotificationMessage(orderId, currentStatus, trimmedStatus);
        if (notifMessage && userId !== null && userId !== undefined && orderId !== undefined) {
            await conn.execute(
                'INSERT INTO notification (user_id, order_id, message, is_read, created_at) VALUES (?, ?, ?, ?, NOW())',
                [userId, orderId, notifMessage, false]
            );
        }

        await conn.execute(
            'UPDATE `order` SET status = ? WHERE order_id = ?',
            [trimmedStatus, orderId]
        );

        await conn.commit();
        res.json({ message: 'Status order berhasil diupdate.' });

    } catch (err) {
        if (conn) await conn.rollback();
        console.error('Error updating order status:', err);
        res.status(500).json({ error: 'Gagal update status order: ' + err.message });
    } finally {
        if (conn) {
            conn.release();
        }
    }
};

const cancelPayment = async (req, res) => {
    const userId = req.user.id;
    const orderId = req.params.id;

    let conn;
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        const [orders] = await conn.execute(
            'SELECT * FROM `order` WHERE order_id = ? AND user_id = ? AND status IN (?, ?, ?)',
            [orderId, userId, 'pending_fullpayment', 'pending_dp', 'unpaid']
        );
        if (!orders.length) {
            await conn.rollback();
            return res.status(404).json({ error: 'Order tidak ditemukan atau tidak bisa dibatalkan karena status tidak valid.' });
        }

        await conn.execute('UPDATE `order` SET status = ? WHERE order_id = ?', ['cancel', orderId]);
        await conn.execute('DELETE FROM payment WHERE order_id = ?', [orderId]); 

        await conn.commit();
        res.json({ message: 'Pesanan dibatalkan' });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error(err);
        res.status(500).json({ error: 'Gagal membatalkan pesanan' });
    } finally {
        if (conn) conn.release();
    }
};

const confirmDelivery = async (req, res) => {
    const userId = req.user?.id;
    const orderId = req.params.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let conn;
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        const [orders] = await conn.execute(
            'SELECT status, delivery_method FROM `order` WHERE order_id = ? AND user_id = ? FOR UPDATE',
            [orderId, userId]
        );

        if (orders.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Pesanan tidak ditemukan atau bukan milik Anda.' });
        }

        const currentOrderStatus = orders[0].status;
        const deliveryMethod = orders[0].delivery_method;

        if (deliveryMethod === 'delivery' && currentOrderStatus !== 'shipped') {
            await conn.rollback();
            return res.status(400).json({ error: 'Pesanan harus dalam status "Diantar" untuk dikonfirmasi selesai.' });
        }
        if (deliveryMethod === 'pickup' && currentOrderStatus !== 'ready') {
            await conn.rollback();
            return res.status(400).json({ error: 'Pesanan harus dalam status "Siap Diambil" untuk dikonfirmasi selesai.' });
        }

        const paymentStatus = await getPaymentStatus(conn, orderId);
        if (paymentStatus === 'Belum Lunas') {
            await conn.rollback();
            return res.status(400).json({ error: 'Pesanan belum lunas, tidak dapat dikonfirmasi selesai.' });
        }

        const newStatus = deliveryMethod === 'delivery' ? 'delivered' : 'picked_up';
        await conn.execute(
            'UPDATE `order` SET status = ? WHERE order_id = ?',
            [newStatus, orderId]
        );

        await conn.commit();
        res.json({ message: `Pesanan berhasil dikonfirmasi sebagai ${newStatus === 'delivered' ? 'diterima' : 'diambil'}.` });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error(err);
        res.status(500).json({ error: 'Gagal konfirmasi pesanan' });
    } finally {
        if (conn) conn.release();
    }
};

const uploadDOFile = async (req, res) => {
    const { orderId } = req.params;
    const doFileUrl = req.file?.path;

    if (!doFileUrl) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    let conn;
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        const [result] = await conn.execute(
            `UPDATE \`order\` SET file_delivery_order = ? WHERE order_id = ?`,
            [doFileUrl, orderId]
        );

        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'Pesanan tidak ditemukan atau tidak dapat diperbarui.' });
        }

        await conn.commit();
        res.status(200).json({
            message: 'File DO berhasil diunggah dan disimpan!',
            orderId: orderId,
            doFileUrl: doFileUrl,
        });
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error saat mengunggah file DO:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server saat mengunggah file DO.' });
    } finally {
        if (conn) conn.release();
    }
};

const updateEstimatedDate = async (req, res) => {
    const { orderId } = req.params;
    const { estimated_date } = req.body;

    if (!estimated_date) {
        return res.status(400).json({ message: 'Field estimated_date wajib diisi' });
    }

    let conn;
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        const [result] = await conn.execute(
            'UPDATE `order` SET estimated_date = ? WHERE order_id = ?',
            [estimated_date, orderId]
        );

        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'Order tidak ditemukan.' });
        }

        await conn.commit();
        res.json({ message: 'Estimasi waktu berhasil disimpan' });
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error in updateEstimatedDate:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    } finally {
        if (conn) conn.release();
    }
};

module.exports = {
    checkout,
    getOrderDetailByPaymentId,
    getAllOrders,
    updateOrderStatus,
    cancelPayment,
    confirmDelivery,
    uploadDOFile,
    updateEstimatedDate
};