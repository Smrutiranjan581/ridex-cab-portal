const express = require("express");
const router = express.Router();
const {
  estimateFare,
  createBooking,
  getMyRides,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getPendingDispatches,
  acceptBooking
} = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

router.post("/estimate", estimateFare);
router.post("/create", protect, createBooking);
router.get("/pending-dispatch", protect, getPendingDispatches);
router.put("/:id/accept", protect, acceptBooking);
router.get("/my-rides", protect, getMyRides);
router.get("/:id", protect, getBookingById);
router.patch("/:id/status", protect, updateBookingStatus);
router.patch("/:id/cancel", protect, cancelBooking);

module.exports = router;
