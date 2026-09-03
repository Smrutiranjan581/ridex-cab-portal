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
const { protectOptional } = require("../middleware/authMiddleware");

router.post("/estimate", estimateFare);
router.post("/create", protectOptional, createBooking);
router.get("/pending-dispatch", protectOptional, getPendingDispatches);
router.put("/:id/accept", protectOptional, acceptBooking);
router.get("/my-rides", protectOptional, getMyRides);
router.get("/:id", protectOptional, getBookingById);
router.patch("/:id/status", protectOptional, updateBookingStatus);
router.patch("/:id/cancel", protectOptional, cancelBooking);

module.exports = router;
