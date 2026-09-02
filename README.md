# 🚖 FleetCorp — Enterprise & Public Cab Booking Portal

A production-ready fullstack cab booking and fleet dispatching platform built with **React (Vite) + Tailwind CSS + Framer Motion + Leaflet Maps** on the frontend, and **Node.js + Express + MongoDB + JWT** on the backend.

---

## 🌟 Key Features & Role Breakdown

### 1. 🚗 Rider Portal (Passenger / Employee)
- **Smart Booking Engine**: Pickup & Drop location picker with popular landmark chips, scheduled time, passenger count, special corporate instructions, and dynamic distance/duration calculation.
- **Dynamic Fare Matrix**: Real-time pricing across **Auto**, **Mini (Hatchback)**, **Sedan Prime**, **SUV Spacious**, and **Corporate Luxury**.
- **Live GPS Tracking**: Interactive Leaflet map with simulated Captain movement along route polylines, 5-stage trip lifecycle, and secure 4-digit OTP verification.
- **Invoicing & Reviews**: One-click printable and downloadable **PDF Tax Invoice** with itemized base, distance, and GST breakdown, plus 5-star multi-criteria driver reviews.

### 2. 👨‍✈️ Captain Portal (Driver)
- **Online / Offline Toggle**: Instant availability switch with live status indicator.
- **Ride Dispatch Popups**: Incoming ride requests with fare preview, route points, and accept/pass actions.
- **Turn-by-Turn Trip Execution**: Enter passenger OTP to start trip, navigate to destination, and collect fare.
- **Captain Analytics**: Daily earnings ledger, completed rides counter, acceptance rate, and captain rating score.

### 3. 🏢 Admin Portal (Super Admin & Fleet Command)
- **Executive Analytics**: Gross booking volume, platform commission (15%), active captains online, and registered corporate riders.
- **Interactive Visualizations**: Recharts monthly revenue area charts and vehicle category demand donut charts.
- **Fleet & Captain Control**: Driver roster with license verification status and vehicle registration mapping.
- **Master Bookings Dispatch**: Filterable and searchable table across all live, completed, and cancelled bookings.

---

## 📂 Project Directory Structure (A to Z)

```
cab-booking-portal/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection & fallback
│   │   ├── controllers/
│   │   │   ├── authController.js     # Rider, Captain, Admin Auth + Profile
│   │   │   ├── bookingController.js  # Booking creation, fare calculation, status
│   │   │   ├── captainController.js  # Online toggle, active trips, earnings
│   │   │   ├── adminController.js    # System KPIs, fleet analytics
│   │   │   └── reviewController.js   # Rating & feedback submissions
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # JWT verification
│   │   │   ├── roleMiddleware.js     # Permission gates
│   │   │   └── errorMiddleware.js    # Global error handling
│   │   ├── models/
│   │   │   ├── User.js               # Common User schema (Rider, Captain, Admin)
│   │   │   ├── Booking.js            # Trip model with OTP, coordinates, fare
│   │   │   ├── CaptainProfile.js     # Vehicle info, license, status, earnings
│   │   │   └── Review.js             # Ratings & comments
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── bookingRoutes.js
│   │   │   ├── captainRoutes.js
│   │   │   ├── adminRoutes.js
│   │   │   └── reviewRoutes.js
│   │   ├── utils/
│   │   │   ├── fareCalculator.js     # Dynamic pricing logic
│   │   │   └── seedData.js           # Demo accounts seeder
│   │   └── server.js                 # Express server & API endpoints
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   └── render.yaml                   # Render.com deployment Blueprint
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx        # Responsive navigation with Dark/Light toggle
│   │   │   │   ├── Sidebar.jsx       # Adaptive Sidebar for Rider, Captain, and Admin
│   │   │   │   ├── Footer.jsx        # Corporate branding & quick links
│   │   │   │   ├── ProtectedRoute.jsx# Auth & Role guard
│   │   │   │   ├── ThemeToggle.jsx   # Dark / Light theme switcher
│   │   │   │   └── Notifications.jsx # In-app notification center
│   │   │   ├── landing/
│   │   │   │   ├── HeroSection.jsx   # Modern hero with live route visualizer
│   │   │   │   ├── ServicesSection.jsx # Rider, Captain & Corporate highlights
│   │   │   │   ├── HowItWorks.jsx    # 3-step animated flow
│   │   │   │   ├── FleetShowcase.jsx # Auto, Sedan, SUV, Luxury specs
│   │   │   │   └── Testimonials.jsx  # Passenger reviews
│   │   │   ├── booking/
│   │   │   │   ├── BookingForm.jsx   # Pickup/drop selectors, schedule, passengers
│   │   │   │   ├── CabCards.jsx      # Dynamic fare display & vehicle selection
│   │   │   │   ├── LiveMap.jsx       # Leaflet interactive map with driver tracking
│   │   │   │   ├── InvoiceModal.jsx  # Printable/Downloadable PDF invoice
│   │   │   │   └── RatingModal.jsx   # 5-star review modal
│   │   │   └── dashboard/
│   │   │       ├── StatCard.jsx      # Animated metrics card
│   │   │       ├── AnalyticsCharts.jsx # Recharts charts for Admin
│   │   │       └── BookingsTable.jsx # Interactive rides table
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Authentication & 1-click demo role switcher
│   │   │   └── ThemeContext.jsx      # Dark / Light theme state
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx       # Public landing page
│   │   │   ├── LoginPage.jsx         # Login with quick 1-click Demo credentials
│   │   │   ├── RegisterPage.jsx      # Register as Rider or Captain
│   │   │   ├── rider/
│   │   │   │   ├── RiderDashboard.jsx# Rider home (Quick book, active ride, stats)
│   │   │   │   ├── BookRidePage.jsx  # Full-screen booking experience
│   │   │   │   ├── MyRidesPage.jsx   # Ride history & PDF invoice download
│   │   │   │   └── TrackRidePage.jsx # Live tracking page
│   │   │   ├── captain/
│   │   │   │   ├── CaptainDashboard.jsx # Online toggle, new requests, earnings, active trip
│   │   │   │   └── CaptainTripsPage.jsx # Trip history & payouts
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx   # Main overview & financial stats
│   │   │       ├── ManageCaptains.jsx   # Captain verification & fleet status
│   │   │       ├── ManageRiders.jsx     # Rider directory
│   │   │       └── ManageBookings.jsx   # All bookings & live dispatch
│   │   ├── services/
│   │   │   └── api.js                # Axios client with JWT interceptor
│   │   ├── App.jsx                   # Router setup
│   │   ├── main.jsx                  # Entry point
│   │   └── index.css                 # Tailwind CSS styles & animations
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── vercel.json                   # Vercel SPA rewrite config
│   └── package.json
└── README.md
```

---

## ⚡ Quick Start / Local Installation

### 1. Start the Backend API
```bash
cd backend
npm install
npm run dev
```
> Backend runs at `http://localhost:5000`

*(Optional: Run `npm run seed` to seed MongoDB with sample rides and profiles)*

### 2. Start the Frontend App
```bash
cd frontend
npm install
npm run dev
```
> Frontend runs at `http://localhost:5173`

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Access / Features |
| :--- | :--- | :--- | :--- |
| **🚗 Rider** | `rider@cab.com` | `password123` | Book Rides, Live GPS Tracker, Ride History, Download PDF Invoices, Star Ratings |
| **👨‍✈️ Captain** | `captain@cab.com` | `password123` | Online/Offline Switch, Accept Ride Requests, Verify Rider OTP, Trip Navigation, Daily Earnings |
| **🏢 Admin** | `admin@cab.com` | `password123` | Executive KPI Cards, Recharts Revenue Analytics, Manage Captains, Rider Directory, Master Bookings |

*(You can also use the **1-Click Demo Buttons** on the Login page and Sidebar for instant role switching without typing credentials)*

---

## ☁️ Deployment Guide

### 🚀 Deploying Backend to Render.com
1. Create a free account on [Render.com](https://render.com).
2. Push your project to GitHub.
3. On Render, click **New +** ➔ **Web Service**.
4. Connect your GitHub repository and set the **Root Directory** to `backend`.
5. Set the build settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Under **Environment Variables**, add:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: *(A random 32-character secret)*
   - `JWT_EXPIRE`: `7d`
   - `MONGODB_URI`: *(Your MongoDB Atlas connection string e.g. `mongodb+srv://...`)*
   - `CLIENT_URL`: *(Your Vercel frontend URL e.g. `https://fleetcorp.vercel.app`)*
7. Click **Create Web Service**. Your backend API URL will be ready (e.g., `https://cab-backend.onrender.com`).

---

### 🌐 Deploying Frontend to Vercel.com
1. Create a free account on [Vercel.com](https://vercel.com).
2. Click **Add New...** ➔ **Project**.
3. Import your GitHub repository.
4. Set **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://your-render-backend.onrender.com/api`
6. Click **Deploy**.
   - Vercel will automatically read `vercel.json` and build the project with zero routing issues.
