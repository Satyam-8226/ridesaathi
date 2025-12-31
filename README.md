# 🚗 RideSaathi

RideSaathi is a full-stack MERN ride-sharing web application that connects drivers and passengers for shared rides.  
It supports role-based access, real-time seat management, and clean user experience.


## ✨ Features

### 👤 Authentication & Roles
- JWT-based authentication
- Role-based access (Driver / Passenger)
- Protected routes and persistent login

### 🚘 Driver Features
- Create rides
- View and manage own rides
- Cancel rides (automatically removes passengers)

### 🧍 Passenger Features
- Search rides by route
- Join and leave rides
- Automatically notified when a driver cancels a ride

### 🧠 Smart UX
- Real-time seat updates
- Toast notifications
- Clean UI with Tailwind CSS
- No flicker or broken states


## 🧰 Tech Stack

**Frontend**
- React (Vite)
- Tailwind CSS
- Axios
- React Context API

**Backend**
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose

**Authentication**
- JWT (JSON Web Tokens)

---

## 🟢 STEP 6: Add How to Run Locally (MANDATORY)


## ▶️ Run Locally

### 1️⃣ Clone the repository
```bash
git clone https://github.com/Satyam-8226/ridesaathi.git
cd ridesaathi

2️⃣ Backend Setup
    cd backend
    npm install

    Create .env file:
        PORT=5000
        MONGO_URI=your_mongodb_uri
        JWT_SECRET=your_secret

    Start backend: npm run dev

3️⃣ Frontend Setup
    cd frontend
    npm install
    npm run dev
```

## 🚀 Future Improvements
- Ride history (Completed / Cancelled)
- Real-time notifications
- Mobile-first UI
- Payment integration

## 👨‍💻 Author

**Satyam Pandey**  
B.Tech Student, MNNIT Allahabad  
Full-Stack Web Developer (MERN)
