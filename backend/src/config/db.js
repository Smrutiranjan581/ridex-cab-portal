const mongoose = require("mongoose");

const ATLAS_URI = "mongodb+srv://nayaksmrutiranjan105_db_user:ZY5s5SFNbAzLjjsz@cluster0.lua9fru.mongodb.net/cab_booking_db?retryWrites=true&w=majority&appName=Cluster0";

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || ATLAS_URI;
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ First connection attempt failed: ${error.message}, connecting to Atlas fallback...`);
    try {
      const conn2 = await mongoose.connect(ATLAS_URI);
      console.log(`✅ MongoDB Connected via Atlas: ${conn2.connection.host}`);
    } catch (e) {
      console.error(`❌ MongoDB connection error: ${e.message}`);
    }
  }
};

module.exports = connectDB;
