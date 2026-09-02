const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const CaptainProfile = require("../models/CaptainProfile");
const Booking = require("../models/Booking");
const Review = require("../models/Review");

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cab_booking_db");
    console.log("Seeding database...");

    await User.deleteMany();
    await CaptainProfile.deleteMany();
    await Booking.deleteMany();
    await Review.deleteMany();

    const admin = await User.create({
      name: "Corporate Admin",
      email: "admin@cab.com",
      phone: "+91 9876543210",
      password: "password123",
      role: "admin",
      company: "FleetCorp Global"
    });

    const rider1 = await User.create({
      name: "Rahul Sharma",
      email: "rider@cab.com",
      phone: "+91 9123456780",
      password: "password123",
      role: "rider",
      company: "TCS Innovation Hub",
      walletBalance: 2450
    });

    const captainUser1 = await User.create({
      name: "Rajesh Mohapatra",
      email: "captain@cab.com",
      phone: "+91 9437012345",
      password: "password123",
      role: "captain",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
    });

    const captainProfile1 = await CaptainProfile.create({
      user: captainUser1._id,
      vehicle: {
        category: "sedan",
        model: "Maruti Swift Dzire",
        numberPlate: "OD-02-BA-9876",
        color: "Pearl White",
        capacity: 4
      },
      licenseNumber: "OD0220190045678",
      status: "available",
      currentLocation: { name: "Infocity Square", lat: 20.3541, lng: 85.8195 },
      rating: 4.92,
      totalTrips: 348,
      todayEarnings: 2150,
      totalEarnings: 84200
    });

    const booking1 = await Booking.create({
      bookingId: "FLT-9042",
      rider: rider1._id,
      captain: captainUser1._id,
      captainProfile: captainProfile1._id,
      pickup: { address: "Infocity IT Hub, Silicon Hills", lat: 20.3541, lng: 85.8195 },
      drop: { address: "Biju Patnaik International Airport (BBI)", lat: 20.2444, lng: 85.8178 },
      scheduledDate: new Date().toISOString().split("T")[0],
      scheduledTime: "09:30 AM",
      vehicleType: "sedan",
      passengerCount: 2,
      distanceKm: 16.4,
      estimatedDurationMins: 38,
      fare: {
        base: 90,
        distanceRate: 295,
        taxes: 25,
        discount: 0,
        total: 410
      },
      paymentMethod: "corporate_wallet",
      paymentStatus: "paid",
      otp: "5821",
      status: "trip_completed"
    });

    await Review.create({
      booking: booking1._id,
      rider: rider1._id,
      captain: captainUser1._id,
      rating: 5,
      cleanlinessRating: 5,
      punctualityRating: 5,
      comment: "Very polite captain, clean vehicle and arrived right on time!"
    });

    console.log("✅ Database seeded with Demo accounts!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err.message);
    process.exit(1);
  }
};

seed();
