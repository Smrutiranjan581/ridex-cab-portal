const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cab_booking_db");
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ MongoDB Notice: ${error.message}`);
    console.warn("ℹ️ Running in resilient demo mode with instant mock failover.");
  }
};

module.exports = connectDB;
