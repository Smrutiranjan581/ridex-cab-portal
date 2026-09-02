import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  DollarSign,
  Settings,
  Navigation,
  FileText,
  Home,
  ArrowLeft,
  UserCheck,
  Headphones
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const role = user?.role || 'rider';

  // Live count for approvals, payouts & support tickets
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [pendingPayoutsCount, setPendingPayoutsCount] = useState(0);
  const [pendingTicketsCount, setPendingTicketsCount] = useState(0);

  useEffect(() => {
    const checkCounts = () => {
      try {
        const usersRaw = localStorage.getItem('fleetcorp_registered_users');
        if (usersRaw) {
          const users = JSON.parse(usersRaw);
          const pendingCaps = users.filter(u => u.role === 'captain' && (u.isApproved === false || u.status === 'pending_approval'));
          setPendingApprovalsCount(pendingCaps.length);
        }

        const payoutsRaw = localStorage.getItem('ridex_payout_requests');
        if (payoutsRaw) {
          const payouts = JSON.parse(payoutsRaw);
          const pendingPays = payouts.filter(p => p.status === 'pending_admin_approval' && p.id !== 'PAY-891024' && p.captainId !== 'cap_demo_1');
          setPendingPayoutsCount(pendingPays.length);
        }

        const ticketsRaw = localStorage.getItem('ridex_support_tickets');
        if (ticketsRaw) {
          const tickets = JSON.parse(ticketsRaw);
          const pendingTcks = tickets.filter(t => t.status !== 'resolved');
          setPendingTicketsCount(pendingTcks.length);
        }
      } catch (e) {}
    };

    checkCounts();
    window.addEventListener('storage', checkCounts);

    let channel;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('ridex_dispatch_channel');
      channel.onmessage = () => checkCounts();
    }

    return () => {
      window.removeEventListener('storage', checkCounts);
      if (channel) channel.close();
    };
  }, []);

  const menuConfig = {
    rider: [
      { name: 'Book a Ride', path: '/rider/book', icon: Car },
      { name: 'My Rides', path: '/rider/my-rides', icon: Clock },
      { name: 'Live GPS Radar', path: '/rider/track/demo', icon: Navigation }
    ],
    captain: [
      { name: 'Captain Cockpit', path: '/captain', icon: LayoutDashboard },
      { name: 'Trip History', path: '/captain/trips', icon: Clock }
    ],
    admin: [
      { name: 'Executive Overview', path: '/admin', icon: LayoutDashboard },
      { 
        name: 'Captain Register Approval', 
        path: '/admin/approvals', 
        icon: UserCheck, 
        badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
        badgeColor: 'bg-amber-500 text-slate-950'
      },
      { 
        name: 'Captain Payments', 
        path: '/admin/captain-payments', 
        icon: DollarSign,
        badge: pendingPayoutsCount > 0 ? pendingPayoutsCount : null,
        badgeColor: 'bg-emerald-500 text-white'
      },
      { 
        name: 'Help & Support Desk', 
        path: '/admin/support', 
        icon: Headphones,
        badge: pendingTicketsCount > 0 ? pendingTicketsCount : null,
        badgeColor: 'bg-rose-500 text-white'
      },
      { name: 'Manage Captains', path: '/admin/captains', icon: ShieldCheck },
      { name: 'Rider Directory', path: '/admin/riders', icon: Users }
    ]
  };

  const navItems = menuConfig[role] || menuConfig.rider;

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl p-4 min-h-[calc(100vh-4rem)] transition-colors">
      <div className="space-y-4">
        {/* Back to Home Quick Action Button (For Rider and Captain only) */}
        {role !== 'admin' && (
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-amber-500 hover:text-slate-950 dark:hover:bg-amber-500 dark:hover:text-slate-950 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all shadow-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home Page</span>
          </Link>
        )}

        {/* User Profile Card (For Rider and Captain only - hidden for Admin) */}
        {role !== 'admin' && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20">
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                alt={user?.name}
                className="w-11 h-11 rounded-xl object-cover ring-2 ring-amber-500 shrink-0"
              />
              <div className="overflow-hidden">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{user?.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.company || user?.email}</p>
                <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {role} Account
                </span>
              </div>
            </div>
            {role === 'rider' && (
              <div className="mt-3 pt-3 border-t border-amber-500/10 flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Wallet Balance:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">₹{user?.walletBalance || 1500}</span>
              </div>
            )}
          </div>
        )}

        {/* Main Navigation Links */}
        <nav className="space-y-1.5">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Main Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/rider' || item.path === '/captain' || item.path === '/admin'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 translate-x-1 font-extrabold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Area with version (Sign out removed) */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          RideX Enterprise v2.4
        </span>
      </div>
    </aside>
  );
}
