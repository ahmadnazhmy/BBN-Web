require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'u263419032_nazhmy',
  password: 'GGB8-%28tYwlDNI4eB', 
  database: 'u263419032_bbn_web',
  port: 3306
});

module.exports = pool