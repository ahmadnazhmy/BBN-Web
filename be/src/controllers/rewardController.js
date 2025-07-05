const db = require('../config/db');

const getAvailableRewards = async (req, res) => {
    let conn;
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(401).json({ message: 'User tidak terautentikasi.' });
        }

        conn = await db.getConnection();
        const [rewards] = await conn.execute(
            `SELECT
                reward_id,
                code,
                discount_percentage,
                min_purchase_amount,
                expiry_date,
                is_used
             FROM reward
             WHERE user_id = ?
               AND is_used = 0
               AND expiry_date >= NOW()`,
            [userId]
        );

        res.status(200).json({
            message: 'Rewards berhasil diambil.',
            rewards: rewards
        });

    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil daftar reward.', error: error.message });
    } finally {
        if (conn) {
            conn.release();
        }
    }
};

const applyReward = async (req, res) => {
    let conn;
    try {
        const { user_id, reward_code, current_total_amount } = req.body;
        const tokenUserId = req.user.id;

        if (String(user_id) !== String(tokenUserId)) {
            return res.status(403).json({ message: 'Tidak diizinkan. User ID tidak cocok.' });
        }

        conn = await db.getConnection();
        const [rewards] = await conn.execute(
            `SELECT reward_id, code, discount_percentage, min_purchase_amount, expiry_date, is_used, user_id
             FROM reward WHERE code = ?`,
            [reward_code]
        );

        const reward = rewards[0];

        if (!reward) {
            return res.status(400).json({ message: 'Kode diskon tidak valid atau tidak ditemukan.' });
        }

        if (String(reward.user_id) !== String(user_id)) {
            return res.status(400).json({ message: 'Kode diskon ini bukan milik Anda.' });
        }

        if (reward.is_used) {
            return res.status(400).json({ message: 'Kode diskon ini sudah digunakan.' });
        }

        const expiryDate = new Date(reward.expiry_date);
        const currentDate = new Date();
        if (currentDate > expiryDate) {
            return res.status(400).json({ message: 'Kode diskon ini sudah kadaluarsa.' });
        }

        if (reward.min_purchase_amount && current_total_amount < reward.min_purchase_amount) {
            return res.status(400).json({
                message: `Minimum pembelian untuk diskon ini adalah Rp${reward.min_purchase_amount.toLocaleString('id-ID')}.`
            });
        }
        
        res.status(200).json({ message: 'Diskon berhasil diterapkan!', reward: reward });

    } catch (error) {
        res.status(500).json({ message: 'Gagal menerapkan diskon', error: error.message });
    } finally {
        if (conn) {
            conn.release();
        }
    }
};

module.exports = { applyReward, getAvailableRewards };