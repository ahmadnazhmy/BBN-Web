const db = require('../config/db');

function getJakartaDateTime() {
  const now = new Date();
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  };
  const jakartaTimeString = new Intl.DateTimeFormat('en-CA', options).format(now);
  return jakartaTimeString.replace(/(\d{4})-(\d{2})-(\d{2}),? (\d{2}):(\d{2}):(\d{2})/, '$1-$2-$3 $4:$5:$6');
}

const checkout = async (req, res) => {
  let conn;
  try {
    const { delivery_method, location, cart, payment_type, amount, message, applied_reward_id } = req.body;
    const user_id = req.user?.id;

    console.log('[DEBUG] Checkout payload:', {
      user_id,
      delivery_method,
      location,
      cart,
      payment_type,
      amount,
      applied_reward_id
    });

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

    let discounted_total_price = 0;
    let reward_data = null;
    const original_total_price = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    conn = await db.getConnection();
    await conn.beginTransaction();

    // ✅ Validasi dan ambil reward jika ada
    if (applied_reward_id != null) {
      try {
        const [rewards] = await conn.execute(
          `SELECT * FROM reward WHERE reward_id = ? AND user_id = ? FOR UPDATE`,
          [applied_reward_id, user_id]
        );

        if (!Array.isArray(rewards) || rewards.length === 0) {
          await conn.rollback();
          return res.status(404).json({ error: 'Reward tidak ditemukan atau bukan milik Anda.' });
        }

        reward_data = rewards[0];

        if (reward_data.is_used) {
          await conn.rollback();
          return res.status(400).json({ error: 'Reward ini sudah digunakan.' });
        }

        const expiryDate = new Date(reward_data.expiry_date);
        const currentDate = new Date();
        if (currentDate > expiryDate) {
          await conn.rollback();
          return res.status(400).json({ error: 'Reward ini sudah kadaluarsa.' });
        }

        if (reward_data.min_purchase_amount && original_total_price < reward_data.min_purchase_amount) {
          await conn.rollback();
          return res.status(400).json({
            error: `Minimum pembelian untuk reward ini adalah Rp${reward_data.min_purchase_amount.toLocaleString('id-ID')}.`
          });
        }

        discounted_total_price = original_total_price * (1 - reward_data.discount_percentage / 100);
        discounted_total_price = Math.max(0, discounted_total_price);

      } catch (queryError) {
        console.error('[ERROR] Query reward gagal:', queryError);
        await conn.rollback();
        return res.status(500).json({ error: 'Gagal mengambil data reward' });
      }
    } else {
      discounted_total_price = original_total_price;
    }

    // ✅ Validasi jumlah pembayaran
    if (paymentTypeLower === 'downpayment' && amount < discounted_total_price * 0.2) {
      await conn.rollback();
      return res.status(400).json({
        error: `DP minimal 20% dari total harga (${(discounted_total_price * 0.2).toLocaleString('id-ID', {
          style: 'currency',
          currency: 'IDR'
        })})`
      });
    }

    if (paymentTypeLower === 'fullpayment' && amount < discounted_total_price) {
      await conn.rollback();
      return res.status(400).json({ error: 'Fullpayment harus sama atau lebih dari total harga' });
    }

    if (paymentTypeLower === 'fullpayment' && amount > discounted_total_price) {
      return res.status(400).json({ error: 'Jumlah pembayaran penuh tidak boleh melebihi total harga setelah diskon.' });
    }

    const orderDateTime = getJakartaDateTime();

    const [orderResult] = await conn.execute(
      `INSERT INTO \`order\` (user_id, order_date, status, total_price, discounted_total_price, delivery_method, location, applied_reward_id)
       VALUES (?, ?, 'unpaid', ?, ?, ?, ?, ?)`,
      [user_id, orderDateTime, original_total_price, discounted_total_price, delivery_method, location, applied_reward_id || null]
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
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [order_id, user_id, amount, paymentTypeLower, initialPaymentStatus, message || '', orderDateTime]
    );

    const payment_id = paymentResult.insertId;

    // ✅ Tandai reward sebagai sudah digunakan
    if (applied_reward_id && reward_data) {
      await conn.execute(
        `UPDATE reward SET is_used = 1, used_at = ? WHERE reward_id = ?`,
        [orderDateTime, applied_reward_id]
      );
    }

    await conn.commit();

    res.status(201).json({ message: 'Checkout berhasil. Silakan upload bukti pembayaran.', order_id, payment_id });

  } catch (error) {
    console.error('[FATAL] Checkout error:', error);
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackError) {
        console.error('[FATAL] Rollback gagal:', rollbackError.message);
      }
    }
    res.status(500).json({ error: 'Gagal melakukan checkout' });
  } finally {
    if (conn) conn.release();
  }
};



const getOrderDetailByPaymentId = async (req, res) => {
    let conn;
    try {
        const tokenUserId = req.user?.id;
        const paymentId = req.query.payment_id;

        if (!tokenUserId) {
            return res.status(401).json({ message: 'User tidak terautentikasi' });
        }

        if (!paymentId) {
            return res.status(400).json({ message: 'Payment ID harus disertakan' });
        }

        conn = await db.getConnection();

        const paymentResult = await conn.execute(
            `SELECT payment_id, order_id, user_id, payment_type, status, amount, payment_method, proof_of_payment, message, created_at
             FROM payment
             WHERE payment_id = ?`,
            [paymentId]
        );
        const payments = paymentResult?.[0] || [];
        if (payments.length === 0) {
            conn.release();
            return res.status(404).json({ message: 'Payment tidak ditemukan' });
        }

        const payment = payments[0];
        const orderId = payment.order_id;
        const paymentUserId = payment.user_id;

        const orderResult = await conn.execute(
            `SELECT o.order_id, o.user_id, o.delivery_method, o.location, o.total_price, o.discounted_total_price,
                    o.status, o.order_date, o.file_delivery_order, o.estimated_date, o.applied_reward_id
             FROM \`order\` o
             WHERE o.order_id = ? AND o.user_id = ?`,
            [orderId, paymentUserId]
        );
        const orders = orderResult?.[0] || [];
        if (orders.length === 0) {
            conn.release();
            return res.status(404).json({ message: 'Order tidak ditemukan untuk user ini' });
        }

        const order = orders[0];

        const userResult = await conn.execute(
            `SELECT user_id, shop_name, email, phone FROM user WHERE user_id = ?`,
            [paymentUserId]
        );
        const users = userResult?.[0] || [];
        const user = users.length > 0 ? users[0] : null;

        if (!user) {
            console.warn(`User dengan ID ${paymentUserId} tidak ditemukan untuk payment ${paymentId}.`);
        }

        let appliedRewardDetails = null;
        if (order.applied_reward_id) {
            const rewardResult = await conn.execute(
                `SELECT reward_id, code, discount_percentage, min_purchase_amount
                 FROM reward WHERE reward_id = ?`,
                [order.applied_reward_id]
            );
            const rewardDetails = rewardResult?.[0] || [];
            if (rewardDetails.length > 0) {
                appliedRewardDetails = rewardDetails[0];
            }
        }

        const itemsResult = await conn.execute(
            `SELECT oi.order_item_id, oi.quantity, oi.subtotal,
                    p.product_name, p.type, p.thick, p.avg_weight_per_stick, p.unit_price
             FROM order_item oi
             JOIN product p ON oi.product_id = p.product_id
             WHERE oi.order_id = ?`,
            [orderId]
        );
        const items = itemsResult?.[0] || [];

        const allPaymentsResult = await conn.execute(
            `SELECT payment_id, order_id, user_id, amount, payment_type, status, payment_method, proof_of_payment, message, created_at
             FROM payment
             WHERE order_id = ? AND user_id = ?
             ORDER BY created_at ASC`,
            [orderId, paymentUserId]
        );
        const allPaymentsForOrder = allPaymentsResult?.[0] || [];

        conn.release();

        const delivery = {
            location: order.location,
            delivery_method: order.delivery_method,
        };

        return res.json({
            payment,
            order: {
                ...order,
                amount_for_this_payment: payment.amount,
                applied_reward_details: appliedRewardDetails,
            },
            user,
            delivery,
            items,
            payments: allPaymentsForOrder,
        });

    } catch (err) {
        console.error('Gagal mengambil data detail berdasarkan payment_id:', err.message);
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
            FROM \`order\` o  -- <-- Pastikan ada backticks di sini
            JOIN user u ON o.user_id = u.user_id
            ORDER BY o.order_date DESC`
        );

        const orderIds = orders.map(o => o.order_id);
        let items = [];
        let payments = [];
        let rewards = [];

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

            const appliedRewardIds = orders.map(o => o.applied_reward_id).filter(id => id !== null);
            if (appliedRewardIds.length > 0) {
                const [rewardResults] = await conn.query(
                    `SELECT reward_id, code, discount_percentage, min_purchase_amount FROM reward WHERE reward_id IN (?)`,
                    [appliedRewardIds]
                );
                rewards = rewardResults;
            }
        }

        const orderWithDetails = orders.map(order => ({
            ...order,
            items: items.filter(i => i.order_id === order.order_id),
            payments: payments.filter(p => p.order_id === order.order_id),
            applied_reward_details: rewards.find(r => r.reward_id === order.applied_reward_id) || null
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
        processing: ['ready', 'shipped', 'cancel'],
        ready: [ 'picked_up', 'cancel'],
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

                const [[stockData]] = await conn.execute(`
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
                        ) AS current_stock
                    FROM product
                    WHERE product_id = ?
                `, [item.product_id, item.product_id, item.product_id, item.product_id]);

                const currentStock = parseInt(stockData?.current_stock) || 0;


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
    const doFileUrl = req.file?.filename;

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