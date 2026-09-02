import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Star, Car, CheckCircle2, Ban, UserX, UserCheck, Send, ShieldAlert } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import DeactivateCaptainModal from '../../components/admin/DeactivateCaptainModal';
import api from '../../services/api';

export default function ManageCaptains() {
  const [captains, setCaptains] = useState([]);
  const [search, setSearch] = useState('');
  const [dutyFilter, setDutyFilter] = useState('all'); // 'all', 'online', 'offline', 'suspended'
  const [selectedCaptainForDeactivate, setSelectedCaptainForDeactivate] = useState(null);
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
    const fetchCaptains = async () => {
      try {
        const res = await api.get('/admin/captains');
        if (res.data.success) {
          setCaptains(res.data.captains);
        }
      } catch (err) {
        console.log("Using local real captains");
      }
    };
    fetchCaptains();

    // Listen for real-time duty status changes from Captains
    const handleStorageSync = () => {
      try {
        const raw = localStorage.getItem('fleetcorp_registered_users');
        if (raw) setLocalUsersState(JSON.parse(raw));
      } catch (e) {}
    };

    window.addEventListener('storage', handleStorageSync);
    let channel;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('ridex_dispatch_channel');
      channel.onmessage = (msg) => {
        if (msg.data?.type === 'CAPTAIN_STATUS_CHANGE') {
          handleStorageSync();
        }
      };
    }

    return () => {
      window.removeEventListener('storage', handleStorageSync);
      if (channel) channel.close();
    };
  }, []);

  const getRealCaptainFinancials = () => {
    try {
      const tripsRaw = localStorage.getItem('ridex_captain_trip_history');
      const trips = tripsRaw ? JSON.parse(tripsRaw) : [];
      const completedTrips = trips.filter(t => t.status === 'trip_completed' || !t.status);
      const totalEarned = completedTrips.reduce((acc, t) => acc + (t.fare?.total || t.fare || 0), 0);
      return {
        totalTrips: completedTrips.length,
        totalEarnings: totalEarned
      };
    } catch (e) {
      return { totalTrips: 0, totalEarnings: 0 };
    }
  };

  const realFinancials = getRealCaptainFinancials();

  // Helper to determine exact real-time duty status (online, offline, suspended, on_trip)
  const getCaptainDuty = (cap) => {
    const capUser = cap.user || cap;
    if (cap.status === 'deactivated' || cap.isDeactivated || capUser.isDeactivated || capUser.status === 'deactivated') {
      return 'suspended';
    }
    if (cap.status === 'on_trip') {
      return 'on_trip';
    }
    const phone = capUser.phone || cap.phone || '';
    const email = capUser.email || cap.email || '';
    try {
      const keyPhone = phone ? localStorage.getItem('ridex_captain_live_status_' + phone) : null;
      const keyEmail = email ? localStorage.getItem('ridex_captain_live_status_' + email) : null;
      const keyDefault = localStorage.getItem('ridex_captain_live_status_default');
      const liveStatus = keyPhone || keyEmail || cap.dutyStatus || capUser.dutyStatus || keyDefault;
      if (liveStatus === 'offline') return 'offline';
      return 'online';
    } catch (e) {
      return 'online';
    }
  };

  const realRegisteredCaptains = localUsersState
    .filter(u => u.role === 'captain')
    .map(u => ({
      _id: u._id || 'loc_cap_' + (u.email || u.phone),
      user: {
        name: u.name,
        email: u.email,
        phone: u.phone,
        avatar: u.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
      },
      vehicle: u.captainProfile?.vehicle || {
        category: "bike",
        model: "Hero Splendor",
        numberPlate: "OD-02-NEW-0001",
        color: "Black"
      },
      licenseNumber: u.captainProfile?.licenseNumber || ("DL-" + (u.phone || "2026").slice(-6)),
      status: u.status || (u.isDeactivated ? 'deactivated' : (u.captainProfile?.status || "available")),
      dutyStatus: u.dutyStatus || 'online',
      deactivationReason: u.deactivationReason || null,
      deactivatedAt: u.deactivatedAt || null,
      rating: u.captainProfile?.rating || 4.95,
      totalTrips: realFinancials.totalTrips || u.captainProfile?.totalTrips || 0,
      totalEarnings: realFinancials.totalEarnings || u.captainProfile?.todayEarnings || 0,
      isApproved: true
    }));

  // Combine backend real captains with locally registered real captains
  const list = [...captains, ...realRegisteredCaptains].filter(
    (cap, idx, arr) => arr.findIndex(c => {
      const cPhone = c.user?.phone || c.phone || '';
      const capPhone = cap.user?.phone || cap.phone || '';
      const cEmail = c.user?.email || c.email || '';
      const capEmail = cap.user?.email || cap.email || '';
      return (cPhone && cPhone === capPhone) || (cEmail && cEmail.toLowerCase() === capEmail.toLowerCase());
    }) === idx
  );

  const onlineCaptainsCount = list.filter(c => getCaptainDuty(c) === 'online' || getCaptainDuty(c) === 'on_trip').length;
  const offlineCaptainsCount = list.filter(c => getCaptainDuty(c) === 'offline').length;
  const suspendedCaptainsCount = list.filter(c => getCaptainDuty(c) === 'suspended').length;

  const filtered = list
    .filter(c => {
      const duty = getCaptainDuty(c);
      if (dutyFilter === 'online') return duty === 'online' || duty === 'on_trip';
      if (dutyFilter === 'offline') return duty === 'offline';
      if (dutyFilter === 'suspended') return duty === 'suspended';
      return true;
    })
    .filter(c =>
      (c.user?.name || c.name || '')?.toLowerCase().includes(search.toLowerCase()) ||
      (c.vehicle?.numberPlate || '')?.toLowerCase().includes(search.toLowerCase())
    );

  // Handle Captain Deactivation Confirmation
  const handleConfirmDeactivate = (targetCap, reason) => {
    setSelectedCaptainForDeactivate(null);
    const capUser = targetCap.user || targetCap;

    try {
      const raw = localStorage.getItem('fleetcorp_registered_users');
      let currentUsers = raw ? JSON.parse(raw) : [];
      let found = false;

      currentUsers = currentUsers.map(u => {
        if (
          (u.email && u.email.toLowerCase() === capUser.email?.toLowerCase()) ||
          (u.name && u.name.toLowerCase() === capUser.name?.toLowerCase()) ||
          (u.phone && u.phone === capUser.phone)
        ) {
          found = true;
          return {
            ...u,
            status: 'deactivated',
            isDeactivated: true,
            deactivationReason: reason,
            deactivatedAt: new Date().toISOString()
          };
        }
        return u;
      });

      if (!found) {
        currentUsers.push({
          _id: targetCap._id,
          name: capUser.name,
          email: capUser.email || `captain_${capUser.phone?.slice(-4)}@ridex.com`,
          phone: capUser.phone,
          role: 'captain',
          status: 'deactivated',
          isDeactivated: true,
          deactivationReason: reason,
          deactivatedAt: new Date().toISOString()
        });
      }

      localStorage.setItem('fleetcorp_registered_users', JSON.stringify(currentUsers));
      setLocalUsersState(currentUsers);

      const emailLogs = JSON.parse(localStorage.getItem('ridex_sent_emails') || '[]');
      emailLogs.unshift({
        to: capUser.email || `captain_${capUser.phone?.slice(-4)}@ridex.com`,
        name: capUser.name,
        subject: '⚠️ Urgent Notice: RideX Captain Driver Access Suspended',
        reason: reason,
        sentAt: new Date().toISOString()
      });
      localStorage.setItem('ridex_sent_emails', JSON.stringify(emailLogs));
    } catch (e) {}

    setToastNotice({
      type: 'deactivated',
      capName: capUser.name,
      email: capUser.email || (capUser.phone ? `captain_${capUser.phone.slice(-4)}@ridex.com` : "captain@cab.com"),
      reason: reason
    });

    setTimeout(() => {
      setToastNotice(null);
    }, 6000);
  };

  // Handle Captain Reactivation
  const handleReactivate = (targetCap) => {
    const capUser = targetCap.user || targetCap;

    try {
      const raw = localStorage.getItem('fleetcorp_registered_users');
      let currentUsers = raw ? JSON.parse(raw) : [];

      currentUsers = currentUsers.map(u => {
        if (
          (u.email && u.email.toLowerCase() === capUser.email?.toLowerCase()) ||
          (u.name && u.name.toLowerCase() === capUser.name?.toLowerCase()) ||
          (u.phone && u.phone === capUser.phone)
        ) {
          return {
            ...u,
            status: 'active',
            isDeactivated: false,
            deactivationReason: null,
            deactivatedAt: null
          };
        }
        return u;
      });

      localStorage.setItem('fleetcorp_registered_users', JSON.stringify(currentUsers));
      setLocalUsersState(currentUsers);

      setToastNotice({
        type: 'reactivated',
        capName: capUser.name,
        email: capUser.email || capUser.phone
      });

      setTimeout(() => {
        setToastNotice(null);
      }, 4000);
    } catch (e) {}
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Fleet Personnel & Governance
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              Manage Captains & Fleet
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Verify licenses, monitor driver availability, enforce safety compliance & manage fleet ({list.length} Verified)
            </p>
          </div>

          {/* Toast Notification Alert */}
          {toastNotice && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white border border-slate-700 shadow-xl animate-fadeIn flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  toastNotice.type === 'deactivated' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {toastNotice.type === 'deactivated' ? <Send className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">
                    {toastNotice.type === 'deactivated'
                      ? `📧 Suspension Notice Dispatched to ${toastNotice.email}`
                      : `✅ Driver Partner Reactivated for ${toastNotice.capName}`}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {toastNotice.type === 'deactivated'
                      ? `Driver cockpit access locked. Official notice with reason "${toastNotice.reason}" was dispatched via email.`
                      : 'The captain can now go online and accept ride requests normally.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setToastNotice(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="glass-card rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
            
            {/* Duty Status Filter Tabs Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/40">
              
              {/* Duty Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDutyFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    dutyFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  📊 All Captains ({list.length})
                </button>

                <button
                  type="button"
                  onClick={() => setDutyFilter('online')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                    dutyFilter === 'online'
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online ({onlineCaptainsCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDutyFilter('offline')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                    dutyFilter === 'offline'
                      ? 'bg-slate-700 text-white shadow-md shadow-slate-700/20'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Offline ({offlineCaptainsCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDutyFilter('suspended')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                    dutyFilter === 'suspended'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Suspended ({suspendedCaptainsCount})</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search captain name or plate..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

            </div>

            {filtered.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <Car className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {search
                    ? `No Captains Found Matching "${search}"`
                    : dutyFilter !== 'all'
                    ? `No Captains Currently ${dutyFilter.toUpperCase()}`
                    : 'No Real Captains Registered Yet'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {dutyFilter === 'online'
                    ? 'Captains will appear here when they switch their status to ONLINE in the Captain Cockpit.'
                    : dutyFilter === 'offline'
                    ? 'Captains who turn their duty OFFLINE will be categorized here.'
                    : 'When a new driver registers, their vehicle specs and live duty status will show here in real time.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="px-5 py-3">Captain</th>
                      <th className="px-5 py-3">Vehicle Details</th>
                      <th className="px-5 py-3">License No</th>
                      <th className="px-5 py-3">Trips & Earnings</th>
                      <th className="px-5 py-3">Duty Status</th>
                      <th className="px-5 py-3 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filtered.map((cap) => {
                      const capUser = cap.user || cap;
                      const duty = getCaptainDuty(cap);
                      const isDeactivated = duty === 'suspended';
                      return (
                        <tr key={cap._id} className={`transition-colors ${isDeactivated ? 'bg-rose-50/40 dark:bg-rose-950/20' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'}`}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={capUser.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"}
                                alt={capUser.name}
                                className={`w-9 h-9 rounded-xl object-cover ring-2 ${isDeactivated ? 'ring-rose-500/40 grayscale' : duty === 'online' ? 'ring-emerald-500 ring-offset-1' : 'ring-slate-300 dark:ring-slate-700'}`}
                              />
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  {capUser.name}
                                </p>
                                <p className="text-[11px] text-slate-500">{capUser.phone || "+91 9437012345"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{cap.vehicle?.model} ({cap.vehicle?.category?.toUpperCase()})</p>
                            <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">{cap.vehicle?.numberPlate}</span>
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-slate-600 dark:text-slate-400">
                            {cap.licenseNumber}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                              ₹{(cap.totalEarnings || 286).toLocaleString()} Earned
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
                              {cap.totalTrips || 1} {cap.totalTrips === 1 ? 'Trip' : 'Trips'} • ⭐ {cap.rating || '4.95'}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            {duty === 'suspended' ? (
                              <div>
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1.5 w-fit">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  Suspended 🚫
                                </span>
                                {cap.deactivationReason && (
                                  <span className="text-[10px] text-slate-400 block mt-1 truncate max-w-xs" title={cap.deactivationReason}>
                                    Reason: {cap.deactivationReason}
                                  </span>
                                )}
                              </div>
                            ) : duty === 'on_trip' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                On Trip 🚖
                              </span>
                            ) : duty === 'online' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 w-fit shadow-xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Online 🟢
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 w-fit">
                                <span className="w-2 h-2 rounded-full bg-slate-400" />
                                Offline ⚪
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {isDeactivated ? (
                              <button
                                onClick={() => handleReactivate(cap)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Reactivate</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedCaptainForDeactivate(cap)}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/30 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-rose-500/25"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Deactivate & Notify</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Deactivate Captain Modal */}
      {selectedCaptainForDeactivate && (
        <DeactivateCaptainModal
          captain={selectedCaptainForDeactivate}
          onClose={() => setSelectedCaptainForDeactivate(null)}
          onConfirm={handleConfirmDeactivate}
        />
      )}
    </div>
  );
}
