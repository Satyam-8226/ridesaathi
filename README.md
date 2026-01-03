# 🚗 RideSaathi – Smart Ride Sharing Platform

RideSaathi is a **full-stack MERN ride-sharing web application** that connects **drivers and passengers** through a secure, role-based system. The platform focuses on clean architecture, robust authentication, consistent ride lifecycle management, and a polished user experience.

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- JWT-based authentication with tokens stored in `localStorage`
- Role-based access control (**Driver / Passenger**)
- Protected frontend routes
- Auth state hydration using `/api/auth/me` to restore sessions on refresh without UI flicker

---

### 🚘 Driver Features
- Create rides with source, destination, date, total seats, and price
- View all rides created by the driver
- Cancel rides without deleting data
- Ride status automatically updates to **CANCELLED**

---

### 🧍 Passenger Features
- Search rides by source and destination
- Join and leave rides dynamically
- View all joined rides
- Automatically restricted from joining **FULL** or **CANCELLED** rides
- Receives UI feedback when a joined ride is cancelled by the driver

---

### ⚙️ Core Ride Management
- Real-time seat availability synchronization
- Ride lifecycle states: **OPEN | FULL | CANCELLED**
- Automatic removal of passengers when a ride is cancelled
- Cancelled rides are preserved for consistency and auditability
- Normalized API responses to prevent frontend/backend mismatches

---

### 🎨 UI & UX Highlights
- Polished card-based layout for rides
- Role-aware UI actions and messaging
- Disabled actions for invalid ride states
- Toast notifications for user feedback
- Clear empty and loading states
- No UI flicker during authentication hydration

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- React Router
- Context API
- Axios (with interceptor)
- Tailwind CSS
- react-hot-toast

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication

---

## 📡 API Overview

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Rides
- `POST /api/rides` (Driver only)
- `GET /api/rides/search`
- `POST /api/rides/:id/join`
- `POST /api/rides/:id/leave`
- `POST /api/rides/:id/cancel`
- `GET /api/rides/my-rides/driver`
- `GET /api/rides/my-rides/passenger`

---

## 🚀 Local Setup

```bash
# Clone repository
git clone https://github.com/<your-username>/ridesaathi.git

# Backend setup
cd backend
npm install
npm run dev

# Frontend setup
cd frontend
npm install
npm run dev
