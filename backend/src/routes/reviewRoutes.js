const express = require("express");
const router = express.Router();
const { submitReview } = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

router.post("/submit", protect, submitReview);

module.exports = router;
