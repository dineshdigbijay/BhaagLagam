// backend/db.js

const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a secure database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10, // Adjust based on your needs
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: true // Enable SSL for secure connection
  }
});

// Test the database connection on startup
(async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to AWS RDS MySQL database');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1); // Exit if database connection fails
  }
})();

// Enhanced query function with error handling
async function query(sql, params) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw new Error('Database operation failed');
  }
}

module.exports = {
  pool,
  query
};