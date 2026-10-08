# E-Commerce Backend

## Setup
1. Install MongoDB and make sure it is running.
2. Copy `.env.example` to `.env` and update `JWT_SECRET` if desired.
3. Run `npm install`.
4. Run `npm run dev`.

API: http://localhost:5000/api

Seeded admin: `admin@shop.com` / `admin123`

## Main endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/products
- POST/PUT/DELETE /api/products (admin)
- POST /api/orders
- GET /api/orders/mine
- GET /api/orders (admin)
- PATCH /api/orders/:id/status (admin)
