# Food Delivery Backend (Node.js + MongoDB)

Backend service for a food delivery application with dynamic "six-hit" discounts and two-vendor order handling.

## Architecture Overview
- **API**: Node.js + Express REST API (`/api/v1`).
- **Database**: MongoDB via Mongoose.
- **Promotion Logic**: A single "six-hit" promotion document controls discount status, percent, and expiry.
- **Order Flow**: Orders validate vendor + items, check active promotion, compute totals, and persist.

## Key Endpoints
Base URL: `/api/v1`

- `GET /health`
- `POST /vendors`
- `GET /vendors`
- `GET /vendors/:id/metrics?windowMinutes=60`
- `POST /products`
- `GET /products`
- `GET /products/:id`
- `POST /orders`
- `GET /orders/:id`

## Setup Instructions

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Create `.env` from `.env.example` and update as needed.

### 3) Run locally
```bash
npm run dev
```

## Assumptions
- The "six-hit" event is toggled by an internal operator updating the `promotions` collection in MongoDB.
- Discounts apply while the promotion is active and before `expiresAt`.
- Currency uses decimal numbers (2-decimal rounding). For production, consider integer minor units.
- When `productId` is provided in order items, price/name are taken from inventory and stock is decremented atomically.

## Performance / Scaling Notes
- Indexed `vendorId` and `createdAt` on orders to support high-throughput reads and metrics.
- Minimal per-request queries (vendor lookup, optional capacity check, promotion lookup).
- Vendor capacity enforcement via `ENFORCE_VENDOR_LIMIT` (defaults to true).
- Configurable per-IP rate limiting for the API and order placement (`RATE_LIMIT_*`, `ORDER_RATE_LIMIT_*`).
- Configurable MongoDB pool size (`MONGO_MAX_POOL_SIZE`) to tune concurrent connections.
- Stock deductions use atomic `$inc` + `$gte` to prevent overselling during bursts.
- Stateless API design enables horizontal scaling behind a load balancer.

## Promotion Control (Internal)
To enable/disable the six-hit discount without public APIs, update MongoDB directly:

Enable:
```bash
mongosh "$MONGODB_URI" --eval 'db.promotions.updateOne({type:"six-hit"},{$set:{isActive:true,discountPercent:60,activatedAt:new Date(),expiresAt:new Date(Date.now()+10*60*1000)}},{upsert:true})'
```

Disable:
```bash
mongosh "$MONGODB_URI" --eval 'db.promotions.updateOne({type:"six-hit"},{$set:{isActive:false}},{upsert:true})'
```

## Deployment (AWS Lightsail)
1. Create a Lightsail instance (Ubuntu + Node.js or base Ubuntu).
2. Install Node.js (18+), MongoDB (or connect to MongoDB Atlas).
3. Clone this repo, set `.env`, and run `npm install`.
4. Use a process manager like `pm2`:
   ```bash
   npm install -g pm2
   pm2 start src/index.js --name food-delivery-api
   pm2 save
   pm2 startup
   ```
   For multi-core scaling, use the provided `ecosystem.config.js`:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```
5. Configure Lightsail networking to allow inbound traffic on your API port.

## Postman Collection
A Postman collection is included at:
- `postman/food-delivery-api.postman_collection.json`

Import it and set the `baseUrl` variable (example: `http://localhost:3000/api/v1`).
