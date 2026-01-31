# POS System Backend

Professional Point of Sale Backend API built with Express.js and MongoDB.

## Features

- JWT Authentication for Admin and Shop Users
- Shop Management (CRUD operations)
- Product & Category Management
- Order Processing
- Sales Analytics
- Online Orders Support

## Project Structure

```
backend/
├── config/           # Configuration files
│   ├── db.js         # Database connection
│   └── constants.js  # App constants
├── controllers/      # Route controllers
│   ├── auth.controller.js
│   ├── shop.controller.js
│   ├── product.controller.js
│   ├── category.controller.js
│   ├── order.controller.js
│   ├── analytics.controller.js
│   └── online-order.controller.js
├── middleware/       # Express middleware
│   ├── auth.middleware.js
│   └── validate.middleware.js
├── models/           # Mongoose models
│   ├── User.model.js
│   ├── Category.model.js
│   ├── Product.model.js
│   └── Order.model.js
├── routes/           # API routes
│   ├── auth.routes.js
│   ├── shop.routes.js
│   ├── product.routes.js
│   ├── category.routes.js
│   ├── order.routes.js
│   ├── analytics.routes.js
│   └── online-order.routes.js
├── utils/            # Utility functions
│   ├── helpers.js
│   └── jwt.js
├── scripts/          # Scripts
│   └── seed-admin.js
├── server.js         # Entry point
└── package.json
```

## Installation

```bash
cd backend
npm install
```

## Environment Variables

Copy \`.env.example\` to \`.env\` and update values:

```bash
cp .env.example .env
```

## Running the Server

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## Seed Admin Account

```bash
npm run seed
```

Default credentials:
- Email: admin@pos.com
- Password: admin123

## API Endpoints

### Authentication
- POST /api/auth/login
- POST /api/auth/register-admin
- GET /api/auth/profile

### Shops (Admin only)
- GET /api/shops
- GET /api/shops/:id
- POST /api/shops
- PUT /api/shops/:id
- DELETE /api/shops/:id
- PUT /api/shops/:id/toggle-status

### Products
- GET /api/products
- POST /api/products
- PUT /api/products/:id
- DELETE /api/products/:id

### Categories
- GET /api/categories
- POST /api/categories
- PUT /api/categories/:id
- DELETE /api/categories/:id

### Orders
- GET /api/orders
- GET /api/orders/:id
- POST /api/orders
- PUT /api/orders/:id

### Analytics
- GET /api/analytics

### Online Orders
- GET /api/online-orders
```
```

Now let me create the frontend React.js application:
