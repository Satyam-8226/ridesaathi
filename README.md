# 🚗 RideSaathi – Smart Ride Sharing Platform

RideSaathi is a full-stack MERN ride-sharing web app connecting drivers and passengers with role-based auth, live tracking, and demand insights.

---

## ✨ Key Features
- **JWT + OTP Authentication** - Email/phone sign-in with OTP verification
- **Role-Based Access** - Separate flows for Drivers and Passengers
- **Live Tracking** - Real-time GPS sharing via WebSockets (Socket.IO)
- **Passenger Location Sharing** - Optional live location with driver visibility
- **Ride Lifecycle Management** - OPEN → FULL → IN_PROGRESS → COMPLETED/CANCELLED
- **Demand Analytics** - Heatmap visualization of ride demand for drivers
- **Responsive UI** - Glassmorphism design with Tailwind CSS
- **Real-Time Updates** - LiveSocket.IO for instant notifications

---

## 🛠️ Tech Stack
- **Frontend**: React 18 + Vite, Tailwind CSS, Leaflet Maps, Socket.IO Client
- **Backend**: Node.js + Express, MongoDB Atlas, Socket.IO Server
- **Authentication**: JWT + bcryptjs
- **Email**: Nodemailer (OTP delivery)
- **SMS**: Twilio (optional)

---

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
npm install
cp .env.production.template .env
# Edit backend/.env with your credentials
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.production.template .env
# Edit frontend/.env with your API URL and production settings
npm run dev
```

### Required Environment Variables
See `.env.production.template` files in both directories.

**Critical:**
- `MONGO_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `FRONTEND_URL` - Your frontend domain (for CORS)

---

## 📦 Deployment

This repository is designed for local or self-hosted deployment. Use the provided environment templates to create `.env` files before running the app.

### Backend Production Build
```bash
cd backend
npm install
cp .env.production.template .env
# Edit backend/.env with your production values
npm run start
```

### Frontend Production Build
```bash
cd frontend
npm install
cp .env.production.template .env
# Edit frontend/.env with your production values
npm run build
```

### Notes
- `FRONTEND_URL` in backend/.env should match the frontend host.
- `VITE_API_BASE_URL` in frontend/.env should point to the backend API.
- Keep secrets out of frontend env files.

---

## 📋 API Overview

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `POST /api/auth/request-otp` - Request OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `GET /api/auth/me` - Get current user

### Rides
- `POST /api/rides` - Create ride
- `GET /api/rides/search` - Search rides
- `POST /api/rides/:id/join` - Join ride
- `POST /api/rides/:id/leave` - Leave ride
- `POST /api/rides/:id/cancel` - Cancel ride

### Live Updates (Socket.IO)
- `driver:location` - Driver sends location
- `passenger:location` - Passenger sends location
- `ride:location` - Broadcast driver location
- `ride:passenger_location` - Broadcast passenger location

### Analytics
- `GET /api/analytics/demand` - Get demand heatmap data

---

## 🔒 Security Features

✅ **Implemented:**
- Helmet security headers
- CORS with origin validation
- JWT authentication with expiration
- Password hashing with bcryptjs
- Environment variable protection
- Error handling without exposing internals
- Structured logging (no sensitive data)
- Socket.IO authentication
- Request validation

📋 **Recommended for Production:**
- Rate limiting on API endpoints
- Input sanitization with Joi/Zod
- Request signing for critical operations
- IP whitelisting for admin endpoints
- Database encryption at rest
- Regular security audits

---

## 📊 Database Schema

### Users
```
{
  name, email, phone, password,
  role: "driver" | "passenger",
  location, preferences, createdAt
}
```

### Rides
```
{
  driver, passengers: [userId],
  source, sourceLocation,
  destination, destinationLocation,
  status: "OPEN" | "FULL" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
  driverLocation, routePath,
  createdAt, updatedAt
}
```

---

## 🧪 Testing

```bash
# Lint code
npm run lint

# View frontend
npm run preview
```

---

## 📈 Performance Tips

- **Frontend**: Code splitting, lazy loading, optimized images
- **Backend**: Connection pooling, indexed queries, caching
- **Database**: Read replicas for analytics, TTL indexes for cleanup
- **Socket.IO**: Redis adapter for clustering (future)

---

## 🐛 Troubleshooting

### WebSocket Connection Issues
- Check FRONTEND_URL environment variable
- Verify CORS origins in app.js
- Check browser DevTools → Network tab

### MongoDB Connection Fails
- Verify MONGO_URI format
- Check network access in MongoDB Atlas
- Confirm the backend host is reachable from the browser

### Build Errors
- Run `npm install` locally
- Check all environment variables are set
- Verify frontend API URL and backend CORS settings

---

## 📚 Project Structure

```
RideSaathi/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   └── styles/
│   └── package.json
└── build.sh
```

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test locally
4. Submit a pull request

---

## 📝 License

ISC License - See LICENSE file

---

## 👤 Author

**Satyam** - Full-stack developer

---

## 🚦 Status

- ✅ Core features implemented
- ✅ Production-ready deployment configuration
- ✅ Security & error handling
- ⏳ Advanced features (coming soon)

**Ready to deploy!** Follow the local deployment instructions above.

