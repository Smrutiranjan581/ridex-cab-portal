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
      enum: ["available", "on_trip", "offline", "pending_approval", "rejected"],
      default: "pending_approval"
    },
    currentLocation: {
      name: { type: String, default: "Tech Park Hub" },
      lat: { type: Number, default: 20.2961 },
      lng: { type: Number, default: 85.8245 }
    },
    rating: {
      type: Number,
      default: 5.0
    },
    totalTrips: {
      type: Number,
      default: 0
    },
    todayEarnings: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    isApproved: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CaptainProfile", captainProfileSchema);
