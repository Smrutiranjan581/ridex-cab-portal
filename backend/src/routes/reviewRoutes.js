const express = require("express");
const router = express.Router();
const { submitReview } = require("../controllers/reviewController");
const { protectOptional } = require("../middleware/authMiddleware");

router.post("/submit", protectOptional, submitReview);

module.exports = router;
