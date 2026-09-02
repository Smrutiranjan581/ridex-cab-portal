const Review = require("../models/Review");
const Booking = require("../models/Booking");
const CaptainProfile = require("../models/CaptainProfile");

exports.submitReview = async (req, res) => {
  try {
    const { bookingId, rating, cleanlinessRating, punctualityRating, comment } = req.body;

    let reviewData = {
      booking: bookingId,
      rider: req.user._id,
      rating: Number(rating) || 5,
      cleanlinessRating: Number(cleanlinessRating) || 5,
      punctualityRating: Number(punctualityRating) || 5,
      comment: comment || "Great journey!"
    };

    try {
      await Review.create(reviewData);
    } catch (e) {}

    res.status(201).json({ success: true, message: "Thank you for your rating!", review: reviewData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
