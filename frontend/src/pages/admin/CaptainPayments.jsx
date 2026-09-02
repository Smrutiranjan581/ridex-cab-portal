import React, { useState, useEffect } from 'react';
import { 
  DollarSign, CheckCircle2, Clock, XCircle, Search, 
  Building2, CreditCard, ArrowUpRight, ShieldCheck, AlertCircle, 
  Send, User, Phone, Mail, Landmark, Sparkles, RefreshCw, Check, Eye
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';

export default function CaptainPayments() {
  const [filterTab, setFilterTab] = useState('pending'); // 'pending' | 'completed' | 'rejected' | 'all'
  const [search, setSearch] = useState('');
  const [payouts, setPayouts] = useState([]);
  const [selectedPayoutDossier, setSelectedPayoutDossier] = useState(null);
  const [rejectModalTarget, setRejectModalTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('Bank account details mismatch.');
  const [toastNotice, setToastNotice] = useState(null);

  // Load payout requests from localStorage
  const loadPayouts = () => {
    try {
      const stored = localStorage.getItem('ridex_payout_requests');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter out any dummy demo payout entries
        const realPayouts = parsed.filter(p => p.id !== 'PAY-891024' && p.captainId !== 'cap_demo_1');
        setPayouts(realPayouts);
        if (realPayouts.length !== parsed.length) {
          localStorage.setItem('ridex_payout_requests', JSON.stringify(realPayouts));
        }
      } else {
        setPayouts([]);
      }
    } catch (e) {
      setPayouts([]);
    }
  };

  useEffect(() => {
    loadPayouts();

    const handleStorageUpdate = (e) => {
      if (e.key === 'ridex_payout_requests') {
        loadPayouts();
      }
    };

    window.addEventListener('storage', handleStorageUpdate);

    let channel;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('ridex_dispatch_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'NEW_PAYOUT_REQUEST' || event.data?.type === 'PAYOUT_STATUS_CHANGE') {
          loadPayouts();
        }
      };
    }

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      if (channel) channel.close();
    };
  }, []);

  const savePayoutsList = (updatedList) => {
    setPayouts(updatedList);
    localStorage.setItem('ridex_payout_requests', JSON.stringify(updatedList));

    if ('BroadcastChannel' in window) {
      const ch = new BroadcastChannel('ridex_dispatch_channel');
      ch.postMessage({ type: 'PAYOUT_STATUS_CHANGE' });
      ch.close();
    }
  };

  // Action: Approve & Transfer Payout
  const handleApprovePayout = (payout) => {
    const utrNumber = 'UTR' + Math.floor(100000000000 + Math.random() * 900000000000);
    const approvedTimestamp = new Date().toISOString();

    const updated = payouts.map(p => {
      if (p.id === payout.id) {
        return {
          ...p,
          status: 'approved_transferred',
          utrNumber: utrNumber,
          approvedAt: approvedTimestamp
        };
      }
      return p;
    });

    savePayoutsList(updated);

    // 1. Update captain's transaction record in ridex_captain_transactions
    try {
      const storedTxns = JSON.parse(localStorage.getItem('ridex_captain_transactions') || '[]');
      const updatedTxns = storedTxns.map(t => {
        if (t.id === payout.id || (t.amount === payout.amount && t.type === 'DEBIT')) {
          return {
            ...t,
            status: 'SUCCESS',
            utr: utrNumber,
            approvedAt: approvedTimestamp
          };
        }
        return t;
      });
      localStorage.setItem('ridex_captain_transactions', JSON.stringify(updatedTxns));
    } catch (e) {}

    // 2. Push Notification to Captain's In-App Notification Drawer
    try {
      const notifKey = `ridex_user_notifications_${(payout.captainEmail || '').toLowerCase()}`;
      const existingNotifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
      
      const newNotification = {
        id: 'notif_' + Date.now(),
        title: '💰 Payout Approved & Transferred!',
        desc: `₹${payout.amount} has been successfully credited to your ${payout.payoutMethod === 'bank' ? 'Bank Account' : 'UPI ID'} (${payout.destination}). Reference UTR: ${utrNumber}.`,
        time: 'Just now',
        type: 'payout',
        amount: payout.amount,
        utr: utrNumber,
        createdAt: approvedTimestamp,
        isRead: false
      };

      existingNotifs.unshift(newNotification);
      localStorage.setItem(notifKey, JSON.stringify(existingNotifs));

      // Also dispatch on BroadcastChannel for instant live audio/bell alert
      if ('BroadcastChannel' in window) {
        const ch = new BroadcastChannel('ridex_dispatch_channel');
        ch.postMessage({ 
          type: 'PAYOUT_APPROVED', 
          captainEmail: payout.captainEmail,
          data: newNotification
        });
        ch.close();
      }
    } catch (e) {}

    setToastNotice({
      type: 'success',
      message: `✅ ₹${payout.amount} payout approved! Transferred to Captain ${payout.captainName}'s bank (UTR: ${utrNumber}). Notification sent.`
    });
    setTimeout(() => setToastNotice(null), 5000);
  };

  // Action: Reject Payout & Refund Wallet
  const handleConfirmReject = () => {
    if (!rejectModalTarget) return;

    const updated = payouts.map(p => {
      if (p.id === rejectModalTarget.id) {
        return {
          ...p,
          status: 'rejected',
          rejectionReason: rejectReason || 'Bank account details mismatch.',
          rejectedAt: new Date().toISOString()
        };
      }
      return p;
    });

    savePayoutsList(updated);

    // 1. Update Captain Ledger Transactions to mark Debit as REJECTED (restoring wallet balance)
    try {
      const existingTxns = JSON.parse(localStorage.getItem('ridex_captain_transactions') || '[]');
      const updatedTxns = existingTxns.map(t => {
        if (t.id === rejectModalTarget.id || (t.amount === rejectModalTarget.amount && t.type === 'DEBIT' && t.status === 'PENDING_APPROVAL')) {
          return {
            ...t,
            status: 'REJECTED',
            rejectionReason: rejectReason || 'Bank details mismatch.',
            subtitle: `Payout Rejected & Refunded • ${rejectReason || 'Bank details mismatch'}`,
            refundedAt: new Date().toISOString()
          };
        }
        return t;
      });
      localStorage.setItem('ridex_captain_transactions', JSON.stringify(updatedTxns));
    } catch (e) {}

    // 2. Push Rejection & Refund Notification to Captain
    try {
      const notifKey = `ridex_user_notifications_${(rejectModalTarget.captainEmail || '').toLowerCase()}`;
      const existingNotifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
      existingNotifs.unshift({
        id: 'notif_' + Date.now(),
        title: '⚠️ Payout Rejected & Amount Refunded',
        desc: `Your withdrawal request of ₹${rejectModalTarget.amount} was rejected and ₹${rejectModalTarget.amount} has been refunded to your wallet balance. Reason: "${rejectReason || 'Bank details mismatch'}"`,
        time: 'Just now',
        type: 'payout_rejected',
        amount: rejectModalTarget.amount,
        createdAt: new Date().toISOString(),
        isRead: false
      });
      localStorage.setItem(notifKey, JSON.stringify(existingNotifs));

      // Broadcast event so Captain screen re-computes balance and shows notification in real-time
      if ('BroadcastChannel' in window) {
        const ch = new BroadcastChannel('ridex_dispatch_channel');
        ch.postMessage({
          type: 'PAYOUT_REJECTED',
          payoutId: rejectModalTarget.id,
          captainEmail: rejectModalTarget.captainEmail,
          amount: rejectModalTarget.amount,
          reason: rejectReason || 'Bank details mismatch'
        });
        ch.close();
      }
    } catch (e) {}

    setRejectModalTarget(null);
    setToastNotice({
      type: 'error',
      message: `🚫 Payout for ${rejectModalTarget.captainName} rejected. ₹${rejectModalTarget.amount} refunded to Captain's wallet.`
    });
    setTimeout(() => setToastNotice(null), 4500);
  };

  // Filter list
  const filteredPayouts = payouts.filter(p => {
    if (filterTab === 'pending' && p.status !== 'pending_admin_approval') return false;
    if (filterTab === 'completed' && p.status !== 'approved_transferred') return false;
    if (filterTab === 'rejected' && p.status !== 'rejected') return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.captainName?.toLowerCase().includes(q) ||
      p.captainPhone?.includes(q) ||
      p.captainEmail?.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q) ||
      p.bankDetails?.bankName?.toLowerCase().includes(q)
    );
  });

  const pendingCount = payouts.filter(p => p.status === 'pending_admin_approval').length;
  const completedCount = payouts.filter(p => p.status === 'approved_transferred').length;
  const rejectedCount = payouts.filter(p => p.status === 'rejected').length;
  const totalSettledAmount = payouts
    .filter(p => p.status === 'approved_transferred')
    .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  🏦 Banking & Payout Clearance Desk
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  15-Min SLA Guarantee
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                Captain Payments & Withdrawals
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verify captain bank details & approve instant earnings payouts to registered bank accounts and UPI
              </p>
            </div>
          </div>

          {/* Toast Notice */}
          {toastNotice && (
            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 ${
              toastNotice.type === 'success'
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-rose-500 text-white shadow-rose-500/20'
            }`}>
              <span>{toastNotice.message}</span>
              <button onClick={() => setToastNotice(null)} className="text-white/80 hover:text-white ml-3">✕</button>
            </div>
          )}

          {/* Overview Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Clearance</p>
                <h3 className="text-xl font-black text-amber-600 dark:text-amber-400">{pendingCount} Requests</h3>
                <p className="text-[10px] text-slate-500">Requires admin approval</p>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Settled Amount</p>
                <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{totalSettledAmount.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-500">{completedCount} payouts cleared</p>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transfer Modes</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">IMPS & UPI</h3>
                <p className="text-[10px] text-slate-500">Direct Account Credit</p>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security & KYC</p>
                <h3 className="text-xl font-black text-purple-600 dark:text-purple-400">100% Verified</h3>
                <p className="text-[10px] text-slate-500">Admin audit protected</p>
              </div>
            </div>

          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2">
            
            {/* Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
              <button
                onClick={() => setFilterTab('pending')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  filterTab === 'pending'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>⏳ Pending Approval</span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setFilterTab('completed')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  filterTab === 'completed'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>✅ Transferred / Completed</span>
                <span className="text-[10px] text-slate-400">({completedCount})</span>
              </button>

              <button
                onClick={() => setFilterTab('rejected')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  filterTab === 'rejected'
                    ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>❌ Rejected</span>
                <span className="text-[10px] text-slate-400">({rejectedCount})</span>
              </button>

              <button
                onClick={() => setFilterTab('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  filterTab === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({payouts.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Captain, Bank, ID..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

          </div>

          {/* Payouts Table */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Request ID & Date</th>
                    <th className="p-4">Captain Profile</th>
                    <th className="p-4">Payout Amount</th>
                    <th className="p-4">Bank / UPI Destination</th>
                    <th className="p-4">Clearance Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPayouts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No payout requests found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPayouts.map((payout) => {
                      const isPending = payout.status === 'pending_admin_approval';
                      const isApproved = payout.status === 'approved_transferred';
                      const isRejected = payout.status === 'rejected';

                      return (
                        <tr key={payout.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          
                          {/* Request ID & Date */}
                          <td className="p-4">
                            <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400">
                              {payout.id}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(payout.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(payout.requestedAt).toLocaleDateString()}</span>
                            </div>
                          </td>

                          {/* Captain Info */}
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                              {payout.captainName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {payout.captainPhone} • {payout.captainEmail}
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="p-4">
                            <span className="font-extrabold text-base font-mono text-slate-900 dark:text-white">
                              ₹{payout.amount}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase">
                              Earnings Transfer
                            </span>
                          </td>

                          {/* Bank / UPI Destination */}
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Landmark className="w-3.5 h-3.5 text-amber-500" />
                                {payout.destination}
                              </span>
                              {payout.payoutMethod === 'bank' && payout.bankDetails?.ifsc && (
                                <span className="font-mono text-[10px] text-slate-400 block">
                                  IFSC: {payout.bankDetails.ifsc} • Holder: {payout.bankDetails.holderName}
                                </span>
                              )}
                              {payout.payoutMethod === 'upi' && (
                                <span className="font-mono text-[10px] text-slate-400 block">
                                  UPI ID: {payout.bankDetails?.upiId || 'captain@okaxis'}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-4">
                            {isPending && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Pending Admin Approval
                              </span>
                            )}
                            {isApproved && (
                              <div>
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  Transferred (Settled)
                                </span>
                                {payout.utrNumber && (
                                  <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                                    UTR: {payout.utrNumber}
                                  </span>
                                )}
                              </div>
                            )}
                            {isRejected && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
                                ✕ Held / Rejected
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleApprovePayout(payout)}
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Verify & Transfer</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectModalTarget(payout);
                                    setRejectReason('Bank account IFSC or number mismatch.');
                                  }}
                                  className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                  title="Reject payout"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedPayoutDossier(payout)}
                                className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1 ml-auto"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Receipt</span>
                              </button>
                            )}
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      {/* Reject Modal */}
      {rejectModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-500/30 p-6 space-y-4 text-slate-900 dark:text-white shadow-2xl">
            <h3 className="text-base font-black">Reject Payout Request</h3>
            <p className="text-xs text-slate-400">
              Captain: <strong>{rejectModalTarget.captainName}</strong> • Amount: <strong>₹{rejectModalTarget.amount}</strong>
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Reason for Holding / Rejection:</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt / Dossier Modal */}
      {selectedPayoutDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-slate-900 dark:text-white shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black">Payout Settlement Receipt</h3>
              <button onClick={() => setSelectedPayoutDossier(null)} className="text-slate-400">✕</button>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Payout ID:</span>
                <span className="font-mono font-bold">{selectedPayoutDossier.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Transferred:</span>
                <span className="font-bold text-emerald-500 text-sm">₹{selectedPayoutDossier.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Captain:</span>
                <span className="font-bold">{selectedPayoutDossier.captainName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bank Destination:</span>
                <span className="font-bold">{selectedPayoutDossier.destination}</span>
              </div>
              {selectedPayoutDossier.utrNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Bank UTR Ref:</span>
                  <span className="font-mono font-extrabold text-amber-500">{selectedPayoutDossier.utrNumber}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedPayoutDossier(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
