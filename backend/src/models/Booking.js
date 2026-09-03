const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    captainProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CaptainProfile"
    },
    pickup: {
      address: { type: String, required: true },
      lat: { type: Number, default: 20.2961 },
      lng: { type: Number, default: 85.8245 }
    },
    drop: {
      address: { type: String, required: true },
      lat: { type: Number, default: 20.3541 },
      lng: { type: Number, default: 85.8195 }
    },
    scheduledDate: {
      type: String,
      default: () => new Date().toISOString().split("T")[0]
    },
    scheduledTime: {
      type: String,
      default: () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    },
    vehicleType: {
      type: String,
      enum: ["bike", "auto", "mini", "sedan", "suv", "luxury"],
      required: true
    },
    passengerCount: {
      type: Number,
      default: 1
    },
    specialInstructions: {
      type: String,
      default: ""
    },
    distanceKm: {
      type: Number,
      required: true,
      default: 12.5
    },
    estimatedDurationMins: {
      type: Number,
      required: true,
      default: 32
    },
    fare: {
      base: Number,
      distanceRate: Number,
      taxes: Number,
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true }
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "corporate_wallet", "card"],
      default: "corporate_wallet"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending"
    },
    otp: {
      type: String,
      default: () => Math.floor(1000 + Math.random() * 9000).toString()
    },
    status: {
      type: String,
      enum: [
        "pending_acceptance",
        "booking_confirmed",
        "captain_assigned",
        "captain_arriving",
        "trip_started",
        "trip_completed",
        "cancelled"
      ],
      default: "pending_acceptance"
    },
    cancelledBy: {
      type: String,
      enum: ["rider", "captain", "admin", null],
      default: null
    },
    cancellationReason: String,
    startTime: Date,
    completedTime: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
