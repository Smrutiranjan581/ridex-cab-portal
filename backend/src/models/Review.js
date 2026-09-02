const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
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
      ref: "User",
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    cleanlinessRating: {
      type: Number,
      default: 5
    },
    punctualityRating: {
      type: Number,
      default: 5
    },
    comment: {
      type: String,
      default: "Great smooth ride!"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
