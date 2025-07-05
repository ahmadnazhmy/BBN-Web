const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00',
});

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Berhasil terhubung ke database:', process.env.DB_HOST);
    connection.release();
  } catch (err) {
    console.error('Gagal terhubung ke database:', err.message);
  }
})();

module.exports = pool;
