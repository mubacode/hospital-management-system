const mysql = require('mysql2');
const path = require('path');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
});

// Convert pool to use promises
const promisePool = pool.promise();

module.exports = promisePool;