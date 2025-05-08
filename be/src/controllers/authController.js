const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const registerAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO admin (username, password_hash) VALUES (?, ?)';
    const values = [username, hashedPassword];

    await db.query(query, values);

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Admin registration failed' });
  }
};

const register = async (req, res) => {
  try {
    const { shop_name, email, phone, address, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO user (shop_name, email, phone, address, password_hash) VALUES (?, ?, ?, ?, ?)';
    const values = [shop_name, email, phone, address, hashedPassword];

    await db.query(query, values);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.user_id },
      'RAHASIA',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user_id: user.user_id,
      shop_name: user.shop_name,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const [rows] = await db.query('SELECT * FROM admin WHERE username = ?', [username]);
    const admin = rows[0];

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
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
