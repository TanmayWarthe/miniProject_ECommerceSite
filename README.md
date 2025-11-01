# E-Commerce Site

## Description
A full-stack e-commerce web application built with Node.js, Express.js for the backend, and vanilla JavaScript for the frontend. The application provides a complete shopping experience with user authentication, product management, shopping cart functionality, and order processing.

## Features
- User Authentication (Sign up, Login, Logout)
- Product Catalog with Categories
- Shopping Cart Management
- Order Processing
- User Profile Management
- Responsive Design

## Project Structure
```
ecommerce-app/
├── backend/
│   ├── config/         # Configuration files
│   ├── database/       # Database initialization and setup
│   ├── middleware/     # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── package.json    # Backend dependencies
│   └── server.js       # Main server file
└── frontend/
    ├── assets/         # Images and other static assets
    ├── css/           # Stylesheets
    ├── js/            # JavaScript files
    └── index.html     # Main HTML file
```

## Technologies Used
### Backend
- Node.js
- Express.js
- MongoDB
- JSON Web Tokens (JWT) for authentication

### Frontend
- HTML5
- CSS3
- JavaScript (ES6+)

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB

### Installation Steps

1. Clone the repository:
```bash
git clone [repository-url]
cd ecommerce-app
```

2. Setup Backend:
```bash
cd backend
npm install
```

3. Configure Environment Variables:
Create a `.env` file in the backend directory with the following:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your_jwt_secret
```

4. Start the Backend Server:
```bash
npm start
```

5. Access the Frontend:
- Open `frontend/index.html` in your web browser
- Or use a local server to serve the frontend files

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- GET /api/auth/logout - User logout

### Products
- GET /api/products - Get all products
- GET /api/products/:id - Get single product
- POST /api/products - Add new product (Admin only)
- PUT /api/products/:id - Update product (Admin only)
- DELETE /api/products/:id - Delete product (Admin only)

### Cart
- GET /api/cart - Get user's cart
- POST /api/cart - Add item to cart
- PUT /api/cart/:itemId - Update cart item
- DELETE /api/cart/:itemId - Remove item from cart

### Orders
- GET /api/orders - Get user's orders
- POST /api/orders - Create new order
- GET /api/orders/:id - Get order details

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contact
For any queries or support, please reach out to [Tanmay Warthe]