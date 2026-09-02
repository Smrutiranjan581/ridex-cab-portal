const express = require("express");
const router = express.Router();
const {
  getAdminDashboard,
  getAllCaptains,
  getAllRiders,
  getAllBookings
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(authorize("admin"));

router.get("/dashboard", getAdminDashboard);
router.get("/captains", getAllCaptains);
router.get("/riders", getAllRiders);
router.get("/bookings", getAllBookings);

module.exports = router;
