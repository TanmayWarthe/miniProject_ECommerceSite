const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { pool, testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection on startup
testConnection();

// Auth Middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Get user from database
        const [users] = await pool.execute(
            'SELECT id, name, email FROM users WHERE id = ?',
            [decoded.userId]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }
        
        req.user = users[0];
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

// Routes

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        res.status(201).json({ 
            message: 'User created successfully',
            userId: result.insertId 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
    });
});

// Product Routes
app.get('/api/products', async (req, res) => {
    try {
        const [products] = await pool.execute(`
            SELECT * FROM products ORDER BY created_at DESC
        `);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const [products] = await pool.execute(
            'SELECT * FROM products WHERE id = ?',
            [req.params.id]
        );

        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(products[0]);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Cart Routes
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const [cartItems] = await pool.execute(`
            SELECT c.*, p.name, p.price, p.image, p.stock 
            FROM cart c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = ?
        `, [req.user.id]);

        // Format the response to match frontend expectations
        const formattedItems = cartItems.map(item => ({
            productId: {
                id: item.product_id,
                _id: item.product_id, // For compatibility with frontend
                name: item.name,
                price: parseFloat(item.price),
                image: item.image,
                stock: item.stock
            },
            quantity: item.quantity
        }));

        res.json(formattedItems);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/cart/add', authenticateToken, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        // Check if product exists
        const [products] = await pool.execute(
            'SELECT id FROM products WHERE id = ?',
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if item already in cart
        const [existingItems] = await pool.execute(
            'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?',
            [req.user.id, productId]
        );

        if (existingItems.length > 0) {
            // Update quantity
            const newQuantity = existingItems[0].quantity + quantity;
            await pool.execute(
                'UPDATE cart SET quantity = ? WHERE id = ?',
                [newQuantity, existingItems[0].id]
            );
        } else {
            // Add new item
            await pool.execute(
                'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [req.user.id, productId, quantity]
            );
        }

        // Return updated cart
        const [cartItems] = await pool.execute(`
            SELECT c.*, p.name, p.price, p.image, p.stock 
            FROM cart c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = ?
        `, [req.user.id]);

        const formattedItems = cartItems.map(item => ({
            productId: {
                id: item.product_id,
                _id: item.product_id,
                name: item.name,
                price: parseFloat(item.price),
                image: item.image,
                stock: item.stock
            },
            quantity: item.quantity
        }));

        res.json(formattedItems);
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/cart/update', authenticateToken, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            await pool.execute(
                'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
                [req.user.id, productId]
            );
        } else {
            // Update quantity
            const [result] = await pool.execute(
                'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
                [quantity, req.user.id, productId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Cart item not found' });
            }
        }

        // Return updated cart
        const [cartItems] = await pool.execute(`
            SELECT c.*, p.name, p.price, p.image, p.stock 
            FROM cart c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = ?
        `, [req.user.id]);

        const formattedItems = cartItems.map(item => ({
            productId: {
                id: item.product_id,
                _id: item.product_id,
                name: item.name,
                price: parseFloat(item.price),
                image: item.image,
                stock: item.stock
            },
            quantity: item.quantity
        }));

        res.json(formattedItems);
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/cart/remove', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.body;

        await pool.execute(
            'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
            [req.user.id, productId]
        );

        // Return updated cart
        const [cartItems] = await pool.execute(`
            SELECT c.*, p.name, p.price, p.image, p.stock 
            FROM cart c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = ?
        `, [req.user.id]);

        const formattedItems = cartItems.map(item => ({
            productId: {
                id: item.product_id,
                _id: item.product_id,
                name: item.name,
                price: parseFloat(item.price),
                image: item.image,
                stock: item.stock
            },
            quantity: item.quantity
        }));

        res.json(formattedItems);
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Order Routes
app.post('/api/orders/create', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { items } = req.body;

        // Calculate total
        const total = items.reduce((sum, item) => {
            return sum + (item.productId.price * item.quantity);
        }, 0);

        // Create order
        const [orderResult] = await connection.execute(
            'INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)',
            [req.user.id, total, 'pending']
        );

        const orderId = orderResult.insertId;

        // Add order items
        for (const item of items) {
            await connection.execute(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.productId.id, item.quantity, item.productId.price]
            );
        }

        // Clear user's cart
        await connection.execute(
            'DELETE FROM cart WHERE user_id = ?',
            [req.user.id]
        );

        await connection.commit();

        res.status(201).json({ 
            message: 'Order created successfully', 
            orderId: orderId 
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const [orders] = await pool.execute(`
            SELECT o.*, 
                   GROUP_CONCAT(
                       CONCAT(oi.product_id, ':', oi.quantity, ':', oi.price)
                   ) as items_data
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = ?
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `, [req.user.id]);

        // Format orders with items
        const formattedOrders = orders.map(order => ({
            id: order.id,
            total: parseFloat(order.total),
            status: order.status,
            createdAt: order.created_at,
            items: order.items_data ? order.items_data.split(',').map(itemStr => {
                const [productId, quantity, price] = itemStr.split(':');
                return {
                    productId: parseInt(productId),
                    quantity: parseInt(quantity),
                    price: parseFloat(price)
                };
            }) : []
        }));

        res.json(formattedOrders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Initialize sample data endpoint
app.post('/api/init-data', async (req, res) => {
    try {
        // This would re-run the database initialization
        // In a real app, you might want to protect this endpoint
        res.json({ message: 'Use the database/init.js script to initialize data' });
    } catch (error) {
        console.error('Error initializing data:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const [result] = await pool.execute('SELECT 1');
        res.json({ 
            status: 'OK', 
            database: 'Connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'Error', 
            database: 'Disconnected',
            error: error.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 MySQL Database: ${process.env.DB_NAME || 'ecommerce_db'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});