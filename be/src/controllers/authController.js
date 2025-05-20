const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const db = require('../config/db');
require('dotenv').config();

const SECRET_KEY = process.env.ENCRYPTION_SECRET || 'default_32_char_secret_key';

function getJakartaDateTime() {
  const now = new Date();
  const offset = 7 * 60 * 60 * 1000; 
  return new Date(now.getTime() + offset)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
}

const decryptData = (encrypted) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (err) {
    throw new Error('Gagal mendekripsi data');
  }
};

const register = async (req, res) => {
  try {
    const { encrypted } = req.body;
    if (!encrypted) {
      return res.status(400).json({ message: 'Data terenkripsi tidak ditemukan' });
    }

    const { shop_name, email, phone, address, password } = decryptData(encrypted);

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdAt = getJakartaDateTime();

    const query = `
      INSERT INTO user (shop_name, email, phone, address, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [shop_name, email, phone, address, hashedPassword, createdAt];

    await db.query(query, values);
    res.status(201).json({ message: 'Pengguna berhasil terdaftar' });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Pengguna gagal terdaftar' });
  }
};

const login = async (req, res) => {
  try {
    const { encrypted } = req.body;
    if (!encrypted) {
      return res.status(400).json({ message: 'Data terenkripsi tidak ditemukan' });
    }

    const { email, password } = decryptData(encrypted);

    const [rows] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password tidak tepat' });
    }

    const token = jwt.sign(
      { id: user.user_id },
      'RAHASIA',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login berhasil',
      token,
      user_id: user.user_id,
      shop_name: user.shop_name,
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Login gagal' });
  }
};

const registerAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdAt = getJakartaDateTime();

    const query = `
      INSERT INTO admin (username, password_hash, created_at)
      VALUES (?, ?, ?)
    `;
    const values = [username, hashedPassword, createdAt];

    await db.query(query, values);

    res.status(201).json({ message: 'Admin berhasil terdaftar' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Admin gagal terdaftar' });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const [rows] = await db.query('SELECT * FROM admin WHERE username = ?', [username]);
    const admin = rows[0];

    if (!admin) {
      return res.status(404).json({ message: 'Admin tidak ditemukan' });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const token = jwt.sign(
      { id: admin.admin_id, admin_id: admin.admin_id },
      'RAHASIA',
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Admin login berhasil',
      token,
      admin_id: admin.admin_id,
      username: admin.username
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login admin gagal' });
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  registerAdmin,
};
