# ShopSphere — Full-Stack E-Commerce Web Application

Tech stack: React + Vite frontend, Node.js + Express backend, MongoDB database, JWT authentication.

## Folder structure
- frontend/ — React application
- backend/ — REST API and MongoDB models

## Run
Open two terminals.

Terminal 1:
cd backend
npm install
copy .env.example .env
npm run dev

Terminal 2:
cd frontend
npm install
npm run dev

MongoDB must be running locally. Database: `ecommerce_db`.

Admin login seeded by backend:
- Email: admin@shop.com
- Password: admin123

Change the admin password before deploying publicly.
