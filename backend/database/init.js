const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST || process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQL_USER || process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || ''
});

async function initializeDatabase() {
    try {
        // Create database if it doesn't exist
        await connection.promise().query(
            `CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE || process.env.DB_NAME || 'ecommerce_db'}`
        );
        console.log('✅ Database created or already exists');

        // Switch to the database
        await connection.promise().query(
            `USE ${process.env.MYSQL_DATABASE || process.env.DB_NAME || 'ecommerce_db'}`
        );

        // Create users table
        await connection.promise().execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table created');

        // Create products table
        await connection.promise().execute(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                category ENUM('men', 'women', 'kids', 'accessories', 'sale') NOT NULL,
                image VARCHAR(500) NOT NULL,
                stock INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Products table created');

        // Create cart table
        await connection.promise().execute(`
            CREATE TABLE IF NOT EXISTS cart (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_product (user_id, product_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Cart table created');

        // Create orders table
        await connection.promise().execute(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                total DECIMAL(10, 2) NOT NULL,
                status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
                shipping_address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Orders table created');

        // Create order_items table
        await connection.promise().execute(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Order items table created');

        // Insert sample products
        const sampleProducts = [
            {
                name: "Classic White T-Shirt",
                description: "Comfortable and versatile white t-shirt made from 100% cotton.",
                price: 19.99,
                category: "men",
                image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1480&q=80",
                stock: 50
            },
            {
                name: "Floral Summer Dress",
                description: "Beautiful floral print dress perfect for summer occasions.",
                price: 39.99,
                category: "women",
                image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1374&q=80",
                stock: 30
            },
            {
                name: "Slim Fit Jeans",
                description: "Modern slim fit jeans with stretch for maximum comfort.",
                price: 49.99,
                category: "men",
                image: "https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1326&q=80",
                stock: 25
            },
            {
                name: "Leather Crossbody Bag",
                description: "Genuine leather crossbody bag with adjustable strap.",
                price: 59.99,
                category: "accessories",
                image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=1374&q=80",
                stock: 15
            },
            {
                name: "Knit Sweater",
                description: "Warm and cozy knit sweater for chilly days.",
                price: 45.99,
                category: "women",
                image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?ixlib=rb-4.0.3&auto=format&fit=crop&w=1410&q=80",
                stock: 20
            },
            {
                name: "Running Shoes",
                description: "Lightweight running shoes with excellent cushioning.",
                price: 79.99,
                category: "men",
                image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
                stock: 40
            },
            {
                name: "Silver Necklace",
                description: "Elegant silver necklace with minimalist design.",
                price: 29.99,
                category: "accessories",
                image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
                stock: 35
            },
            {
                name: "Denim Jacket",
                description: "Classic denim jacket with modern fit and style.",
                price: 65.99,
                category: "women",
                image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
                stock: 18
            },
            {
                name: "Dinosaur Print T-Shirt",
                description: "Fun and colorful t-shirt with a dinosaur print for kids.",
                price: 15.99,
                category: "kids",
                image: "https://images.unsplash.com/photo-1593495181229-7045a4846f6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
                stock: 40
            },
            {
                name: "Rainbow Tutu Skirt",
                description: "A vibrant and playful rainbow tutu skirt for kids.",
                price: 22.99,
                category: "kids",
                image: "https://images.unsplash.com/photo-1596753861853-55a9b88a26a4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
                stock: 25
            }
        ];

        for (const product of sampleProducts) {
            await connection.promise().execute(
                `INSERT IGNORE INTO products (name, description, price, category, image, stock) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [product.name, product.description, product.price, product.category, product.image, product.stock]
            );
        }
        console.log('✅ Sample products inserted');

        console.log('🎉 Database initialization completed successfully!');

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    } finally {
        connection.end();
    }
}

initializeDatabase();