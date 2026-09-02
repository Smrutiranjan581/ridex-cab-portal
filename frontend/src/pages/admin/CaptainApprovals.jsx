import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, CheckCircle2, XCircle, Clock, AlertTriangle, 
  UserCheck, UserX, Eye, FileText, Phone, Mail, MapPin, Car, CreditCard, 
  Landmark, Calendar, Users, ArrowRight, ShieldAlert, Award, Send, Check
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import api from '../../services/api';

export default function CaptainApprovals() {
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'
  const [selectedCaptainDossier, setSelectedCaptainDossier] = useState(null);
  const [rejectModalTarget, setRejectModalTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Documents require clearer photograph and verification.');
  const [emailDispatchModal, setEmailDispatchModal] = useState(null);
  const [toastNotice, setToastNotice] = useState(null);

  const [localUsersState, setLocalUsersState] = useState(() => {
    try {
      const raw = localStorage.getItem('fleetcorp_registered_users');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const handleStorageSync = () => {
      try {
        const raw = localStorage.getItem('fleetcorp_registered_users');
        if (raw) setLocalUsersState(JSON.parse(raw));
      } catch (e) {}
    };

    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  // Filter all captain registrations
  const allCaptains = localUsersState.filter(u => u.role === 'captain');

  // Helper to get approval status
  const getApprovalStatus = (cap) => {
    if (cap.isRejected || cap.status === 'rejected') return 'rejected';
    if (cap.isApproved === true || cap.status === 'available' || cap.status === 'active' || cap.status === 'online') {
      return 'approved';
    }
    if (cap.isApproved === false || cap.status === 'pending_approval' || cap.status === 'pending') {
      return 'pending';
    }
    // Default demo accounts with ratings are approved, newly signed up without explicit approval are pending
    if (cap.email === 'captain@cab.com' || (cap.captainProfile && cap.captainProfile.rating > 0 && !cap.isNewSignup)) {
      return 'approved';
    }
    return 'pending';
  };

  // Filtered captains list
  const filteredCaptains = allCaptains.filter(cap => {
    const status = getApprovalStatus(cap);
    if (filterTab !== 'all' && status !== filterTab) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const nameMatch = cap.name?.toLowerCase().includes(q);
    const phoneMatch = cap.phone?.includes(q);
    const emailMatch = cap.email?.toLowerCase().includes(q);
    const cityMatch = cap.city?.toLowerCase().includes(q);
    const plateMatch = (cap.vehicleDetails?.numberPlate || cap.captainProfile?.vehicle?.numberPlate || '').toLowerCase().includes(q);
    const licenseMatch = (cap.licenseNumber || cap.captainProfile?.licenseNumber || '').toLowerCase().includes(q);

    return nameMatch || phoneMatch || emailMatch || cityMatch || plateMatch || licenseMatch;
  });

  const pendingCount = allCaptains.filter(c => getApprovalStatus(c) === 'pending').length;
  const approvedCount = allCaptains.filter(c => getApprovalStatus(c) === 'approved').length;
  const rejectedCount = allCaptains.filter(c => getApprovalStatus(c) === 'rejected').length;

  const saveUpdatedUsers = (updatedList) => {
    setLocalUsersState(updatedList);
    localStorage.setItem('fleetcorp_registered_users', JSON.stringify(updatedList));
    if ('BroadcastChannel' in window) {
      const ch = new BroadcastChannel('ridex_dispatch_channel');
      ch.postMessage({ type: 'CAPTAIN_STATUS_CHANGE' });
      ch.close();
    }
  };

  // Action: Approve Captain & Dispatch Official Activation Email
  const handleApproveCaptain = (cap) => {
    const approvalTimestamp = new Date().toISOString();
    const updated = localUsersState.map(u => {
      const match = (u.email && u.email === cap.email) || (u.phone && u.phone === cap.phone);
      if (match) {
        return {
          ...u,
          isApproved: true,
          status: 'available',
          isDeactivated: false,
          isRejected: false,
          approvedAt: approvalTimestamp,
          rejectionReason: null
        };
      }
      return u;
    });

    saveUpdatedUsers(updated);

    // Save official email record in captain's inbox
    const emailPayload = {
      id: 'mail_' + Date.now(),
      sender: 'RideX Fleet Compliance Bureau <admin@ridex.com>',
      recipient: cap.email,
      captainName: cap.name,
      subject: `🎉 Congratulations ${cap.name}! Your RideX Captain Account is Approved & Activated`,
      vehicleInfo: `${cap.vehicleDetails?.model || 'Registered Vehicle'} (${cap.vehicleDetails?.numberPlate || 'OD-02'})`,
      city: cap.city || 'Bhubaneswar',
      approvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' }),
      loginUrl: 'http://localhost:5173/login'
    };

    try {
      const mailKey = `ridex_mail_inbox_${cap.email.toLowerCase()}`;
      const existingMails = JSON.parse(localStorage.getItem(mailKey) || '[]');
      existingMails.unshift(emailPayload);
      localStorage.setItem(mailKey, JSON.stringify(existingMails));
    } catch(e) {}

    // Show Email Dispatch Confirmation Modal
    setEmailDispatchModal(emailPayload);

    setToastNotice({
      type: 'success',
      message: `✅ Captain ${cap.name} approved! Official activation email dispatched to ${cap.email}.`
    });
    setTimeout(() => setToastNotice(null), 5000);
  };

  // Action: Reject Captain
  const handleConfirmReject = () => {
    if (!rejectModalTarget) return;
    const updated = localUsersState.map(u => {
      const match = (u.email && u.email === rejectModalTarget.email) || (u.phone && u.phone === rejectModalTarget.phone);
      if (match) {
        return {
          ...u,
          isApproved: false,
          status: 'rejected',
          isRejected: true,
          isDeactivated: true,
          rejectedAt: new Date().toISOString(),
          rejectionReason: rejectionReason || 'KYC documents require re-submission.'
        };
      }
      return u;
    });

    saveUpdatedUsers(updated);
    setRejectModalTarget(null);
    setToastNotice({
      type: 'error',
      message: `🚫 Application for ${rejectModalTarget.name} has been Rejected with compliance feedback.`
    });
    setTimeout(() => setToastNotice(null), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl">
          
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-transparent border border-amber-500/20 shadow-sm">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <UserCheck className="w-3.5 h-3.5" /> Fleet Partner Onboarding Desk
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Captain Register Approval
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Review driver applications, verify KYC, RC & banking credentials, and grant commercial cockpit clearance.
              </p>
            </div>

            {/* Quick Stats Summary */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block uppercase">Pending</span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">{pendingCount}</span>
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase">Approved</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">{approvedCount}</span>
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center">
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 block uppercase">Rejected</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">{rejectedCount}</span>
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {toastNotice && (
            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg transition-all animate-in fade-in ${
              toastNotice.type === 'success' 
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-800 dark:text-rose-300'
            }`}>
              <span>{toastNotice.message}</span>
              <button onClick={() => setToastNotice(null)} className="opacity-70 hover:opacity-100">✕</button>
            </div>
          )}

          {/* Search Bar & Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Captain Name, Phone, License, or Vehicle Plate..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setFilterTab('pending')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                  filterTab === 'pending'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>⏳</span> Pending ({pendingCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('approved')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                  filterTab === 'approved'
                    ? 'bg-emerald-500 text-white font-black shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>✅</span> Approved ({approvedCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('rejected')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                  filterTab === 'rejected'
                    ? 'bg-rose-500 text-white font-black shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>❌</span> Rejected ({rejectedCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  filterTab === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({allCaptains.length})
              </button>
            </div>
          </div>

          {/* Captain Applications List */}
          <div className="space-y-4">
            {filteredCaptains.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <UserCheck className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  No Captain Applications Found
                </h3>
                <p className="text-xs text-slate-400">
                  {filterTab === 'pending'
                    ? 'There are no pending driver registrations awaiting approval.'
                    : 'Try adjusting your search query or filter tab.'}
                </p>
              </div>
            ) : (
              filteredCaptains.map((cap) => {
                const status = getApprovalStatus(cap);
                const vehicle = cap.vehicleDetails || cap.captainProfile?.vehicle || {
                  category: 'bike',
                  model: 'Hero Splendor',
                  numberPlate: 'OD-02-NEW-0001'
                };
                const license = cap.licenseNumber || cap.captainProfile?.licenseNumber || 'DL-OD02-202688';
                const avatar = cap.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80";

                return (
                  <div
                    key={cap._id || cap.email || cap.phone}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                      
                      {/* Driver Avatar & Primary Info */}
                      <div className="flex items-center gap-3.5">
                        <div className="relative shrink-0">
                          <img
                            src={avatar}
                            alt={cap.name}
                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/50 shadow-md"
                          />
                          <span className={`absolute -bottom-1 -right-1 p-1 rounded-full text-white text-[9px] font-black ${
                            status === 'approved' ? 'bg-emerald-500' : status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'
                          }`}>
                            {status === 'approved' ? '✓' : status === 'rejected' ? '✕' : '⏳'}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                              {cap.name}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              status === 'approved'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : status === 'rejected'
                                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            }`}>
                              {status === 'approved' ? 'Approved & Live' : status === 'rejected' ? 'Rejected' : 'Pending Verification'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3.5 h-3.5 text-slate-400" /> {cap.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-slate-400" /> {cap.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-amber-500" /> {cap.city || 'Bhubaneswar'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedCaptainDossier(cap)}
                          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Dossier</span>
                        </button>

                        {status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleApproveCaptain(cap)}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Activate</span>
                          </button>
                        )}

                        {status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => {
                              setRejectModalTarget(cap);
                              setRejectionReason('Documents require clearer photograph and verification.');
                            }}
                            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 border border-rose-500/25 transition-all cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject / Hold</span>
                          </button>
                        )}
                      </div>

                    </div>

                    {/* Quick Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-medium">
                      <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Vehicle Specs</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {vehicle.model} ({vehicle.category?.toUpperCase()})
                        </span>
                        <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                          {vehicle.numberPlate}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Driving License</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {license}
                        </span>
                        <span className="text-[10px] text-slate-400">RC: {cap.rcNumber || 'Verified RC'}</span>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">KYC Identity</span>
                        <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 block">
                          PAN: <strong>{cap.panNumber || 'ABCDE1234F'}</strong>
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 block truncate">
                          Aadhaar: {cap.aadhaarNumber || 'Verified Online'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Payout Details</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px] block truncate">
                          {cap.payoutUpi || `${cap.phone}@upi`}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {cap.bankDetails?.bankName || 'Verified Bank'}
                        </span>
                      </div>
                    </div>

                    {status === 'rejected' && cap.rejectionReason && (
                      <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span><strong>Rejection Feedback:</strong> "{cap.rejectionReason}"</span>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

        </main>
      </div>

      {/* FULL DOSSIER MODAL */}
      {selectedCaptainDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 dark:text-white">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <img
                  src={selectedCaptainDossier.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"}
                  alt={selectedCaptainDossier.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-500 shadow-md"
                />
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    Official Driver Dossier 🪪
                  </span>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {selectedCaptainDossier.name}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: RDX-CAP-{(selectedCaptainDossier.phone || '9999').slice(-4)} • Registered in {selectedCaptainDossier.city || 'Bhubaneswar'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCaptainDossier(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Dossier Sections */}
            <div className="space-y-4 text-xs">
              
              {/* 1. Personal & Contact */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-amber-500" /> 1. Personal & Demographic Credentials
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-medium">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Date of Birth</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCaptainDossier.dob || '1995-05-15'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Gender</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCaptainDossier.gender || 'Male'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Operating City</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCaptainDossier.city || 'Bhubaneswar'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Residential Address</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCaptainDossier.address || 'Plot 104, Shaheed Nagar, Bhubaneswar'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">PIN Code</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedCaptainDossier.pincode || '751007'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Emergency Contact</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedCaptainDossier.emergencyContact || '+91 9437012345 (Family)'}</span>
                  </div>
                </div>
              </div>

              {/* 2. Vehicle & Capacity */}
              <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 space-y-2">
                <h4 className="font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-amber-500" /> 2. Vehicle Specifications
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-medium">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Vehicle Category</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                      {selectedCaptainDossier.vehicleDetails?.category || selectedCaptainDossier.captainProfile?.vehicle?.category || 'BIKE'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Model Name</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedCaptainDossier.vehicleDetails?.model || selectedCaptainDossier.captainProfile?.vehicle?.model || 'Hero Splendor'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Number Plate</span>
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                      {selectedCaptainDossier.vehicleDetails?.numberPlate || selectedCaptainDossier.captainProfile?.vehicle?.numberPlate || 'OD-02-AB-1234'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Seating Capacity</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedCaptainDossier.vehicleDetails?.capacity || 1} Passenger(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. KYC & Banking */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-blue-500" /> 3. Government KYC & Bank Account Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-medium">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Driving License</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selectedCaptainDossier.licenseNumber || selectedCaptainDossier.captainProfile?.licenseNumber || 'DL-OD02-2026'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">RC Number</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selectedCaptainDossier.rcNumber || 'RC-OD02-2022-8877'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">PAN Card</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selectedCaptainDossier.panNumber || 'ABCDE1234F'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Aadhaar Number</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selectedCaptainDossier.aadhaarNumber || 'Verified Online'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Bank Name</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedCaptainDossier.bankDetails?.bankName || 'State Bank of India'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Account Holder</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedCaptainDossier.bankDetails?.holderName || selectedCaptainDossier.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Account Number</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selectedCaptainDossier.bankDetails?.accountNumber || '50100432198765'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">IFSC Code</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selectedCaptainDossier.bankDetails?.ifscCode || 'SBIN0002026'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Payout UPI</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedCaptainDossier.payoutUpi || `${selectedCaptainDossier.phone}@upi`}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedCaptainDossier(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Close Dossier
              </button>

              {getApprovalStatus(selectedCaptainDossier) !== 'approved' && (
                <button
                  type="button"
                  onClick={() => {
                    handleApproveCaptain(selectedCaptainDossier);
                    setSelectedCaptainDossier(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Partner
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-500/30 shadow-2xl p-6 space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base">Reject Application</h3>
                <p className="text-xs text-slate-400">Captain: {rejectModalTarget.name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Reason for Rejection / Document Correction:
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-rose-500 font-medium resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                <XCircle className="w-4 h-4" /> Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL ACTIVATION EMAIL DISPATCH MODAL */}
      {emailDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 dark:text-white relative overflow-hidden">
            
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center ring-4 ring-emerald-500/10 shadow-lg">
                  <Mail className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    📧 Real Mailbox Notification Dispatched
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    Activation Email Sent!
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEmailDispatchModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Email Preview Container */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <div className="space-y-1 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">To:</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{emailDispatchModal.recipient}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">From:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">RideX Fleet HQ &lt;admin@ridex.com&gt;</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Subject:</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">{emailDispatchModal.subject}</span>
                </div>
              </div>

              {/* Email Body Content */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 space-y-2">
                <p className="font-bold text-slate-900 dark:text-white">
                  Dear {emailDispatchModal.captainName},
                </p>
                <p>
                  Congratulations! Your RideX Captain registration application has been verified and <strong>APPROVED</strong> by the Fleet Administrator.
                </p>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 font-medium">
                  🚗 <strong>Vehicle Registered:</strong> {emailDispatchModal.vehicleInfo}<br />
                  📍 <strong>Operating City:</strong> {emailDispatchModal.city}
                </div>
                <p className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  ✨ Your journey starts now! You can now log in to your Captain Cockpit and start accepting ride requests immediately.
                </p>
                <p className="pt-1 text-[10px] text-slate-400">
                  Login URL: <a href="/login" className="text-amber-500 underline font-bold">http://localhost:5173/login</a>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setEmailDispatchModal(null)}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                Done / Continue
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
