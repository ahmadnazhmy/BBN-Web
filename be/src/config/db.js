require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'nazhmy',
  password: 'GGB8-(tYwlDNI4eB', 
  database: 'bbn_web',
  port: 3306
});

module.exports = pool