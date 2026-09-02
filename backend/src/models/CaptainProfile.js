const mongoose = require("mongoose");

const captainProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    vehicle: {
      category: {
        type: String,
        enum: ["bike", "auto", "mini", "sedan", "suv", "luxury"],
        default: "sedan"
      },
      model: {
        type: String,
        required: true,
        default: "Swift Dzire"
      },
      numberPlate: {
        type: String,
        required: true,
        default: "OD-02-AB-1234"
      },
      color: {
        type: String,
        default: "Silver"
      },
      capacity: {
        type: Number,
        default: 4
      }
    },
    licenseNumber: {
      type: String,
      required: true,
      default: "DL-IND-2024-987654"
    },
    status: {
      type: String,
      enum: ["available", "on_trip", "offline"],
      default: "available"
    },
    currentLocation: {
      name: { type: String, default: "Tech Park Hub" },
      lat: { type: Number, default: 20.2961 },
      lng: { type: Number, default: 85.8245 }
    },
    rating: {
      type: Number,
      default: 4.9
    },
    totalTrips: {
      type: Number,
      default: 142
    },
    todayEarnings: {
      type: Number,
      default: 1850
    },
    totalEarnings: {
      type: Number,
      default: 48500
    },
    isApproved: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CaptainProfile", captainProfileSchema);
