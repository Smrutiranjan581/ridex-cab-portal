const express = require("express");
const router = express.Router();
const {
  getAdminDashboard,
  getAllCaptains,
  getAllRiders,
  getAllBookings,
  approveCaptain,
  rejectCaptain
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(authorize("admin"));

router.get("/dashboard", getAdminDashboard);
router.get("/captains", getAllCaptains);
router.put("/captains/:id/approve", approveCaptain);
router.put("/captains/:id/reject", rejectCaptain);
router.get("/riders", getAllRiders);
router.get("/bookings", getAllBookings);

module.exports = router;
