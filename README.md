# 🚗 RideSaathi – Smart Ride Sharing Platform

RideSaathi is a full-stack MERN ride-sharing web app connecting drivers and passengers with role-based auth, live tracking, and demand insights.

---

## ✨ Key Features (now)
- JWT auth + OTP (email/phone) sign-in
- Role-based flows: Driver / Passenger
- Live driver GPS sharing via WebSockets (Socket.IO)
- Passenger live-location sharing (opt-in) and driver view of passengers (name, phone, last location)
- Real-time ride lifecycle: OPEN | FULL | CANCELLED
- Heatmap demand analytics (aggregated search/join events) for drivers
- TTL cleanup for stale passenger locations
- Polished UI: glassmorphism, responsive components, accessible focus states
- Optimistic UI for join/leave and toast notifications
- REST fallbacks for live endpoints

---

## 🛠️ Tech Stack
- Frontend: React + Vite, Tailwind-friendly CSS, Leaflet (maps), Socket.IO client
- Backend: Node.js, Express, MongoDB (Mongoose), Socket.IO, Nodemailer (email OTP), Twilio (optional SMS)

---

## 🔧 Install & Run (local)

Backend
1. cd backend
2. npm install
3. Install extra packages (if not present):
   - socket.io, nodemailer (email), twilio (optional SMS), node-fetch (optional)
   - Example:
     npm install socket.io nodemailer twilio node-fetch
4. Create `.env` with:
   - MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, PORT
   - Optional: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
   - Optional: TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
5. Run:
   npm run dev

Frontend
1. cd frontend
2. npm install
3. Add map & socket libs:
   npm install leaflet leaflet.heat socket.io-client
   - If peer dependency conflicts arise (React version), install with:
     npm install leaflet leaflet.heat socket.io-client --legacy-peer-deps
4. Configure `.env`:
   - VITE_API_BASE_URL=http://localhost:5000/api
5. Run:
   npm run dev

---

## ⚙️ API Overview (high level)
- Auth: /api/auth/register, /api/auth/login, /api/auth/request-otp, /api/auth/verify-otp, /api/auth/me
- Rides: /api/rides (create), /api/rides/search, /api/rides/:id/join, /api/rides/:id/leave, /api/rides/:id/cancel
- Live & location: /api/rides/:id/location (driver REST), /api/rides/:id/live (REST), Socket.IO events: driver:location, passenger:location, ride:location, ride:passenger_location
- Analytics: /api/analytics/demand (heat points)
- Driver-only: /api/rides/:id/passengers

