const express = require('express');
const router = express.Router();
const {
  createPayoutRequest,
  getAllPayouts,
  approvePayout,
  rejectPayout
} = require('../controllers/payoutController');
const { protectOptional } = require('../middleware/authMiddleware');

router.post('/request', protectOptional, createPayoutRequest);
router.get('/', protectOptional, getAllPayouts);
router.put('/:id/approve', protectOptional, approvePayout);
router.put('/:id/reject', protectOptional, rejectPayout);

module.exports = router;
