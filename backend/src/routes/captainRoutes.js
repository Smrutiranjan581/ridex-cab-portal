const express = require("express");
const router = express.Router();
const { toggleStatus, getCaptainDashboard, respondToRide, getCaptainLedger } = require("../controllers/captainController");
const { protectOptional } = require("../middleware/authMiddleware");

router.post("/toggle-status", protectOptional, toggleStatus);
router.get("/dashboard", protectOptional, getCaptainDashboard);
router.post("/respond", protectOptional, respondToRide);
router.get("/ledger", protectOptional, getCaptainLedger);

module.exports = router;
