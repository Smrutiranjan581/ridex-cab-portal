const express = require("express");
const router = express.Router();
const { toggleStatus, getCaptainDashboard, respondToRide } = require("../controllers/captainController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(authorize("captain", "admin"));

router.post("/toggle-status", toggleStatus);
router.get("/dashboard", getCaptainDashboard);
router.post("/respond", respondToRide);

module.exports = router;
