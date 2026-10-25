# TurfEase — Owner-Only Turf Management System

A high-performance management engine and agronomic telemetry portal for turf facility owners, featuring real-time slot scheduling, automated conflict prevention, server-calculated financial auditing, and MongoDB Atlas data persistence.

---

## 1. System Architecture

```
TURFEASE/
├── dist/                          # Production Vite build
├── public/                        # Static web assets
├── server/                        # Modular Node/Express Backend
│   ├── config/
│   │   └── db.js                  # MongoDB Atlas connection & health telemetry
│   ├── controllers/
│   │   ├── authController.js      # Owner authentication & JWT issuance
│   │   ├── bookingController.js   # Booking CRUD, pricing & overlap prevention
│   │   ├── paymentController.js   # Ledger, partial payment & balance tracking
│   │   ├── reportController.js    # Live MongoDB metrics & analytics
│   │   ├── slotController.js      # Availability matrix & maintenance blocks
│   │   └── turfController.js      # Pitch assets CRUD & safe deactivation
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT bearer authentication guard
│   │   ├── errorMiddleware.js     # Centralized error handler & CastError parser
│   │   └── rateLimiter.js         # Brute-force & DDoS rate limiting
│   ├── models/
│   │   ├── Booking.js             # Booking model with status & timestamps
│   │   ├── Owner.js               # Owner account with bcrypt hashing
│   │   ├── Payment.js             # Financial transaction ledger
│   │   ├── TimeSlot.js            # Slot matrix & maintenance schedule
│   │   └── Turf.js                # Pitch specs & agronomy telemetry
│   ├── routes/
│   │   ├── authRoutes.js          # /api/auth/*
│   │   ├── bookingRoutes.js       # /api/bookings/*
│   │   ├── healthRoutes.js        # /api/health
│   │   ├── paymentRoutes.js       # /api/payments/*
│   │   ├── reportRoutes.js        # /api/dashboard/stats, /api/reports/analytics
│   │   ├── slotRoutes.js          # /api/slots/*
│   │   └── turfRoutes.js          # /api/turfs/*
│   ├── scripts/
│   │   ├── seed.js                # Initial owner & pitches database seed script
│   │   └── testEndpoints.js       # Automated backend integration test suite
│   ├── .env                       # Local secrets (git-ignored)
│   ├── .env.example               # Safe environment template
│   ├── package.json               # Backend dependencies
│   └── server.js                  # Express application entry point
├── src/                           # React + Vite + Tailwind Frontend
│   ├── components/                # Reusable UI components
│   ├── context/                   # AuthContext with backend token sync
│   ├── pages/                     # Dashboard, Turfs, Slots, Payments, Reports
│   └── services/
│       └── api.js                 # Centralized API client layer
├── .gitignore                     # Git configuration ignoring .env and node_modules
├── package.json                   # Frontend dependencies
└── vite.config.js                 # Vite dev server configuration
```

---

## 2. Environment Variables Configuration

All backend secrets are stored exclusively in `server/.env`.
A template is provided in `server/.env.example`:

| Variable | Description | Example Placeholder |
|---|---|---|
| `PORT` | Backend HTTP listening port | `5000` |
| `NODE_ENV` | Runtime environment | `development` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/turfease?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key used to sign owner JWT tokens | `turfease_secure_jwt_dev_key_...` |
| `JWT_EXPIRES_IN` | Token lifespan | `7d` |
| `CORS_ORIGIN` | Allowed frontend origins | `http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173` |
| `SEED_OWNER_EMAIL` | Default clubhouse administrator email | `manager@wembleyturf.com` |
| `SEED_OWNER_PASSWORD` | Default clubhouse administrator password | `owner1234` |

> [!NOTE]
> When you first clone the repository, open `server/.env` and paste your MongoDB Atlas connection string into `MONGODB_URI`. Never commit your real credentials.

---

## 3. Quick Start & Execution Commands

### Prerequisites
- Node.js v18+ (tested on Node v20.18.0)
- MongoDB Atlas cluster (or local MongoDB)

### Step 1: Install Dependencies
Open two terminal windows:

**Frontend Terminal (Root):**
```powershell
npm install
```

**Backend Terminal (`server/` directory):**
```powershell
cd server
npm install
```

### Step 2: Seed the Database
Ensure your `MONGODB_URI` is populated in `server/.env`, then run:
```powershell
cd server
npm run seed
```
This initializes the initial owner account (`manager@wembleyturf.com`), 6 synthetic/hybrid pitch assets, and initial sample bookings and payment transactions.

### Step 3: Start the Backend Server
```powershell
cd server
npm run dev
# Or npm start
```
The backend starts on `http://localhost:5000`. You can test health by visiting `http://localhost:5000/api/health`.

### Step 4: Start the Frontend Application
In the root directory:
```powershell
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 4. REST API Endpoint Reference

All management routes require the `Authorization: Bearer <token>` HTTP header returned upon login.

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/health` | `GET` | Public | System uptime & live MongoDB connection state |
| `/api/auth/login` | `POST` | Public (Rate Limited) | Authenticate owner & receive JWT token |
| `/api/auth/me` | `GET` | Private | Retrieve authenticated owner profile |
| `/api/turfs` | `GET` | Private | List turfs with sport, status, & sort filters |
| `/api/turfs/:id` | `GET` | Private | Get detailed specification of single turf |
| `/api/turfs` | `POST` | Private | Create a new pitch asset |
| `/api/turfs/:id` | `PUT` | Private | Update turf attributes & agronomic telemetry |
| `/api/turfs/:id/status` | `PATCH` | Private | Toggle turf status between active & inactive |
| `/api/turfs/:id` | `DELETE` | Private | Safe deletion (rejects if booking history exists) |
| `/api/bookings` | `GET` | Private | List bookings filtered by date, turf, status |
| `/api/bookings` | `POST` | Private | Create booking (checks schedule overlap & server pricing) |
| `/api/bookings/:id` | `GET` | Private | Retrieve booking details |
| `/api/bookings/:id` | `PUT` | Private | Update booking record |
| `/api/bookings/:id/cancel` | `PATCH` | Private | Safe cancellation (frees slot, marks Refunded) |
| `/api/slots/availability` | `GET` | Private | 2-hour interval pitch availability matrix |
| `/api/slots/block` | `POST` | Private | Block slot for maintenance, aeration, sprinklers |
| `/api/slots/unblock` | `POST` | Private | Release maintenance block |
| `/api/payments` | `GET` | Private | List financial ledger entries with filters |
| `/api/payments/:id` | `GET` | Private | Retrieve payment transaction receipt |
| `/api/payments` | `POST` | Private | Record payment / reconcile balance (prevents overpayment) |
| `/api/payments/:id` | `PUT` | Private | Update transaction note or method |
| `/api/dashboard/stats` | `GET` | Private | Live KPIs (inventory, bookings, collected revenue) |
| `/api/reports/analytics` | `GET` | Private | Aggregated yield, status counts & turf breakdown |

---

## 5. Security & Business Rules Implemented

1. **Server-Side Pricing**: Total booking prices are computed strictly on the backend using the pitch's `hourlyPrice` multiplied by duration. Front-end amounts are never trusted.
2. **Double-Booking & Maintenance Conflict Prevention**: When creating a booking, the engine performs interval overlap checks against existing active bookings and blocked maintenance slots for that pitch and date.
3. **Safe Pitch Deletion**: A turf cannot be deleted if historical bookings exist. The system requires deactivation instead, protecting financial audit compliance.
4. **Overpayment Safeguards**: Partial payments are supported; recording an amount greater than the outstanding balance is strictly rejected with a clear error message.
5. **Brute-Force Rate Limiting**: The authentication endpoints feature dedicated window rate-limiting to prevent password attacks.
6. **Graceful Disconnected Fallback**: If the database connection string is not yet configured, the system provides transparent status reporting without unhandled crashes.