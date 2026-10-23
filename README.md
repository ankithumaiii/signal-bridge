# Signal Bridge — Offline-Aware Emergency Safety & SOS Platform

[![Test Suite](https://img.shields.io/badge/Tests-17%20Passed-10B981?style=flat-square)](file:///c:/Users/Ankit%20kumar/OneDrive/Desktop/Hackx/server/tests/api.test.js)
[![Status](https://img.shields.io/badge/MVP-Production--Ready-3A86FF?style=flat-square)](#)
[![Emergency 112](https://img.shields.io/badge/ERSS%20112-Integrated-E63946?style=flat-square)](#)

Signal Bridge is an offline-aware personal emergency safety, family SOS alert, and danger-zone hazard awareness platform designed for rapid crisis response, urban disasters, and day-to-day personal safety.

---

## 1. Project Overview & Product Vision

During natural disasters (floods, storms, earthquakes) or civic crises, cellular towers get saturated, power grids flicker, and communication breaks down. 

Signal Bridge solves this by combining:
1. **End-to-End Emergency SOS**: Press-and-hold activation with cancellation grace periods, automatic GPS coordinate capture, per-recipient dispatch tracking, and immediate **Call 112** integration.
2. **Safety Radar & Interactive Hazard Map**: Real-time Leaflet map displaying community hazards (waterlogging, road blocks, fire, accidents) with a **transparent rule-based corroboration engine** (no fake AI scores).
3. **Family Safety Circles**: Authenticated family conversations with Socket.IO real-time delivery and **offline-aware IndexedDB/localStorage queue synchronization** with stable idempotency keys.
4. **Voluntary Location Sharing**: Opt-in, time-limited, and revocable at any moment.

---

## 2. Architecture & Technology Stack

```
signal-bridge/
├── client/                     # Frontend (React 19, Vite, Plain CSS design system)
│   ├── src/
│   │   ├── components/         # Leaflet Map, SOS Button, Call 112 Button, Navbars
│   │   ├── context/            # AuthContext, OfflineContext, LocationContext
│   │   ├── layouts/            # AppLayout (Desktop sidebar + Mobile bottom nav)
│   │   ├── pages/              # Dashboard, SOS, Radar Map, Report, Family, Chat, History, Settings
│   │   ├── services/           # API Client, Socket.IO Client, OfflineQueue
│   │   ├── styles/             # Plain CSS Design System (index.css)
│   │   ├── App.jsx             # React Router v7 routes
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                     # Backend API & WebSocket Engine (Node.js, Express, MongoDB)
│   ├── src/
│   │   ├── config/             # DB & Environment loaders
│   │   ├── controllers/        # Auth, Contacts, SOS, Hazards, Messages, Dashboard
│   │   ├── middleware/         # JWT Auth, Zod Validation, Rate Limiters, Centralized Error Handler
│   │   ├── models/             # Mongoose Models: User, Contact, SOSIncident, Hazard, Conversation, Message
│   │   ├── routes/             # RESTful Endpoints
│   │   ├── services/           # Rule-based Hazard Corroboration & Notification Dispatch
│   │   ├── socket/             # Socket.IO Realtime Rooms
│   │   ├── utils/              # Database Seeder (seed.js)
│   │   ├── app.js              # Express app configuration
│   │   └── server.js           # Server startup & WebSocket attachment
│   ├── tests/                  # Node.js native test runner test suite (api.test.js)
│   └── package.json
├── Dockerfile                  # Production container configuration
├── render.yaml                 # Render persistent deployment configuration
├── package.json                # Root orchestration scripts
└── README.md
```

### Stack Details
- **Frontend**: React 19, Vite, React Router 7, Leaflet with OpenStreetMap, Lucide React, Socket.IO Client. **No Tailwind CSS** — built using a custom vanilla CSS design system with CSS custom properties.
- **Backend**: Node.js v24, Express, MongoDB with Mongoose, Socket.IO, bcryptjs, jsonwebtoken, Zod validation, Helmet, CORS, and Express Rate Limit.
- **Testing**: Node.js native test runner (`node --test`), 17 automated tests passing with zero failures.

---

## 3. Implemented Features vs. Demo Simulation Transparency

| Feature | Implementation Status | Notes |
| :--- | :--- | :--- |
| **User Authentication** | **Production Real** | Secure bcrypt hashing, JWT tokens, protected routes, profile & medical notes persistence. |
| **Emergency SOS Activation** | **Production Real** | Press-and-hold trigger (2-second hold to avoid accidental activation), GPS capture with accuracy meter. |
| **Emergency Call 112** | **Production Real** | Accessible phone link `tel:112` with structured dispatcher readout card & clipboard copy. |
| **Safety Radar Map** | **Production Real** | Leaflet OSM map, category & severity filters, real-time Socket.IO broadcasts. |
| **Transparent Hazard Verification** | **Production Real** | Spatial proximity matching (Haversine formula within 800m), time window (2h), and peer corroboration counters. |
| **Family Messaging** | **Production Real** | Real-time Socket.IO channels with offline queue fallback and duplicate submission prevention (idempotency keys). |
| **SMS / Carrier Notification** | **Simulated Demo** | Labeled `[DEMO SIMULATED]` because production Twilio/carrier credentials are not embedded in open repos. |
| **Official 112 Authority Confirmation** | **Honest User Action** | Marked as `call_action_initiated_by_user`. No false claim of government API link. |
| **Device-to-Device Radio Mesh** | **Documented Limitation** | Browser sandboxes cannot access native BLE/radio hardware without native daemons. |

---

## 4. Getting Started Locally

### Prerequisites
- Node.js (v18 or higher; v24 recommended)
- MongoDB running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd signal-bridge
   ```

2. **Install all dependencies**:
   ```bash
   npm --prefix server install
   npm --prefix client install
   ```

3. **Configure Environment Variables**:
   In `server/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/signal_bridge
   JWT_SECRET=super_secret_jwt_key_signal_bridge_production_2026
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   DEMO_MODE=true
   ```

4. **Seed Realistic Demo Data**:
   ```bash
   npm run seed
   ```
   *Seeds Bangalore tech corridor demo hazards, contacts, family conversations, and demo account:*
   - **Email**: `demo@signalbridge.org`
   - **Password**: `demo12345`

5. **Run the Application**:
   - **Option A (Unified Server)**:
     ```bash
     npm run build:client
     npm run dev:server
     ```
     Open `http://localhost:5000` in your browser.

   - **Option B (Separate Hot-Reload Servers)**:
     ```bash
     npm run dev:server   # In terminal 1 (starts Express on port 5000)
     npm run dev:client   # In terminal 2 (starts Vite on port 5173 with proxy)
     ```

---

## 5. Automated Testing

Run the test suite:
```bash
npm --prefix server test
```
**Results: 17/17 tests passing:**
- `GET /api/health` — 200 OK & service status
- `POST /api/auth/register` — user creation, password hash & token
- `POST /api/auth/login` — credentials verification & rejection of bad passwords
- `GET /api/auth/me` — protected route verification
- `POST /api/contacts` — trusted contact management & authorization
- `POST /api/contacts/checkin` — family check-in synchronization
- `POST /api/sos` — persistent SOS incident generation with location
- `POST /api/sos/call-112` — user call logging
- `POST /api/hazards` & `GET /api/hazards` — hazard reporting & spatial clustering
- `POST /api/hazards/:id/corroborate` — transparent corroboration engine
- `POST /api/messages/conversations/:id/messages` — messaging & idempotency retry deduplication
- `GET /api/dashboard/stats` — aggregated dashboard statistics

---

## 6. Live Deployment Guide

### Deployment Option 1: Render (Unified Full-Stack)
A `render.yaml` blueprint is included in the project root:
1. Connect this repository to your [Render.com](https://render.com) account.
2. Create a new **Blueprint** service selecting `render.yaml`.
3. Set the environment variable `MONGODB_URI` to your MongoDB Atlas connection string.
4. Render builds the React client and launches the persistent Express + Socket.IO server.

### Deployment Option 2: Split (Vercel Frontend + Render Backend)
- **Backend on Render**:
  - Root directory: `server`
  - Build command: `npm install`
  - Start command: `node src/server.js`
- **Frontend on Vercel**:
  - Root directory: `client`
  - Framework: Vite
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment variable: `VITE_API_BASE_URL=https://your-render-backend.onrender.com`

### Deployment Option 3: Docker
```bash
docker build -t signal-bridge .
docker run -p 5000:5000 -e MONGODB_URI="mongodb://your-mongo-uri" signal-bridge
```

---

## 7. Demo Mode Guide for Hackathon Judges

1. Open the application at `http://localhost:5000` (or the deployed live URL).
2. Click **"1-Click Demo Login (Rohan Verma)"** on the landing page or login screen.
3. Observe the **Safety Center Dashboard**:
   - Live hazards count (6 active community hazards).
   - Emergency SOS status.
   - One-tap check-in buttons ("I'm Safe", "Need Help").
4. Navigate to **Emergency SOS**:
   - Test the press-and-hold activation ring (release before 2s cancels).
   - Check the **Call 112** dispatcher readout modal.
5. Navigate to **Safety Radar Map**:
   - Inspect the interactive Leaflet map with color-coded severity pins.
   - Click "Corroborate" on any hazard to watch the verification engine upgrade report confidence.
6. Navigate to **Report Hazard**:
   - Tap on the map to place an exact pin; test duplicate detection.
7. Navigate to **Family Circle Chat**:
   - Send real-time messages and observe the instant delivery indicators.

---

## 8. Security & Privacy Notes

- Passwords are encrypted using bcrypt with salt rounds = 10.
- JWT tokens with configurable expiration protect all private endpoints.
- Ownership checks are enforced on all private resources (contacts, incidents, messages).
- Reporter personal contact information (email, phone) is stripped from public safety map responses.
- Location sharing is strictly opt-in, time-limited, and revocable.
- Rate limiters protect authentication and hazard reporting endpoints against spam and brute force attacks.

---

## 9. Future Work: Hardware Mesh Integration

While Signal Bridge provides offline-aware queuing and browser local storage resilience, genuine device-to-device radio mesh networking in cellular blackouts requires native OS background services (Android Nearby Connections API / Wi-Fi Direct / LoRaWAN gateways). Future versions of Signal Bridge will pair this web platform with a native Android background daemon for hardware packet relays.
