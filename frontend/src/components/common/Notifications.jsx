import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Car, AlertCircle, Clock, X, DollarSign, Landmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Notifications() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const defaultNotifications = user?.role === 'captain' ? [
    {
      id: 'd1',
      title: "Welcome to RideX Captain Fleet",
      desc: "Your captain credentials and commercial vehicle are active.",
      time: "Recent",
      icon: CheckCircle2,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40"
    }
  ] : [
    {
      id: 'd1',
      title: "Captain Assigned",
      desc: "Rajesh Mohapatra (Swift Dzire OD-02-BA-9876) is on the way.",
      time: "2 mins ago",
      icon: Car,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40"
    },
    {
      id: 'd2',
      title: "Trip Completed",
      desc: "Your ride FLT-9042 was completed. Invoice is ready.",
      time: "1 hour ago",
      icon: CheckCircle2,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
    }
  ];

  const [notifications, setNotifications] = useState(defaultNotifications);

  const loadNotifications = () => {
    if (!user) return;
    try {
      const notifKey = `ridex_user_notifications_${(user.email || user.phone || '').toLowerCase()}`;
      const stored = localStorage.getItem(notifKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) {
          const formatted = parsed.map(n => ({
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
          }));
          setNotifications([...formatted, ...defaultNotifications]);
          return;
        }
      }
      setNotifications(defaultNotifications);
    } catch (e) {
      setNotifications(defaultNotifications);
    }
  };

  useEffect(() => {
    loadNotifications();
    window.addEventListener('storage', loadNotifications);

    let channel;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('ridex_dispatch_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'PAYOUT_APPROVED' || event.data?.type === 'CAPTAIN_STATUS_CHANGE') {
          loadNotifications();
        }
      };
    }

    return () => {
      window.removeEventListener('storage', loadNotifications);
      if (channel) channel.close();
    };
  }, [user]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
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
                {notifications.length} New
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
                  onClick={() => setIsOpen(false)}
                  className="py-3 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors cursor-pointer"
                >
                  <div className={`p-2 rounded-xl shrink-0 h-fit ${item.color}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> {item.time}
                    </span>
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
