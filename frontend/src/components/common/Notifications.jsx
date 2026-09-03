import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, CheckCircle2, Car, AlertCircle, Clock, X, DollarSign, 
  Landmark, UserCheck, ShieldCheck, Headphones, Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Notifications() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const prevPendingCountRef = useRef(0);

  // Web Audio alert chime
  const playNotifChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  // Close dropdown when clicking or tapping outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async (triggerSound = false) => {
    if (!user) return;

    if (user.role === 'admin') {
      const adminNotifs = [];
      let pendingCapsList = [];

      // 1. Fetch live pending captains from Cloud Backend API
      try {
        const res = await api.get('/admin/captains');
        if (res.data?.success && Array.isArray(res.data.captains)) {
          const apiCaps = res.data.captains;
          const pending = apiCaps.filter(c => {
            const isApproved = c.isApproved === true || c.status === 'available' || c.status === 'active' || c.status === 'online';
            const isRejected = c.isRejected === true || c.status === 'rejected';
            return !isApproved && !isRejected;
          });
          pendingCapsList = pending.map(c => {
            const u = c.user || c;
            return {
              id: 'app_api_' + (u._id || c._id || u.phone),
              title: `🚨 Captain KYC Pending: ${u.name || 'New Driver'}`,
              desc: `${c.vehicle?.category?.toUpperCase() || 'VEHICLE'} (${c.vehicle?.numberPlate || 'OD-02-APPLIED'}) • ${u.phone || ''} awaiting approval`,
              time: 'Action Required',
              icon: UserCheck,
              color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border border-amber-500/20',
              link: '/admin/approvals',
              isUrgent: true
            };
          });
        }
      } catch (e) {}

      // 2. Fallback check local registered captains (avoiding duplicates)
      try {
        const usersRaw = localStorage.getItem('fleetcorp_registered_users');
        if (usersRaw) {
          const users = JSON.parse(usersRaw);
          const pendingLocal = users.filter(u => u.role === 'captain' && (u.isApproved === false || u.status === 'pending_approval'));
          pendingLocal.forEach(cap => {
            const alreadyInList = pendingCapsList.some(p => p.id.includes(cap._id || cap.phone));
            if (!alreadyInList) {
              pendingCapsList.push({
                id: 'app_loc_' + (cap._id || cap.phone),
                title: `🚨 Captain KYC Pending: ${cap.name}`,
                desc: `${cap.vehicleDetails?.category?.toUpperCase() || 'VEHICLE'} (${cap.vehicleDetails?.numberPlate || 'OD-02-APPLIED'}) • ${cap.city || 'Bhubaneswar'} awaiting approval`,
                time: 'Action Required',
                icon: UserCheck,
                color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border border-amber-500/20',
                link: '/admin/approvals',
                isUrgent: true
              });
            }
          });
        }
      } catch (e) {}

      adminNotifs.push(...pendingCapsList);

      // Play chime if new pending captain arrived
      if (pendingCapsList.length > prevPendingCountRef.current && prevPendingCountRef.current > 0) {
        playNotifChime();
      }
      prevPendingCountRef.current = pendingCapsList.length;

      // 2. Live Pending Payouts
      try {
        const payoutsRaw = localStorage.getItem('ridex_payout_requests');
        if (payoutsRaw) {
          const payouts = JSON.parse(payoutsRaw);
          const pendingPays = payouts.filter(p => p.status === 'pending_admin_approval' && p.id !== 'PAY-891024');
          pendingPays.forEach(p => {
            adminNotifs.push({
              id: 'pay_' + p.id,
              title: `💰 Payout Request: ₹${p.amount}`,
              desc: `Captain ${p.captainName} requested 15-min bank withdrawal`,
              time: 'Pending Review',
              icon: Landmark,
              color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20',
              link: '/admin/captain-payments',
              isUrgent: true
            });
          });
        }
      } catch (e) {}

      // 3. System Status
      adminNotifs.push({
        id: 'adm_sys',
        title: "RideX Command Center Active",
        desc: "All dispatch channels and live telemetry radar are operating normally.",
        time: "Online",
        icon: ShieldCheck,
        color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40",
        link: '/admin'
      });

      setNotifications(adminNotifs);
      if (triggerSound) playNotifChime();
      return;
    }

    // Role: Captain
    if (user.role === 'captain') {
      const capNotifs = [];
      try {
        const notifKey = `ridex_user_notifications_${(user.email || user.phone || '').toLowerCase()}`;
        const stored = localStorage.getItem(notifKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.forEach(n => {
            capNotifs.push({
              id: n.id || Math.random(),
              title: n.title,
              desc: n.desc,
              time: n.time || (n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'),
              icon: n.type === 'payout' ? Landmark : n.type === 'payout_rejected' ? AlertCircle : CheckCircle2,
              color: n.type === 'payout' 
                ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40" 
                : n.type === 'payout_rejected'
                ? "text-rose-500 bg-rose-50 dark:bg-rose-950/40"
                : "text-amber-500 bg-amber-50 dark:bg-amber-950/40"
            });
          });
        }
      } catch (e) {}

      capNotifs.push({
        id: 'cap_welcome',
        title: "RideX Captain Cockpit Ready",
        desc: "Toggle Duty Online to receive instant passenger ride requests.",
        time: "Active",
        icon: CheckCircle2,
        color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40"
      });

      setNotifications(capNotifs);
      if (triggerSound) playNotifChime();
      return;
    }

    // Role: Rider
    const riderNotifs = [
      {
        id: 'rd1',
        title: "RideX Fast Commute Active",
        desc: "Book Bike Taxi, Auto, or Cabs Prime with zero surge pricing.",
        time: "Active",
        icon: Car,
        color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40",
        link: '/rider/book'
      }
    ];
    setNotifications(riderNotifs);
  };

  useEffect(() => {
    loadNotifications(false);
    const interval = setInterval(() => {
      loadNotifications(true);
    }, 5000);

    const handleStorage = () => loadNotifications(true);
    window.addEventListener('storage', handleStorage);

    let channel;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('ridex_dispatch_channel');
      channel.onmessage = (event) => {
        const t = event.data?.type;
        if (t === 'NEW_CAPTAIN_APPLICATION' || t === 'CAPTAIN_STATUS_CHANGE' || t === 'PAYOUT_APPROVED' || t === 'NEW_DISPATCH_REQUEST') {
          loadNotifications(true);
        }
      };
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.close();
    };
  }, [user]);

  const handleNotificationClick = (item) => {
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const urgentCount = notifications.filter(n => n.isUrgent).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm focus:outline-none cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {urgentCount > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-rose-500 text-white font-black text-[10px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {urgentCount}
          </span>
        ) : (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Bell className="w-4 h-4 text-amber-500" /> Notifications
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                {notifications.length} Active
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto mt-1">
            {notifications.map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`py-3 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-2.5 transition-all cursor-pointer ${item.isUrgent ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''}`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 h-fit ${item.color}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.time}
                      </span>
                      {item.link && (
                        <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 hover:underline">
                          View Details ➔
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
