require('dotenv').config();
const mysql = require('mysql2/promise');

const dbUrl = process.env.DATABASE_URL;

const url = new URL(dbUrl);

const pool = mysql.createPool({
  host: url.hostname,             
  user: url.username,               
  password: url.password || '',    
  database: url.pathname.substring(1),
  port: url.port || 3306,           
});

module.exports = pool;
