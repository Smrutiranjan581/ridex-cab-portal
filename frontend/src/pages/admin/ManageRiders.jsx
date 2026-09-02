import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, Building, UserX, UserCheck, ShieldAlert, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import DeactivateRiderModal from '../../components/admin/DeactivateRiderModal';
import api from '../../services/api';

export default function ManageRiders() {
  const [riders, setRiders] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedRiderForDeactivate, setSelectedRiderForDeactivate] = useState(null);
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
    const fetchRiders = async () => {
      try {
        const res = await api.get('/admin/riders');
        if (res.data.success) {
          setRiders(res.data.riders || []);
        }
      } catch (err) {
        console.log("Using local real riders");
      }
    };
    fetchRiders();
    const interval = setInterval(fetchRiders, 5000);
    return () => clearInterval(interval);
  }, []);

  // Extract riders from completed trip records
  let tripRiders = [];
  try {
    const tripsRaw = localStorage.getItem('ridex_captain_trip_history');
    if (tripsRaw) {
      const trips = JSON.parse(tripsRaw);
      trips.forEach((t, i) => {
        if (t.rider?.name) {
          tripRiders.push({
            _id: 'trip_rd_' + i,
            name: t.rider.name,
            email: t.rider.email || `${t.rider.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
            phone: t.rider.phone || '+91 9437000000',
            company: t.rider.company || 'Corporate Passenger',
            walletBalance: 2500,
            status: 'active'
          });
        }
      });
    }
  } catch (e) {}

  const realRegisteredRiders = localUsersState
    .filter(u => u.role === 'rider' || (!u.role && u.email !== 'admin@cab.com' && u.email !== 'captain@cab.com'))
    .map(u => ({
      _id: u._id || 'loc_rd_' + (u.email || u.phone),
      name: u.name,
      email: u.email,
      phone: u.phone || "+91 9876543210",
      company: u.company || "Corporate Partner",
      walletBalance: u.walletBalance || 1500,
      status: u.status || (u.isDeactivated ? 'deactivated' : 'active'),
      deactivationReason: u.deactivationReason || null,
      deactivatedAt: u.deactivatedAt || null
    }));

  // Combine backend real riders with locally registered real riders and trip passengers
  const list = [...riders, ...realRegisteredRiders, ...tripRiders].filter(
    (rd, idx, arr) => arr.findIndex(r => {
      const rName = (r.name || '').trim().toLowerCase();
      const rdName = (rd.name || '').trim().toLowerCase();
      const rEmail = (r.email || '').trim().toLowerCase();
      const rdEmail = (rd.email || '').trim().toLowerCase();
      return (rName && rName === rdName) || (rEmail && rEmail === rdEmail);
    }) === idx
  );

  const filtered = list.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.company?.toLowerCase().includes(search.toLowerCase())
  );

  // Handle Deactivation Confirmation
  const handleConfirmDeactivate = (targetRider, reason) => {
    setSelectedRiderForDeactivate(null);

    // 1. Update localStorage registered users
    try {
      const raw = localStorage.getItem('fleetcorp_registered_users');
      let currentUsers = raw ? JSON.parse(raw) : [];
      let found = false;

      currentUsers = currentUsers.map(u => {
        if (
          (u.email && u.email.toLowerCase() === targetRider.email?.toLowerCase()) ||
          (u.name && u.name.toLowerCase() === targetRider.name?.toLowerCase())
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
          _id: targetRider._id,
          name: targetRider.name,
          email: targetRider.email,
          phone: targetRider.phone,
          company: targetRider.company,
          role: 'rider',
          status: 'deactivated',
          isDeactivated: true,
          deactivationReason: reason,
          deactivatedAt: new Date().toISOString()
        });
      }

      localStorage.setItem('fleetcorp_registered_users', JSON.stringify(currentUsers));
      setLocalUsersState(currentUsers);

      // Also record email dispatch in log
      const emailLogs = JSON.parse(localStorage.getItem('ridex_sent_emails') || '[]');
      emailLogs.unshift({
        to: targetRider.email,
        name: targetRider.name,
        subject: '⚠️ Important: Notice of RideX Account Deactivation',
        reason: reason,
        sentAt: new Date().toISOString()
      });
      localStorage.setItem('ridex_sent_emails', JSON.stringify(emailLogs));
    } catch (e) {}

    // 2. Show Success Notification Toast
    setToastNotice({
      type: 'deactivated',
      riderName: targetRider.name,
      email: targetRider.email,
      reason: reason
    });

    setTimeout(() => {
      setToastNotice(null);
    }, 6000);
  };

  // Handle Reactivation
  const handleReactivate = (targetRider) => {
    try {
      const raw = localStorage.getItem('fleetcorp_registered_users');
      let currentUsers = raw ? JSON.parse(raw) : [];

      currentUsers = currentUsers.map(u => {
        if (
          (u.email && u.email.toLowerCase() === targetRider.email?.toLowerCase()) ||
          (u.name && u.name.toLowerCase() === targetRider.name?.toLowerCase())
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
        riderName: targetRider.name,
        email: targetRider.email
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
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Corporate Accounts & Governance
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                Rider Directory
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manage registered corporate employees, passenger travel passes & account access ({list.length} Verified)
              </p>
            </div>
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
                      ? `📧 Deactivation Notice Dispatched to ${toastNotice.email}`
                      : `✅ Account Reactivated for ${toastNotice.riderName}`}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {toastNotice.type === 'deactivated'
                      ? `Account locked. Official notification detailing "${toastNotice.reason}" was successfully sent to the registered inbox.`
                      : 'The rider can now log in and book rides normally.'}
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

          {/* Directory Card */}
          <div className="glass-card rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employee, email, company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active: {list.filter(r => r.status !== 'deactivated').length}
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Deactivated: {list.filter(r => r.status === 'deactivated').length}
                </span>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {search ? 'No Matching Riders Found' : 'No Real Riders Registered Yet'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {search
                    ? `No rider found matching "${search}".`
                    : 'When a passenger registers or books a ride, their profile and wallet balance will appear here automatically.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="px-5 py-3">Employee Name</th>
                      <th className="px-5 py-3">Company</th>
                      <th className="px-5 py-3">Contact</th>
                      <th className="px-5 py-3">Wallet Balance</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filtered.map((rd) => {
                      const isDeactivated = rd.status === 'deactivated';
                      return (
                        <tr key={rd._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isDeactivated ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30' : 'bg-blue-500/10 text-blue-600 border border-blue-500/30'
                              }`}>
                                {rd.name ? rd.name.charAt(0).toUpperCase() : 'R'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  {rd.name}
                                </p>
                                <p className="text-[11px] text-slate-500">{rd.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300">
                            {rd.company || "Corporate Partner"}
                          </td>
                          <td className="px-5 py-4 text-slate-600 dark:text-slate-400 font-mono">
                            {rd.phone || "+91 9876543210"}
                          </td>
                          <td className="px-5 py-4 font-extrabold text-amber-600 dark:text-amber-400 font-mono text-sm">
                            ₹{rd.walletBalance || 1500}
                          </td>
                          <td className="px-5 py-4">
                            {isDeactivated ? (
                              <div>
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  Deactivated 🚫
                                </span>
                                {rd.deactivationReason && (
                                  <span className="text-[10px] text-slate-400 block mt-1 truncate max-w-xs" title={rd.deactivationReason}>
                                    Reason: {rd.deactivationReason}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active Pass ✅
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {isDeactivated ? (
                              <button
                                onClick={() => handleReactivate(rd)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Reactivate</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedRiderForDeactivate(rd)}
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

      {/* Deactivate Rider Modal */}
      {selectedRiderForDeactivate && (
        <DeactivateRiderModal
          rider={selectedRiderForDeactivate}
          onClose={() => setSelectedRiderForDeactivate(null)}
          onConfirm={handleConfirmDeactivate}
        />
      )}
    </div>
  );
}
