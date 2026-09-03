import React, { useState, useEffect } from 'react';
import { 
  X, DollarSign, CheckCircle2, TrendingUp, Calendar, MapPin, Navigation, 
  ArrowUpRight, ArrowDownLeft, FileText, Wallet, Building2, Sparkles, 
  Check, ArrowRight, ShieldCheck, RefreshCw, AlertCircle, Clock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function CaptainEarningsModal({ isOpen, onClose, onViewInvoice }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'credits' | 'debits' | 'trips'
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank'); // 'bank' | 'upi'
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState(null);
  const [guaranteedTransferModal, setGuaranteedTransferModal] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // State loaded from localStorage
  const [trips, setTrips] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Load and synchronize data from Cloud API and LocalStorage
  const loadLedgerData = async () => {
    try {
      let cloudTrips = [];
      try {
        const res = await api.get('/captain/ledger');
        if (res.data?.success && Array.isArray(res.data.trips)) {
          cloudTrips = res.data.trips;
        }
      } catch (e) {}

      const storedTripsRaw = JSON.parse(localStorage.getItem('ridex_captain_trip_history') || '[]');
      
      const mergedTrips = [...storedTripsRaw];
      cloudTrips.forEach(ct => {
        const cId = ct.bookingId || ct._id;
        const idx = mergedTrips.findIndex(t => (t.bookingId || t._id) === cId);
        if (idx >= 0) {
          mergedTrips[idx] = {
            ...mergedTrips[idx],
            ...ct,
            tip: ct.tip || mergedTrips[idx].tip || 0,
            fare: {
              ...mergedTrips[idx].fare,
              ...ct.fare,
              total: ct.fare?.total || mergedTrips[idx].fare?.total || 180,
              tip: ct.tip || mergedTrips[idx].fare?.tip || 0
            }
          };
        } else {
          mergedTrips.unshift(ct);
        }
      });
      localStorage.setItem('ridex_captain_trip_history', JSON.stringify(mergedTrips));

      const storedTrips = mergedTrips.filter(t => {
        if (!user) return false;
        const myEmail = user.email ? user.email.toLowerCase() : '';
        const myPhone = user.phone ? user.phone.replace(/[^0-9]/g, '').slice(-10) : '';

        const tEmail = (t.captainEmail || t.captain?.email || '').toLowerCase();
        const tPhone = (t.captainPhone || t.captain?.phone || '').replace(/[^0-9]/g, '').slice(-10);

        if (myEmail && tEmail && myEmail === tEmail) return true;
        if (myPhone && tPhone && myPhone === tPhone) return true;

        if (myEmail === 'captain@cab.com' && !tEmail && !tPhone) return true;
        return true;
      });

      let storedTxns = JSON.parse(localStorage.getItem('ridex_captain_transactions') || '[]');

      // Auto-backfill CREDIT transactions for any trips that don't have a transaction yet
      let updatedTxns = [...storedTxns];
      let hasNewCredits = false;

      storedTrips.forEach(trip => {
        const tripBookingId = trip.bookingId || trip._id;
        const baseFareAmount = trip.fare?.baseFare || (trip.tip ? (trip.fare?.total - trip.tip) : (trip.fare?.total || trip.fare || 180));
        
        // 1. Backfill base fare transaction if missing
        const baseExists = updatedTxns.some(t => t.bookingId === tripBookingId && t.type === 'CREDIT' && t.category !== 'rider_tip');
        if (!baseExists) {
          hasNewCredits = true;
          updatedTxns.push({
            id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
            captainEmail: user?.email,
            type: 'CREDIT',
            amount: baseFareAmount,
            title: 'Ride Fare Credited',
            subtitle: `Trip #${tripBookingId} • ${trip.rider?.name || 'Passenger'}`,
            bookingId: tripBookingId,
            date: trip.createdAt || new Date().toISOString(),
            status: 'SUCCESS',
            category: 'trip_fare'
          });
        }

        // 2. Backfill rider tip transaction if trip has tip and missing from ledger
        if (trip.tip && trip.tip > 0) {
          const tipExists = updatedTxns.some(t => t.bookingId === tripBookingId && t.type === 'CREDIT' && t.category === 'rider_tip');
          if (!tipExists) {
            hasNewCredits = true;
            updatedTxns.push({
              id: 'TIP-' + Math.floor(100000 + Math.random() * 900000),
              captainEmail: user?.email,
              type: 'CREDIT',
              amount: trip.tip,
              title: '⭐ Passenger Tip Received',
              subtitle: `Tip for Trip #${tripBookingId} from ${trip.rider?.name || 'Passenger'}`,
              bookingId: tripBookingId,
              date: trip.createdAt || new Date().toISOString(),
              status: 'SUCCESS',
              category: 'rider_tip'
            });
          }
        }
      });

      if (hasNewCredits) {
        localStorage.setItem('ridex_captain_transactions', JSON.stringify(updatedTxns));
      }

      // Sync all Cloud Payout statuses (Approved / Rejected) into local transactions & auto-refund
      try {
        let cloudPayouts = [];
        try {
          const res = await api.get('/payouts');
          if (res.data?.success && Array.isArray(res.data.payouts)) {
            cloudPayouts = res.data.payouts;
          }
        } catch (e) {}

        const storedPayouts = JSON.parse(localStorage.getItem('ridex_payout_requests') || '[]');
        const mergedPayouts = [...storedPayouts];
        cloudPayouts.forEach(cp => {
          const idx = mergedPayouts.findIndex(m => m.id === cp.id);
          if (idx >= 0) {
            mergedPayouts[idx] = { ...mergedPayouts[idx], ...cp };
          } else {
            mergedPayouts.unshift(cp);
          }
        });
        localStorage.setItem('ridex_payout_requests', JSON.stringify(mergedPayouts));

        const myPayouts = mergedPayouts.filter(p => {
          if (!user) return false;
          const myEmail = (user.email || '').toLowerCase();
          const myPhone = (user.phone || '').replace(/[^0-9]/g, '').slice(-10);
          const pEmail = (p.captainEmail || '').toLowerCase();
          const pPhone = (p.captainPhone || '').replace(/[^0-9]/g, '').slice(-10);
          if (myEmail && pEmail && myEmail === pEmail) return true;
          if (myPhone && pPhone && myPhone === pPhone) return true;
          if (myEmail === 'captain@cab.com') return true;
          return true;
        });

        const rejectedPayoutMap = new Map(
          myPayouts
            .filter(p => p.status === 'rejected')
            .map(p => [p.id, p.rejectionReason || 'Bank details verification failed'])
        );

        const approvedPayoutMap = new Map(
          myPayouts
            .filter(p => p.status === 'approved_transferred')
            .map(p => [p.id, p.utrNumber || 'UTR928174829102'])
        );

        let txnsModified = false;
        updatedTxns = updatedTxns.map(t => {
          if (rejectedPayoutMap.has(t.id)) {
            txnsModified = true;
            return {
              ...t,
              status: 'REJECTED',
              subtitle: `Payout Rejected & Refunded to Wallet • ${rejectedPayoutMap.get(t.id)}`
            };
          }
          if (approvedPayoutMap.has(t.id)) {
            txnsModified = true;
            return {
              ...t,
              status: 'SUCCESS',
              utr: approvedPayoutMap.get(t.id)
            };
          }
          return t;
        });

        if (txnsModified) {
          localStorage.setItem('ridex_captain_transactions', JSON.stringify(updatedTxns));
        }
      } catch (e) {}

      // Filter txns by user
      const myTxns = updatedTxns.filter(t => {
        if (!user) return false;
        if (t.captainEmail && t.captainEmail.toLowerCase() === user.email?.toLowerCase()) return true;
        if (user.email === 'captain@cab.com' && !t.captainEmail) return true;
        return storedTrips.some(st => (st.bookingId || st._id) === t.bookingId);
      });

      // Sort transactions newest first
      myTxns.sort((a, b) => new Date(b.date) - new Date(a.date));

      setTrips(storedTrips);
      setTransactions(myTxns);
    } catch (e) {
      setTrips([]);
      setTransactions([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLedgerData();
      const interval = setInterval(loadLedgerData, 3000);
      setPayoutSuccessMsg(null);
      setShowPayoutDialog(false);

      window.addEventListener('storage', loadLedgerData);

      let channel;
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('ridex_dispatch_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'RIDER_TIP_ADDED' || event.data?.type === 'TRIP_COMPLETED' || event.data?.type === 'PAYOUT_REJECTED' || event.data?.type === 'PAYOUT_APPROVED' || event.data?.type === 'NEW_PAYOUT_REQUEST') {
            loadLedgerData();
          }
        };
      }

      return () => {
        clearInterval(interval);
        window.removeEventListener('storage', loadLedgerData);
        if (channel) channel.close();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate real balances - DO NOT deduct REJECTED or CANCELLED payouts (they are refunded!)
  const totalEarnedGross = trips.reduce((acc, t) => acc + (t.fare?.total || t.fare || 0), 0);
  const totalWithdrawn = transactions
    .filter(t => t.type === 'DEBIT' && t.status !== 'REJECTED' && t.status !== 'CANCELLED')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  // Available Withdrawable Wallet Balance (automatically restored on admin rejection)
  const availableWalletBalance = Math.max(0, totalEarnedGross - totalWithdrawn);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTrips = trips.filter(t => !t.createdAt || t.createdAt.startsWith(todayStr));
  const todayGross = todayTrips.reduce((acc, t) => acc + (t.fare?.total || t.fare || 0), 0);
  const totalKm = trips.reduce((acc, t) => acc + (t.distanceKm || 0), 0);

  // Handle Bank Withdrawal Execution
  const handleExecutePayout = (e) => {
    e?.preventDefault();
    const withdrawValue = parseFloat(payoutAmount) || availableWalletBalance;

    if (withdrawValue <= 0 || withdrawValue > availableWalletBalance) {
      return;
    }

    setIsProcessing(true);

    const payoutId = 'PAY-' + Math.floor(100000 + Math.random() * 900000);
    const bankName = user?.captainProfile?.payout?.bankName || user?.bankDetails?.bankName || 'HDFC Bank';
    const acNum = user?.captainProfile?.payout?.accountNumber || user?.bankDetails?.accountNumber || '50100492818912';
    const ifsc = user?.captainProfile?.payout?.ifscCode || user?.bankDetails?.ifscCode || 'HDFC0001234';
    const holder = user?.captainProfile?.payout?.bankHolderName || user?.bankDetails?.bankHolderName || user?.name || 'Captain Partner';
    const upi = user?.captainProfile?.payout?.upiId || user?.bankDetails?.upiId || `${(user?.email || 'captain').split('@')[0]}@okaxis`;

    const destLabel = payoutMethod === 'bank'
      ? `${bankName} (A/C ••••${acNum.slice(-4)})`
      : upi;

    const newPayoutRequest = {
      id: payoutId,
      captainId: user?._id || user?.phone || 'cap_1',
      captainName: user?.name || 'Captain Partner',
      captainEmail: user?.email || '',
      captainPhone: user?.phone || '',
      bankDetails: {
        holderName: holder,
        accountNumber: acNum,
        ifsc: ifsc,
        bankName: bankName,
        upiId: upi
      },
      amount: withdrawValue,
      payoutMethod: payoutMethod,
      destination: destLabel,
      status: 'pending_admin_approval',
      requestedAt: new Date().toISOString()
    };

    const newDebitTxn = {
      id: payoutId,
      captainEmail: user?.email,
      type: 'DEBIT',
      amount: withdrawValue,
      title: payoutMethod === 'bank' ? 'Bank Transfer (IMPS)' : 'UPI Payout',
      subtitle: `${destLabel} • Ref: ${payoutId}`,
      date: new Date().toISOString(),
      status: 'PENDING_APPROVAL',
      category: 'bank_withdrawal'
    };

    // Call Cloud Backend API so Admin on Laptop receives live payout request
    try {
      api.post('/payouts/request', newPayoutRequest).catch(() => {});
    } catch (e) {}

    try {
      // 1. Save in ridex_payout_requests for Admin clearance
      const existingPayouts = JSON.parse(localStorage.getItem('ridex_payout_requests') || '[]');
      const updatedPayouts = [newPayoutRequest, ...existingPayouts.filter(p => p.id !== payoutId)];
      localStorage.setItem('ridex_payout_requests', JSON.stringify(updatedPayouts));

      // 2. Save in transactions
      const existingTxns = JSON.parse(localStorage.getItem('ridex_captain_transactions') || '[]');
      const updatedTxns = [newDebitTxn, ...existingTxns];
      localStorage.setItem('ridex_captain_transactions', JSON.stringify(updatedTxns));
      setTransactions(updatedTxns);

      // 3. Broadcast to Admin
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('ridex_dispatch_channel');
        channel.postMessage({ type: 'NEW_PAYOUT_REQUEST', data: newPayoutRequest });
        channel.close();
      }
    } catch (err) {}

    setIsProcessing(false);
    setShowPayoutDialog(false);
    setGuaranteedTransferModal({
      amount: withdrawValue,
      method: payoutMethod,
      destination: destLabel,
      bankName: bankName,
      accountNo: acNum,
      ifsc: ifsc,
      holder: holder,
      upiId: upi,
      payoutId: payoutId
    });
  };

  // Filtered transactions for statement list
  const filteredTransactions = transactions.filter(txn => {
    if (activeTab === 'credits') return txn.type === 'CREDIT';
    if (activeTab === 'debits') return txn.type === 'DEBIT';
    return true; // 'all'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl font-black">
              💼
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Captain Wallet & Financial Passbook
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black">
                  Verified
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Track all money additions (+ Credits), withdrawals (- Debits), and real bank payouts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">

          {/* Top 4 Financial Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Available Wallet Balance */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Wallet className="w-3 h-3" /> Available Balance
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                ₹{availableWalletBalance}
              </p>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                Ready to Cashout
              </span>
            </div>

            {/* Today's Gross Income */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Today's Gross
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                ₹{todayGross}
              </p>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                {todayTrips.length} {todayTrips.length === 1 ? 'Ride' : 'Rides'} Today
              </span>
            </div>

            {/* Lifetime Revenue */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Earned
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                ₹{totalEarnedGross}
              </p>
              <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                {trips.length} Completed Trips
              </span>
            </div>

            {/* Total Transferred to Bank */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Paid to Bank
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                ₹{totalWithdrawn}
              </p>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block mt-0.5">
                Transferred to A/C
              </span>
            </div>

          </div>

          {/* Instant Bank Payout Action Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 dark:bg-slate-800/90 text-white border border-slate-800 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center text-xl font-bold shrink-0">
                🏦
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white">Instant Bank & UPI Payout</h4>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    IMPS 24/7
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Linked Account: <span className="font-semibold text-slate-200">HDFC Bank (•••• 8912)</span> • Zero Transfer Fee
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setPayoutAmount(availableWalletBalance.toString());
                setShowPayoutDialog(true);
                setPayoutSuccessMsg(null);
              }}
              disabled={availableWalletBalance <= 0}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer hover:scale-105 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" /> Transfer to Bank (₹{availableWalletBalance}) ➔
            </button>
          </div>

          {/* Transfer Confirmation Alert */}
          {payoutSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs space-y-1 shadow-sm"
            >
              <div className="flex items-center gap-2 font-black text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ₹{payoutSuccessMsg.amount} Transferred to Bank Account Successfully!
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Destination: <span className="font-bold">{payoutSuccessMsg.destination}</span> • Reference UTR: <span className="font-mono font-bold">{payoutSuccessMsg.utr}</span>
              </p>
              <p className="text-[10px] text-slate-500">
                The deducted amount is recorded below in your Passbook Debit statement.
              </p>
            </motion.div>
          )}

          {/* Interactive Withdrawal Dialog (When Clicked) */}
          {showPayoutDialog && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 rounded-2xl bg-amber-500/5 border-2 border-amber-500/40 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-500" /> Confirm Bank / UPI Cashout
                </h4>
                <button
                  onClick={() => setShowPayoutDialog(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                >
                  Cancel
                </button>
              </div>

              {/* Method Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutMethod('bank')}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                    payoutMethod === 'bank'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <p className="font-extrabold text-slate-900 dark:text-white">🏦 Direct Bank (IMPS)</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">HDFC Bank •••• 8912</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutMethod('upi')}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                    payoutMethod === 'upi'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <p className="font-extrabold text-slate-900 dark:text-white">📱 Instant UPI ID</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">captain.jitendra@okaxis</p>
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Withdrawal Amount (₹)</label>
                  <span className="text-slate-400 font-mono">Max: ₹{availableWalletBalance}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-base">₹</span>
                  <input
                    type="number"
                    min="1"
                    max={availableWalletBalance}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-base text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              <button
                onClick={handleExecutePayout}
                disabled={isProcessing || !payoutAmount || parseFloat(payoutAmount) <= 0 || parseFloat(payoutAmount) > availableWalletBalance}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Confirm Payout & Deduct ₹{payoutAmount || 0} ➔
              </button>
            </motion.div>
          )}

          {/* Statement / Passbook Filter Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 pt-2">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                All Passbook Statements ({transactions.length})
              </button>

              <button
                onClick={() => setActiveTab('credits')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'credits'
                    ? 'bg-emerald-500 text-white font-black shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                + Added Credits ({transactions.filter(t => t.type === 'CREDIT').length})
              </button>

              <button
                onClick={() => setActiveTab('debits')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'debits'
                    ? 'bg-rose-500 text-white font-black shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                - Bank Deductions ({transactions.filter(t => t.type === 'DEBIT').length})
              </button>

              <button
                onClick={() => setActiveTab('trips')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'trips'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                🚖 Trip Invoices ({trips.length})
              </button>
            </div>
          </div>

          {/* Statement History Content */}
          <div className="space-y-2.5">
            {activeTab === 'trips' ? (
              /* Trip Invoices View */
              trips.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">No completed trips yet.</div>
              ) : (
                trips.map((trip, idx) => (
                  <div
                    key={trip._id || idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-amber-500/50 transition-all shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                          #{trip.bookingId}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          Trip Finished
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          {trip.vehicleType || 'Sedan'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Passenger: {trip.rider?.name || 'Corporate Rider'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-sm">
                        📍 {trip.pickup?.address || trip.pickup} ➔ 🏁 {trip.drop?.address || trip.drop}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-700">
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        +₹{trip.fare?.total || trip.fare || 180}
                      </span>
                      {onViewInvoice && (
                        <button
                          onClick={() => {
                            onClose();
                            onViewInvoice(trip);
                          }}
                          className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 transition-colors cursor-pointer mt-1"
                        >
                          <FileText className="w-3 h-3" /> View Tax Invoice
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )
            ) : (
              /* Financial Passbook Ledger View */
              filteredTransactions.length === 0 ? (
                <div className="p-10 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-2 border border-slate-200/60 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 text-2xl flex items-center justify-center mx-auto mb-2">
                    📋
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    No Transaction Records Found
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Complete rides to earn fare credits or withdraw funds to see debit records here.
                  </p>
                </div>
              ) : (
                filteredTransactions.map((item) => {
                  const isCredit = item.type === 'CREDIT';
                  const isRejected = item.status === 'REJECTED' || item.status === 'CANCELLED';

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border flex justify-between items-center gap-3 transition-all ${
                        isRejected
                          ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 ${
                          isRejected
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            : isCredit 
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}>
                          {isRejected ? <RefreshCw className="w-5 h-5" /> : isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-black text-slate-900 dark:text-white">
                              {item.title}
                            </p>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              isRejected
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                : isCredit 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            }`}>
                              {isRejected ? 'Refunded to Wallet' : isCredit ? 'Credit Added' : 'Debit Withdrawn'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.subtitle}
                          </p>

                          <p className="text-[10px] text-slate-400">
                            {item.date ? new Date(item.date).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Recent'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isRejected ? (
                          <>
                            <p className="text-xs font-bold font-mono text-slate-400 line-through">
                              -₹{item.amount}
                            </p>
                            <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                              +₹{item.amount} (Refunded)
                            </span>
                          </>
                        ) : (
                          <p className={`text-base font-black font-mono ${
                            isCredit 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {isCredit ? `+₹${item.amount}` : `-₹${item.amount}`}
                          </p>
                        )}
                        <span className={`text-[10px] font-bold block mt-0.5 ${
                          isRejected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                        }`}>
                          {item.status || 'SUCCESS'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>

        </div>
      </motion.div>

      {/* 15-MINUTE BANK TRANSFER GUARANTEE PRO POPUP MODAL */}
      {guaranteedTransferModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/40 shadow-2xl p-6 sm:p-8 space-y-5 text-slate-900 dark:text-white relative overflow-hidden animate-in zoom-in-95">
            
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Glowing Icon Header */}
            <div className="flex items-center gap-3.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center ring-4 ring-amber-500/10 shadow-lg shrink-0">
                <Clock className="w-7 h-7 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
              </div>

              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  ⚡ 15-Minute Guaranteed Payout
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  Transfer Initiated Successfully!
                </h3>
              </div>
            </div>

            {/* Main Promise / Notification Message */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-black text-emerald-700 dark:text-emerald-300 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>₹{guaranteedTransferModal.amount} Transfer in Progress</span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Your withdrawal of <strong>₹{guaranteedTransferModal.amount}</strong> will be credited to your registered <strong>{guaranteedTransferModal.method === 'bank' ? 'Bank Account' : 'UPI ID'}</strong> <strong>within 15 minutes</strong> upon Administrator verification clearance.
              </p>
            </div>

            {/* Beneficiary Details Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400">Request Tracking ID:</span>
                <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400">{guaranteedTransferModal.payoutId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Destination:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{guaranteedTransferModal.destination}</span>
              </div>
              {guaranteedTransferModal.method === 'bank' && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Bank IFSC:</span>
                    <span className="font-mono font-bold">{guaranteedTransferModal.ifsc}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Account Holder:</span>
                    <span className="font-bold">{guaranteedTransferModal.holder}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400">Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Awaiting Admin Clearance
                </span>
              </div>
            </div>

            {/* Alert info */}
            <p className="text-[10px] text-slate-400 leading-relaxed text-center">
              An alert has been dispatched to the Administrator Console. You will receive an instant notification in your profile once the payment is released.
            </p>

            {/* Actions */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setGuaranteedTransferModal(null)}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
              >
                Understood & Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

