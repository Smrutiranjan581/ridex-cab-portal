const express = require("express");
const router = express.Router();
const { register, login, getMe, resetPassword, checkPhone, updateWalletBalance } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/check-phone", checkPhone);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);
router.post("/wallet", protect, updateWalletBalance);

module.exports = router;
