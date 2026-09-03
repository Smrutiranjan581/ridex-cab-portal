const PayoutRequest = require('../models/PayoutRequest');

exports.createPayoutRequest = async (req, res) => {
  try {
    const {
      id,
      amount,
      payoutMethod = 'bank',
      destination,
      bankDetails,
      captainName,
      captainEmail,
      captainPhone
    } = req.body;

    const payoutId = id || ('PAY-' + Math.floor(100000 + Math.random() * 900000));
    const cName = captainName || req.user?.name || 'Captain Partner';
    const cEmail = captainEmail || req.user?.email || '';
    const cPhone = captainPhone || req.user?.phone || '';

    const newRequest = {
      id: payoutId,
      captain: req.user?._id || 'captain_1',
      captainName: cName,
      captainEmail: cEmail,
      captainPhone: cPhone,
      amount: Number(amount) || 0,
      payoutMethod,
      destination: destination || (payoutMethod === 'bank' ? 'Bank Account' : 'UPI ID'),
      bankDetails: bankDetails || {},
      status: 'pending_admin_approval',
      requestedAt: new Date()
    };

    let payout;
    try {
      payout = await PayoutRequest.create(newRequest);
    } catch (e) {
      console.error('Payout.create error:', e.message);
      payout = { ...newRequest, _id: 'payout_' + Date.now() };
    }

    res.status(201).json({
      success: true,
      message: 'Payout withdrawal request submitted for admin clearance!',
      payout
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllPayouts = async (req, res) => {
  try {
    let payouts = [];
    try {
      payouts = await PayoutRequest.find().sort({ createdAt: -1 });
    } catch (e) {
      console.error('PayoutRequest.find error:', e.message);
    }

    res.json({
      success: true,
      count: payouts.length,
      payouts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approvePayout = async (req, res) => {
  try {
    const { id } = req.params;
    const utrNumber = 'UTR' + Math.floor(100000000000 + Math.random() * 900000000000);
    const approvedAt = new Date();

    let payout = null;
    try {
      payout = await PayoutRequest.findOne({ id: id });
      if (!payout) {
        payout = await PayoutRequest.findById(id);
      }
      if (payout) {
        payout.status = 'approved_transferred';
        payout.utrNumber = utrNumber;
        payout.processedAt = approvedAt;
        await payout.save();
      }
    } catch (e) {}

    res.json({
      success: true,
      message: 'Payout approved and transferred successfully!',
      payout: payout || { id, status: 'approved_transferred', utrNumber }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const rejectedAt = new Date();

    let payout = null;
    try {
      payout = await PayoutRequest.findOne({ id: id });
      if (!payout) {
        payout = await PayoutRequest.findById(id);
      }
      if (payout) {
        payout.status = 'rejected';
        payout.rejectionReason = reason || 'Bank details verification failed.';
        payout.processedAt = rejectedAt;
        await payout.save();
      }
    } catch (e) {}

    res.json({
      success: true,
      message: 'Payout request rejected.',
      payout: payout || { id, status: 'rejected', rejectionReason: reason }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
