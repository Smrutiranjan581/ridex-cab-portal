const Review = require("../models/Review");
const Booking = require("../models/Booking");
const CaptainProfile = require("../models/CaptainProfile");
const mongoose = require("mongoose");

const findBookingFlexible = async (id) => {
  if (!id) return null;
  try {
    if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id)) {
      const b = await Booking.findById(id);
      if (b) return b;
    }
  } catch (e) {}
  try {
    const byBookingId = await Booking.findOne({ bookingId: id });
    if (byBookingId) return byBookingId;
  } catch (e) {}
  try {
    return await Booking.findOne({ _id: id });
  } catch (e) {}
  return null;
};

exports.submitReview = async (req, res) => {
  try {
    const { bookingId, rating, cleanlinessRating, punctualityRating, tags = [], tipAmount = 0, comment } = req.body;
    const numericTip = Number(tipAmount) || 0;
    const numericRating = Number(rating) || 5;

    let reviewData = {
      booking: bookingId,
      rider: req.user?._id || "rider_1",
      rating: numericRating,
      cleanlinessRating: Number(cleanlinessRating) || 5,
      punctualityRating: Number(punctualityRating) || 5,
      tags: tags,
      tipAmount: numericTip,
      comment: comment || "Great journey!"
    };

    try {
      await Review.create(reviewData);
    } catch (e) {}

    // Find and update the live Booking in MongoDB Atlas with Tip & Rating
    let booking = await findBookingFlexible(bookingId);
    if (booking) {
      booking.rating = numericRating;
      booking.tip = numericTip;
      booking.feedbackTags = tags;
      booking.feedbackComment = comment || "";

      if (numericTip > 0 && booking.fare) {
        booking.fare.total = (booking.fare.total || 0) + numericTip;
      }
      await booking.save();
    }

    res.status(201).json({
      success: true,
      message: "Thank you for your rating and tip!",
      review: reviewData,
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
