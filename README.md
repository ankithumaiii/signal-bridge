# Signal Bridge — Offline-Aware Emergency Safety & Monetizable SOS Platform

[![Test Suite](https://img.shields.io/badge/Tests-32%20Passed-10B981?style=flat-square)](https://github.com/ankithumaiii/signal-bridge)
[![Status](https://img.shields.io/badge/Platform-Production--Ready-3A86FF?style=flat-square)](https://github.com/ankithumaiii/signal-bridge)
[![Payments](https://img.shields.io/badge/Razorpay-India%20Compliant-0C2340?style=flat-square)](https://razorpay.com)
[![SMS](https://img.shields.io/badge/SMS-MSG91%20DLT-E63946?style=flat-square)](https://msg91.com)
[![Emergency 112](https://img.shields.io/badge/ERSS%20112-Integrated-E63946?style=flat-square)](https://github.com/ankithumaiii/signal-bridge)

Signal Bridge is an offline-aware personal emergency safety, family SOS alert, danger-zone hazard awareness, and membership safety platform designed for rapid crisis response, urban disasters, and everyday personal safety.

---

## 1. Project Overview & Product Vision

During natural disasters (floods, storms, earthquakes) or civic crises, cellular towers get saturated, power grids flicker, and communication breaks down. 

Signal Bridge solves this by combining:
1. **End-to-End Emergency SOS & Real SMS Dispatch**: Press-and-hold activation with cancellation grace periods, automatic GPS coordinate capture, pluggable carrier SMS dispatch (MSG91 DLT compliant), per-recipient status tracking, and direct **Call 112** dialer integration.
2. **Safety Radar & Interactive Hazard Map**: Real-time Leaflet map displaying community hazards (waterlogging, road blocks, fire, accidents) with a **transparent rule-based corroboration engine** (no black-box AI scores).
3. **Family Safety Circles**: Authenticated family conversations with Socket.IO real-time delivery and **offline-aware IndexedDB/localStorage queue synchronization** with stable idempotency keys.
4. **Subscription & Entitlement Engine**: Free Guard tier (perpetual free SOS, 112 dialing, up to 3 contacts) and Plus Membership (₹99/mo or ₹999/yr) unlocking extended audit history, safety check-ins, automated hazard alerts, and priority dispatch.
5. **Razorpay India Payment Gateway**: Timing-safe HMAC-SHA256 signature verification, raw request-body webhook processing, and replay deduplication with TTL indexes.
6. **Safety Non-Negotiable**: Emergency SOS activation and manual 112 dialing are **100% free and never paywalled**, regardless of subscription status.

---

## 2. Architecture & Technology Stack

```
signal-bridge/
├── client/                     # Frontend (React 19, Vite, Plain CSS design system)
│   ├── src/
│   │   ├── components/         # Leaflet Map, SOS Button, Call 112 Button, Navbars, StatusBadge
│   │   ├── context/            # AuthContext, OfflineContext, LocationContext
│   │   ├── layouts/            # AppLayout (Desktop sidebar + Mobile bottom nav)
│   │   ├── pages/              # Dashboard, SOS, Radar Map, Report, Family, Chat, History, Settings, Subscription
│   │   ├── services/           # API Client, Socket.IO Client, OfflineQueue
│   │   ├── styles/             # Plain CSS Design System (index.css)
│   │   ├── App.jsx             # React Router v7 routes
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                     # Backend API & WebSocket Engine (Node.js, Express, MongoDB)
│   ├── src/
│   │   ├── config/             # DB, Environment & Subscription Plan definitions (plans.js)
│   │   ├── controllers/        # Auth, Contacts, SOS, Hazards, Messages, Dashboard, Subscription, Payment
│   │   ├── middleware/         # JWT Auth, Zod Validation, Rate Limiters, Centralized Error Handler
│   │   ├── models/             # User, Contact, SOSIncident, Hazard, Conversation, Message, Subscription, ProcessedWebhook
│   │   ├── routes/             # RESTful Endpoints (auth, contacts, sos, hazards, messages, dashboard, subscription, payment)
│   │   ├── services/           # SMS Service & Providers (MSG91, Mock), Subscription Service, Payment Service
│   │   ├── socket/             # Socket.IO Realtime Rooms
│   │   ├── utils/              # Database Seeder (seed.js)
│   │   ├── app.js              # Express app with rawBody capture for webhooks
│   │   └── server.js           # Server startup & WebSocket attachment
│   ├── tests/                  # Automated test suite (api.test.js, sms.test.js, subscription.test.js)
│   └── package.json
├── Dockerfile                  # Production container configuration
├── render.yaml                 # Render persistent deployment configuration
├── package.json                # Root orchestration scripts
└── README.md
```

### Stack Details
- **Frontend**: React 19, Vite, React Router 7, Leaflet with OpenStreetMap, Lucide React, Socket.IO Client. **Vanilla CSS design system** with CSS custom properties (no Tailwind).
- **Backend**: Node.js v24, Express, MongoDB with Mongoose, Razorpay SDK, Socket.IO, bcryptjs, jsonwebtoken, Zod validation, Helmet, CORS, and Express Rate Limit.
- **Testing**: Node.js native test runner (`node --test`), **32 automated tests passing with zero failures**.

---

## 3. Implemented Features vs. Demo Simulation Transparency

| Feature | Implementation Status | Technical Mechanism |
| :--- | :--- | :--- |
| **Emergency SOS Activation** | **Production Real** | 2-second hold-to-activate, GPS coordinate capture with accuracy circle, incident database record. |
| **Emergency Call 112** | **Production Real** | Accessible phone link `tel:112` with structured dispatcher readout card & clipboard copy. |
| **SMS Carrier Dispatch** | **Production Adapter** | Indian TRAI/DLT compliant adapter for MSG91 Flow API (`/api/v5/flow/`) and SendSMS (`/api/v2/sendsms`) with bounded retries and status tracking (`queued`, `sending`, `accepted_by_provider`, `delivered`, `failed`, `simulated`). In `DEMO_MODE=true`, message dispatch is safely simulated without outbound API calls. |
| **Subscription & Entitlements** | **Production Real** | Server-authoritative plans (Free Guard ₹0, Plus Monthly ₹99, Plus Annual ₹999). Subscription records in MongoDB, entitlement evaluation, and cancellation scheduling. |
| **Razorpay Payments** | **Production Real** | Razorpay Node.js SDK order creation, timing-safe HMAC-SHA256 signature verification (`crypto.timingSafeEqual`), and raw-body webhook deduplication via `ProcessedWebhook` model. |
| **Safety Radar Map** | **Production Real** | Leaflet OSM map, category & severity filters, real-time Socket.IO broadcasts. |
| **Transparent Hazard Corroboration** | **Production Real** | Spatial proximity matching (Haversine formula within 800m), time window (2h), and peer corroboration counters. |
| **Family Circle Messaging** | **Production Real** | Real-time Socket.IO channels with offline queue fallback and duplicate submission prevention (idempotency keys). |
| **Device-to-Device Radio Mesh** | **Documented Limitation** | Browser sandboxes cannot access native BLE/radio hardware without native OS daemons. |

---

## 4. Environment Variables

Create `server/.env` based on `server/.env.example`:

```env
# Server
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/signal_bridge
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
DEMO_MODE=true

# Real SMS Provider Configuration (India TRAI / DLT Compliant)
# Options: msg91 | mock
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=
MSG91_SENDER_ID=SIGBRG
MSG91_TEMPLATE_ID=

# Razorpay Payment Gateway Configuration (India)
# Test mode keys from https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

---

## 5. Getting Started Locally

### Prerequisites
- Node.js (v18 or higher; v24 recommended)
- MongoDB running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI

### Installation & Run

1. **Install dependencies**:
   ```bash
   npm --prefix server install
   npm --prefix client install
   ```

2. **Seed Realistic Demo Data**:
   ```bash
   npm run seed
   ```
   *Seeds Bangalore tech corridor demo hazards, contacts, family conversations, and demo account:*
   - **Email**: `demo@signalbridge.org`
   - **Password**: `demo12345`

3. **Run Hot-Reload Development Servers**:
   ```bash
   npm run dev:server   # Starts Express backend on port 5000
   npm run dev:client   # Starts Vite React frontend on port 5173
   ```

4. **Access the Application**:
   Open `http://localhost:5173` in your browser.

---

## 6. Automated Testing

Run the complete test suite:
```bash
npm --prefix server test
```

**Results: 32/32 tests passing (3 test suites):**

### Core API Suite (`tests/api.test.js` - 17 tests)
- `GET /api/health` — 200 OK & service status
- `POST /api/auth/register` — user creation, password hash & token
- `POST /api/auth/login` — credentials verification & rejection of bad passwords
- `GET /api/auth/me` — protected route verification (authorized & 401 unauthenticated)
- `POST /api/contacts` & `GET /api/contacts` — trusted contact management & authorization
- `POST /api/contacts/checkin` — family check-in synchronization
- `POST /api/sos` — persistent SOS incident generation with location
- `POST /api/sos/call-112` — user call logging
- `POST /api/hazards` & `GET /api/hazards` — hazard reporting & spatial clustering
- `POST /api/hazards/:id/corroborate` — transparent corroboration engine
- `POST /api/messages/conversations/:id/messages` — messaging & idempotency retry deduplication
- `GET /api/dashboard/stats` — aggregated dashboard statistics

### Real SMS & Dispatch Isolation Suite (`tests/sms.test.js` - 6 tests)
- `DEMO_MODE=true` strictly sets `channel=simulated_dispatch` and never calls external SMS APIs.
- Production mode (`DEMO_MODE=false`) fails safely if credentials are missing without crashing.
- `MockSMSProvider` verifies retry behavior on transient network failures.
- `GET /api/sos/:id/notifications` returns detailed delivery records to the authorized incident owner.
- `GET /api/sos/:id/notifications` strictly blocks non-owner requests (404/401).
- SOS dispatch only queries and notifies contacts belonging to the authenticated user.

### Subscription & Razorpay Payment Suite (`tests/subscription.test.js` - 9 tests)
- `GET /api/subscription/plans` returns catalog and guarantees 100% free SOS access.
- `GET /api/subscription/current` blocks unauthenticated users (401).
- `GET /api/subscription/current` defaults to Free Guard tier with full baseline safety access.
- `POST /api/payments/create-order` creates orders using server-defined pricing (rejects client tampering).
- `POST /api/payments/verify` rejects forged/invalid HMAC signatures (400).
- `POST /api/payments/verify` activates Plus plan upon verified signature and prevents duplicate replay.
- `POST /api/subscription/cancel` schedules cancellation at period end while preserving active entitlements.
- `POST /api/payments/webhook` verifies webhook HMAC signatures and deduplicates replay events.
- Emergency SOS activation and manual 112 calling remain 100% functional regardless of plan.

---

## 7. Production Setup Checklist

### 1. SMS Provider (MSG91 / India TRAI DLT Requirements)
- [ ] Register company as Principal Entity on an Indian telecom DLT portal (e.g., Jio, Airtel, Vodafone DLT).
- [ ] Submit and approve Sender ID (e.g., `SIGBRG`).
- [ ] Register and approve transactional SMS template:
  `EMERGENCY ALERT: {#var#} triggered an SOS via Signal Bridge. Location: {#var#}. Call 112 or open link: {#var#}`
- [ ] Obtain MSG91 Auth Key from MSG91 dashboard and set `MSG91_AUTH_KEY`, `MSG91_SENDER_ID`, and `MSG91_TEMPLATE_ID`.
- [ ] Set `DEMO_MODE=false` in production environment.

### 2. Payment Gateway (Razorpay India Requirements)
- [ ] Complete business KYC and activate live merchant account on Razorpay.
- [ ] Generate Live Key ID and Secret in Razorpay Dashboard (`Account & Settings` > `API Keys`).
- [ ] Configure Webhook URL (`https://your-domain.com/api/payments/webhook`) with secret `RAZORPAY_WEBHOOK_SECRET`.
- [ ] Subscribe to webhook events: `order.paid`, `payment.captured`, `payment.failed`, `refund.processed`.
- [ ] Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` on server.

---

## 8. Security, Privacy & Safety Guarantees

- **Free Core Safety**: Emergency SOS dispatch and 112 dialing will never be paywalled.
- **Timing-Safe Cryptography**: HMAC-SHA256 signature verification uses `crypto.timingSafeEqual` to thwart timing attacks.
- **Webhook Idempotency**: `ProcessedWebhook` collection with MongoDB TTL indexes guarantees exactly-once processing of payment webhooks.
- **Zero Cardholder Data**: No credit card numbers, CVVs, or UPI PINs are ever collected, processed, or stored by Signal Bridge.
- **Location Privacy**: Location capture is strictly voluntary, time-stamped, and delivered only to the user's explicit emergency contacts.
- **Audit Trails**: All incidents, delivery receipts, and billing events are immutably logged with sanitized user identifiers.
