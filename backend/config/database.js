const mysql = require('mysql2');
require('dotenv').config();

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || process.env.MYSQLHOST || process.env.DB_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'ecommerce_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convert pool to use promises
const promisePool = pool.promise();

// Test database connection
async function testConnection() {
    try {
        const [rows] = await promisePool.execute('SELECT 1 + 1 AS result');
        console.log('✅ MySQL Database connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

module.exports = {
    pool: promisePool,
    testConnection
};