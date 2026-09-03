const mongoose = require('mongoose');

const payoutRequestSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true
    },
    captain: {
      type: mongoose.Schema.Types.Mixed
    },
    captainName: {
      type: String,
      required: true
    },
    captainEmail: {
      type: String,
      default: ''
    },
    captainPhone: {
      type: String,
      default: ''
    },
    amount: {
      type: Number,
      required: true
    },
    payoutMethod: {
      type: String,
      enum: ['bank', 'upi'],
      default: 'bank'
    },
    destination: {
      type: String,
      required: true
    },
    bankDetails: {
      holderName: String,
      accountNumber: String,
      ifsc: String,
      bankName: String,
      upiId: String
    },
    status: {
      type: String,
      enum: ['pending_admin_approval', 'approved_transferred', 'rejected'],
      default: 'pending_admin_approval'
    },
    utrNumber: {
      type: String,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);
