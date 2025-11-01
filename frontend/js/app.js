// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// Global state
let products = [];
let cart = [];
let currentUser = null;

// DOM Elements
const productsGrid = document.getElementById('products-grid');
const cartIcon = document.getElementById('cart-icon');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCart = document.getElementById('close-cart');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const accountLink = document.getElementById('account-link');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const closeModals = document.querySelectorAll('.close-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    await loadProducts();
    await loadCart();
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    // Cart functionality
    cartIcon.addEventListener('click', toggleCart);
    closeCart.addEventListener('click', toggleCart);
    checkoutBtn.addEventListener('click', proceedToCheckout);

    // Filter products
    filterBtns.forEach(button => {
        button.addEventListener('click', () => {
            filterBtns.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const filter = button.getAttribute('data-filter');
            displayProducts(filter);
        });
    });

    // Navigation category filters
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.getAttribute('data-category');
            if (category) {
                filterBtns.forEach(btn => btn.classList.remove('active'));
                const filterButton = document.querySelector(`.filter-btn[data-filter="${category}"]`);
                if (filterButton) {
                    filterButton.classList.add('active');
                }
                displayProducts(category);
            }
        });
    });

    // Modal functionality
    accountLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) {
            showUserMenu();
        } else {
            showLoginModal();
        }
    });

    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        hideLoginModal();
        showRegisterModal();
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        hideRegisterModal();
        showLoginModal();
    });

    closeModals.forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            hideLoginModal();
            hideRegisterModal();
        });
    });

    // Forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) hideLoginModal();
        if (e.target === registerModal) hideRegisterModal();
    });
}

// API Functions
async function loadProducts() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to load products');
        products = await response.json();
        displayProducts('all');
        hideLoading();
    } catch (error) {
        console.error('Error loading products:', error);
        hideLoading();
        productsGrid.innerHTML = '<p class="error-message">Failed to load products. Please try again later.</p>';
    }
}

async function loadCart() {
    try {
        const response = await fetch(`${API_BASE_URL}/cart`, {
            headers: getAuthHeaders()
        });
        if (response.ok) {
            cart = await response.json();
            updateCartDisplay();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

// Product Display
function displayProducts(filter = 'all') {
    productsGrid.innerHTML = '';
    
    const filteredProducts = filter === 'all' 
        ? products 
        : products.filter(product => product.category === filter);
    
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '<p class="no-products">No products found in this category.</p>';
        return;
    }
    
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    // Use product.id for MySQL (both id and _id are supported for compatibility)
    const productId = product.id || product._id;
    
    productCard.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-price">$${parseFloat(product.price).toFixed(2)}</p>
            <button class="add-to-cart" data-id="${productId}" ${product.stock === 0 ? 'disabled' : ''}>
                ${product.stock === 0 ? 'OUT OF STOCK' : 'ADD TO CART'}
            </button>
        </div>
    `;
    
    const addToCartBtn = productCard.querySelector('.add-to-cart');
    if (product.stock > 0) {
        addToCartBtn.addEventListener('click', () => addToCart(productId));
    }
    
    return productCard;
}

// Cart Functions
async function addToCart(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ productId, quantity: 1 })
        });

        if (response.ok) {
            await loadCart();
            showNotification('Product added to cart!');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add product to cart');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        if (error.message.includes('login') || error.message.includes('token')) {
            showNotification('Please login to add items to cart', 'error');
            showLoginModal();
        } else {
            showNotification(error.message, 'error');
        }
    }
}

async function updateCartItem(productId, quantity) {
    try {
        const response = await fetch(`${API_BASE_URL}/cart/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ productId, quantity })
        });

        if (response.ok) {
            await loadCart();
        } else {
            throw new Error('Failed to update cart');
        }
    } catch (error) {
        console.error('Error updating cart:', error);
        showNotification('Failed to update cart', 'error');
    }
}

async function removeCartItem(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/cart/remove`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ productId })
        });

        if (response.ok) {
            await loadCart();
        } else {
            throw new Error('Failed to remove item from cart');
        }
    } catch (error) {
        console.error('Error removing from cart:', error);
        showNotification('Failed to remove item from cart', 'error');
    }
}

function updateCartDisplay() {
    // Update cart count
    const cartCount = document.querySelector('.cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart items
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty</p>';
        checkoutBtn.disabled = true;
    } else {
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            
            // Use productId.id for MySQL (both id and _id are supported)
            const productId = item.productId.id || item.productId._id;
            
            cartItem.innerHTML = `
                <img src="${item.productId.image}" alt="${item.productId.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.productId.name}</h4>
                    <p class="cart-item-price">$${item.productId.price.toFixed(2)}</p>
                    <div class="quantity-controls">
                        <button class="quantity-btn minus" data-id="${productId}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn plus" data-id="${productId}">+</button>
                    </div>
                    <button class="remove-item" data-id="${productId}">Remove</button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
        
        // Add event listeners to quantity buttons
        document.querySelectorAll('.quantity-btn.minus').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-id');
                const item = cart.find(item => {
                    const itemId = item.productId.id || item.productId._id;
                    return itemId == productId;
                });
                if (item && item.quantity > 1) {
                    updateCartItem(productId, item.quantity - 1);
                } else {
                    removeCartItem(productId);
                }
            });
        });
        
        document.querySelectorAll('.quantity-btn.plus').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-id');
                const item = cart.find(item => {
                    const itemId = item.productId.id || item.productId._id;
                    return itemId == productId;
                });
                if (item) {
                    updateCartItem(productId, item.quantity + 1);
                }
            });
        });
        
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-id');
                removeCartItem(productId);
            });
        });
        
        checkoutBtn.disabled = false;
    }
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.productId.price * item.quantity), 0);
    cartTotal.textContent = `Total: $${total.toFixed(2)}`;
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    const email = loginForm.querySelector('input[type="email"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;

    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            localStorage.setItem('token', data.token);
            hideLoginModal();
            showNotification('Login successful!');
            await loadCart();
            updateUserInterface();
            
            // Clear form
            loginForm.reset();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = registerForm.querySelector('input[type="text"]').value;
    const email = registerForm.querySelector('input[type="email"]').value;
    const password = registerForm.querySelector('input[type="password"]').value;

    if (!name || !email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        if (response.ok) {
            showNotification('Registration successful! Please login.');
            hideRegisterModal();
            showLoginModal();
            
            // Clear form
            registerForm.reset();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification(error.message, 'error');
    }
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// UI Functions
function toggleCart() {
    cartSidebar.classList.toggle('active');
}

function showLoading() {
    loadingSpinner.style.display = 'flex';
    productsGrid.style.display = 'none';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
    productsGrid.style.display = 'grid';
}

function showLoginModal() {
    loginModal.style.display = 'block';
}

function hideLoginModal() {
    loginModal.style.display = 'none';
}

function showRegisterModal() {
    registerModal.style.display = 'block';
}

function hideRegisterModal() {
    registerModal.style.display = 'none';
}

function showUserMenu() {
    // Create user dropdown menu
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.style.cssText = `
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        padding: 10px;
        min-width: 150px;
        z-index: 1000;
    `;
    
    userMenu.innerHTML = `
        <div style="padding: 10px; border-bottom: 1px solid #eee;">
            <strong>${currentUser.name}</strong>
            <div style="font-size: 0.8rem; color: #777;">${currentUser.email}</div>
        </div>
        <button id="view-orders" style="width: 100%; padding: 8px; background: none; border: none; text-align: left; cursor: pointer;">
            <i class="fas fa-shopping-bag"></i> My Orders
        </button>
        <button id="logout-btn" style="width: 100%; padding: 8px; background: none; border: none; text-align: left; cursor: pointer; color: #e60000;">
            <i class="fas fa-sign-out-alt"></i> Logout
        </button>
    `;
    
    accountLink.style.position = 'relative';
    accountLink.appendChild(userMenu);
    
    // Add event listeners
    document.getElementById('view-orders').addEventListener('click', viewOrders);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!accountLink.contains(e.target)) {
                userMenu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 0);
}

function viewOrders() {
    showNotification('Order history feature coming soon!');
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('token');
    cart = [];
    updateCartDisplay();
    updateUserInterface();
    showNotification('Logged out successfully');
}

function updateUserInterface() {
    if (currentUser) {
        accountLink.innerHTML = `<i class="far fa-user"></i> ${currentUser.name}`;
    } else {
        accountLink.innerHTML = `<i class="far fa-user"></i> Account`;
    }
}

function showNotification(message, type = 'success') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(notification => {
        notification.remove();
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 5px;
        z-index: 1001;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}

async function proceedToCheckout() {
    if (!currentUser) {
        showNotification('Please login to proceed with checkout', 'error');
        showLoginModal();
        return;
    }

    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/orders/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ items: cart })
        });

        if (response.ok) {
            const data = await response.json();
            showNotification(`Order #${data.orderId} placed successfully!`);
            await loadCart(); // This will clear the cart
            toggleCart();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Checkout failed');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        showNotification(error.message, 'error');
    }
}

// Check for existing token on page load
window.addEventListener('load', async () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                currentUser = await response.json();
                updateUserInterface();
                await loadCart();
            } else {
                throw new Error('Token validation failed');
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            localStorage.removeItem('token');
        }
    }
});

// Add some CSS for better error messages
const additionalStyles = `
    .error-message {
        text-align: center;
        color: #e60000;
        padding: 20px;
        font-size: 1.1rem;
    }
    
    .no-products {
        text-align: center;
        color: #666;
        padding: 40px;
        font-size: 1.1rem;
        grid-column: 1 / -1;
    }
    
    .user-menu {
        font-family: 'Helvetica Neue', Arial, sans-serif;
    }
    
    .user-menu button:hover {
        background-color: #f5f5f5;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);