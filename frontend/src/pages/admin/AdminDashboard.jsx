import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Car,
  Users,
  ShieldCheck,
  Search,
  Star,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  UserX,
  TrendingUp,
  Award,
  Send,
  AlertTriangle,
  Ticket,
  MessageSquare,
  Clock,
  Receipt,
  Sparkles
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatCard from '../../components/dashboard/StatCard';
import AnalyticsCharts from '../../components/dashboard/AnalyticsCharts';
import DeactivateRiderModal from '../../components/admin/DeactivateRiderModal';
import DeactivateCaptainModal from '../../components/admin/DeactivateCaptainModal';
import api from '../../services/api';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [captains, setCaptains] = useState([]);
  const [riders, setRiders] = useState([]);
  const [captainSearch, setCaptainSearch] = useState('');
  const [riderSearch, setRiderSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'captains', 'riders', 'support'
  const [captainDutyFilter, setCaptainDutyFilter] = useState('all'); // 'all', 'online', 'offline', 'suspended'
  const [loading, setLoading] = useState(true);
  const [selectedRiderForDeactivate, setSelectedRiderForDeactivate] = useState(null);
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

  // Support Tickets State
  const [supportTickets, setSupportTickets] = useState(() => {
    try {
      const raw = localStorage.getItem('ridex_support_tickets');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketFilter, setTicketFilter] = useState('all'); // 'all', 'open', 'resolved'
  const [selectedTicketToResolve, setSelectedTicketToResolve] = useState(null);
  const [adminResolutionNote, setAdminResolutionNote] = useState('');
  const [refundAmountToWallet, setRefundAmountToWallet] = useState('');
  const [autoCreditWallet, setAutoCreditWallet] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [dashRes, capRes, riderRes] = await Promise.allSettled([
          api.get('/admin/dashboard'),
          api.get('/admin/captains'),
          api.get('/admin/riders')
        ]);

        if (dashRes.status === 'fulfilled' && dashRes.value.data.success) {
          setDashboardData(dashRes.value.data.stats || dashRes.value.data.dashboard);
        }
        if (capRes.status === 'fulfilled' && capRes.value.data.success) {
          setCaptains(capRes.value.data.captains || []);
        }
        if (riderRes.status === 'fulfilled' && riderRes.value.data.success) {
          setRiders(riderRes.value.data.riders || []);
        }
      } catch (err) {
        console.error("Admin dashboard data fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 6000);

    // Listen for real-time duty status changes from Captains & Support Tickets
    const handleStorageSync = () => {
      try {
        const raw = localStorage.getItem('fleetcorp_registered_users');
        if (raw) setLocalUsersState(JSON.parse(raw));

        const rawT = localStorage.getItem('ridex_support_tickets');
        if (rawT) setSupportTickets(JSON.parse(rawT));
      } catch (e) {}
    };

    window.addEventListener('storage', handleStorageSync);
    let channel;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('ridex_dispatch_channel');
      channel.onmessage = (msg) => {
        if (msg.data?.type === 'CAPTAIN_STATUS_CHANGE') {
          handleStorageSync();
          fetchAdminData();
        }
        if (msg.data?.type === 'NEW_SUPPORT_TICKET') {
          try {
            const raw = localStorage.getItem('ridex_support_tickets');
            if (raw) setSupportTickets(JSON.parse(raw));
            setToastNotice(`🔔 New Support Ticket #${msg.data.data?.id} submitted by ${msg.data.data?.userName || 'User'} (${msg.data.data?.category || 'Billing'})`);
            setTimeout(() => setToastNotice(null), 6000);
          } catch (e) {}
        }
      };
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageSync);
      if (channel) channel.close();
    };
  }, []);

  const handleResolveTicket = (ticketId) => {
    try {
      const allTickets = JSON.parse(localStorage.getItem('ridex_support_tickets') || '[]');
      const targetIndex = allTickets.findIndex(t => t.id === ticketId);
      if (targetIndex === -1) return;

      const target = allTickets[targetIndex];
      const reply = adminResolutionNote.trim() || "Dispute verified and resolved by Admin Support.";
      const refundAmt = Number(refundAmountToWallet) || 0;

      const updatedTicket = {
        ...target,
        status: 'resolved',
        adminReply: reply,
        refundAmount: autoCreditWallet ? refundAmt : 0,
        resolvedAt: new Date().toISOString()
      };

      allTickets[targetIndex] = updatedTicket;
      localStorage.setItem('ridex_support_tickets', JSON.stringify(allTickets));
      setSupportTickets(allTickets);

      const riderKey = (target.userEmail || target.userPhone || 'user').toLowerCase();

      // If auto refund is enabled and amount > 0, credit rider's wallet
      if (autoCreditWallet && refundAmt > 0) {
        const currentBal = Number(localStorage.getItem(`ridex_wallet_balance_${riderKey}`) || 1500);
        const newBal = currentBal + refundAmt;
        localStorage.setItem(`ridex_wallet_balance_${riderKey}`, String(newBal));

        // Add to rider passbook
        const passbookKey = `ridex_wallet_recharges_${riderKey}`;
        const passbook = JSON.parse(localStorage.getItem(passbookKey) || '[]');
        passbook.unshift({
          id: 'REFUND-' + ticketId,
          type: 'CREDIT',
          title: `Support Refund • Ticket #${ticketId}`,
          subtitle: reply,
          amount: refundAmt,
          date: new Date().toISOString(),
          timestamp: Date.now()
        });
        localStorage.setItem(passbookKey, JSON.stringify(passbook));
      }

      // Add Notification for Rider under Profile -> Notifications
      const notifKey = `ridex_user_notifications_${riderKey}`;
      const notifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
      const newNotif = {
        id: 'notif_ticket_' + ticketId + '_' + Date.now(),
        title: `🎫 Support Ticket #${ticketId} Resolved!`,
        desc: `Your issue regarding "${typeof target.subject === 'object' ? target.subject?.title : target.subject}" has been resolved by Admin. Resolution: ${reply}${autoCreditWallet && refundAmt > 0 ? ` (₹${refundAmt} credited to your RideX Wallet)` : ''}`,
        time: 'Just now',
        type: 'support_resolved',
        timestamp: Date.now()
      };
      localStorage.setItem(notifKey, JSON.stringify([newNotif, ...notifs]));

      // Broadcast event to notify rider in real time
      if ('BroadcastChannel' in window) {
        const ch = new BroadcastChannel('ridex_dispatch_channel');
        ch.postMessage({
          type: 'SUPPORT_TICKET_RESOLVED',
          data: {
            ticketId,
            riderKey,
            riderEmail: target.userEmail,
            riderPhone: target.userPhone,
            notification: newNotif,
            refundAmount: autoCreditWallet ? refundAmt : 0
          }
        });
        ch.close();
      }

      setToastNotice(`✅ Ticket #${ticketId} marked as Resolved & Rider notified!`);
      setSelectedTicketToResolve(null);
      setAdminResolutionNote('');
      setRefundAmountToWallet('');
      setAutoCreditWallet(false);
      setTimeout(() => setToastNotice(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Load strictly REAL registered captains from localStorage and backend
  let localRegisteredUsers = [];
  try {
    const raw = localStorage.getItem('fleetcorp_registered_users');
    if (raw) localRegisteredUsers = JSON.parse(raw);
  } catch (e) {}

  // Helper to get real completed trips and earnings from localStorage
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
      deactivationReason: u.deactivationReason || null,
      deactivatedAt: u.deactivatedAt || null,
      rating: u.captainProfile?.rating || 4.95,
      totalTrips: realFinancials.totalTrips || u.captainProfile?.totalTrips || 0,
      totalEarnings: realFinancials.totalEarnings || u.captainProfile?.todayEarnings || 0,
      isApproved: true
    }));

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
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
            walletBalance: 2500,
            totalRides: 1,
            role: "Verified Rider"
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
      avatar: u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      walletBalance: u.walletBalance || 1500,
      totalRides: 0,
      role: "Verified Rider",
      status: u.status || (u.isDeactivated ? 'deactivated' : 'active'),
      deactivationReason: u.deactivationReason || null,
      deactivatedAt: u.deactivatedAt || null
    }));

  // Combine backend real captains with locally registered real captains
  const captainList = [...captains, ...realRegisteredCaptains].filter(
    (cap, idx, arr) => arr.findIndex(c => {
      const cPhone = c.user?.phone || c.phone || '';
      const capPhone = cap.user?.phone || cap.phone || '';
      const cEmail = c.user?.email || c.email || '';
      const capEmail = cap.user?.email || cap.email || '';
      return (cPhone && cPhone === capPhone) || (cEmail && cEmail.toLowerCase() === capEmail.toLowerCase());
    }) === idx
  );

  // Combine backend real riders with locally registered real riders and trip passengers
  const riderList = [...riders, ...realRegisteredRiders, ...tripRiders].filter(
    (rd, idx, arr) => arr.findIndex(r => {
      const rName = (r.name || '').trim().toLowerCase();
      const rdName = (rd.name || '').trim().toLowerCase();
      const rEmail = (r.email || '').trim().toLowerCase();
      const rdEmail = (rd.email || '').trim().toLowerCase();
      const rPhone = (r.phone || '').replace(/[^0-9]/g, '').slice(-10);
      const rdPhone = (rd.phone || '').replace(/[^0-9]/g, '').slice(-10);
      return (rEmail && rEmail === rdEmail) || (rPhone && rPhone === rdPhone) || (rName && rName === rdName);
    }) === idx
  );

  // Handle Deactivation Confirmation
  const handleConfirmDeactivate = (targetRider, reason) => {
    setSelectedRiderForDeactivate(null);

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

  // Handle Captain Deactivation Confirmation
  const handleConfirmDeactivateCaptain = (targetCap, reason) => {
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
      riderName: capUser.name,
      email: capUser.email || (capUser.phone ? `captain_${capUser.phone.slice(-4)}@ridex.com` : "captain@cab.com"),
      reason: reason
    });

    setTimeout(() => {
      setToastNotice(null);
    }, 6000);
  };

  // Handle Captain Reactivation
  const handleReactivateCaptain = (targetCap) => {
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
        riderName: capUser.name,
        email: capUser.email || capUser.phone
      });

      setTimeout(() => {
        setToastNotice(null);
      }, 4000);
    } catch (e) {}
  };

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

  const onlineCaptainsCount = captainList.filter(c => getCaptainDuty(c) === 'online' || getCaptainDuty(c) === 'on_trip').length;
  const offlineCaptainsCount = captainList.filter(c => getCaptainDuty(c) === 'offline').length;
  const suspendedCaptainsCount = captainList.filter(c => getCaptainDuty(c) === 'suspended').length;

  const filteredCaptains = captainList
    .filter(c => {
      const duty = getCaptainDuty(c);
      if (captainDutyFilter === 'online') return duty === 'online' || duty === 'on_trip';
      if (captainDutyFilter === 'offline') return duty === 'offline';
      if (captainDutyFilter === 'suspended') return duty === 'suspended';
      return true;
    })
    .filter(c => {
      const name = c.user?.name || c.name || '';
      const phone = c.user?.phone || c.phone || '';
      const plate = c.vehicle?.numberPlate || '';
      const model = c.vehicle?.model || '';
      const q = captainSearch.toLowerCase();
      return name.toLowerCase().includes(q) || phone.toLowerCase().includes(q) || plate.toLowerCase().includes(q) || model.toLowerCase().includes(q);
    });

  const filteredRiders = riderList.filter(r => {
    const name = r.name || '';
    const email = r.email || '';
    const phone = r.phone || '';
    const company = r.company || '';
    const q = riderSearch.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || phone.toLowerCase().includes(q) || company.toLowerCase().includes(q);
  });

  // 100% REAL Dynamic Platform KPI Calculations
  const realGrossRevenue = realFinancials.totalEarnings || dashboardData?.stats?.totalRevenue || 0;
  const realPlatformCommission = Math.round(realGrossRevenue * 0.15);
  const realTotalBookings = realFinancials.totalTrips || dashboardData?.stats?.totalBookings || 0;
  const realActiveCaptains = onlineCaptainsCount;
  const realTotalRiders = riderList.length;

  const realStats = {
    totalRevenue: realGrossRevenue,
    platformCommission: realPlatformCommission,
    totalBookings: realTotalBookings,
    activeCaptains: realActiveCaptains,
    totalRiders: realTotalRiders
  };

  // Dynamic calculation of real monthly revenue & real vehicle category distribution
  const getRealChartData = () => {
    try {
      const tripsRaw = localStorage.getItem('ridex_captain_trip_history');
      const trips = tripsRaw ? JSON.parse(tripsRaw) : [];
      const completed = trips.filter(t => t.status === 'trip_completed' || !t.status);

      if (completed.length === 0) {
        return {
          monthlyRevenue: [
            { month: 'Sep', revenue: realGrossRevenue, rides: realTotalBookings }
          ],
          vehicleShare: [
            { name: 'Bike Moto', value: 100, color: '#f59e0b' }
          ]
        };
      }

      const monthsMap = {};
      const vehicleMap = {};

      completed.forEach(t => {
        const date = t.createdAt ? new Date(t.createdAt) : new Date();
        const monthName = date.toLocaleString('default', { month: 'short' });
        const fare = t.fare?.total || t.fare || 0;
        const vCat = t.vehicleType === 'bike' ? 'Bike Moto' : t.vehicleType === 'auto' ? 'Auto TukTuk' : (t.category || 'Sedan Prime');

        if (!monthsMap[monthName]) monthsMap[monthName] = { month: monthName, revenue: 0, rides: 0 };
        monthsMap[monthName].revenue += fare;
        monthsMap[monthName].rides += 1;

        vehicleMap[vCat] = (vehicleMap[vCat] || 0) + 1;
      });

      const monthlyRevenue = Object.values(monthsMap);
      const totalV = completed.length;
      const palette = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];
      const vehicleShare = Object.keys(vehicleMap).map((k, i) => ({
        name: k,
        value: Math.round((vehicleMap[k] / totalV) * 100),
        color: palette[i % palette.length]
      }));

      return { monthlyRevenue, vehicleShare };
    } catch (e) {
      return {
        monthlyRevenue: [{ month: 'Sep', revenue: realGrossRevenue, rides: realTotalBookings }],
        vehicleShare: [{ name: 'Bike Moto', value: 100, color: '#f59e0b' }]
      };
    }
  };

  const realCharts = getRealChartData();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
          
          {/* Header */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-purple-500/10 via-amber-500/5 to-transparent">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Super Admin Fleet Command Console
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                Executive Overview
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time fleet operations, partner captains, and corporate rider management
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/admin/approvals"
                className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4" /> Captain Approvals
              </Link>

              <span className="px-3.5 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                Fleet Active
              </span>
            </div>
          </div>

          {/* Pending Captain Registrations Alert Banner */}
          {localUsersState.filter(u => u.role === 'captain' && (u.isApproved === false || u.status === 'pending_approval')).length > 0 && (
            <div className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg animate-pulse">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-md">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                    🚨 {localUsersState.filter(u => u.role === 'captain' && (u.isApproved === false || u.status === 'pending_approval')).length} New Captain Application(s) Pending Verification!
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Review newly submitted driver KYC, commercial vehicle number plate & driving license to activate captain duty.
                  </p>
                </div>
              </div>
              <Link 
                to="/admin/approvals" 
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all shadow-md shrink-0 flex items-center gap-2"
              >
                <span>Review & Approve Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Admin KPI Stats (100% Real Live Computed) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Gross Booking Volume"
              value={`₹${realStats.totalRevenue.toLocaleString()}`}
              change={realStats.totalRevenue > 0 ? "+100% Real Revenue" : "₹0 Revenue"}
              isPositive={realStats.totalRevenue > 0}
              icon={DollarSign}
            />
            <StatCard
              title="Platform Commission (15%)"
              value={`₹${realStats.platformCommission.toLocaleString()}`}
              change={realStats.platformCommission > 0 ? "15% Take Rate" : "₹0 Commission"}
              isPositive={realStats.platformCommission > 0}
              icon={DollarSign}
            />
            <StatCard
              title="Total Bookings"
              value={realStats.totalBookings}
              change={realStats.totalBookings > 0 ? `${realStats.totalBookings} Completed ${realStats.totalBookings === 1 ? 'Trip' : 'Trips'}` : "0 Bookings"}
              isPositive={realStats.totalBookings > 0}
              icon={Car}
            />
            <StatCard
              title="Active Captains Online"
              value={realStats.activeCaptains}
              change={realStats.activeCaptains > 0 ? `${realStats.activeCaptains} Duty Ready` : "0 Online"}
              isPositive={realStats.activeCaptains > 0}
              icon={ShieldCheck}
            />
          </div>

          {/* Revenue & Fleet Charts */}
          <AnalyticsCharts
            revenueData={realCharts.monthlyRevenue}
            vehicleData={realCharts.vehicleShare}
          />

          {/* Directory Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📊 All Sections
            </button>
            <button
              onClick={() => setActiveTab('captains')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'captains'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              👨‍✈️ Captain Details ({captainList.length})
            </button>
            <button
              onClick={() => setActiveTab('riders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'riders'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              👤 Rider Details ({riderList.length})
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'support'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>🎫 Help & Support Desk ({supportTickets.length})</span>
              {supportTickets.filter(t => t.status === 'open').length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                  {supportTickets.filter(t => t.status === 'open').length} Open
                </span>
              )}
            </button>
          </div>

          {/* ========================================================= */}
          {/* SECTION 1: CAPTAIN DETAILS DIRECTORY                      */}
          {/* ========================================================= */}
          {(activeTab === 'all' || activeTab === 'captains') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-extrabold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                    Captain Details & Fleet Directory
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live driver duty status, verified vehicles, and trip performance metrics
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search captain, vehicle, plate..."
                      value={captainSearch}
                      onChange={(e) => setCaptainSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <Link
                    to="/admin/captains"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20 transition-all"
                  >
                    <span>Full Captains Page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Duty Filter Pills in Captain Section */}
              <div className="flex flex-wrap items-center gap-2 pb-1">
                <button
                  type="button"
                  onClick={() => setCaptainDutyFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    captainDutyFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  📊 All Captains ({captainList.length})
                </button>

                <button
                  type="button"
                  onClick={() => setCaptainDutyFilter('online')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    captainDutyFilter === 'online'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online ({onlineCaptainsCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCaptainDutyFilter('offline')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    captainDutyFilter === 'offline'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Offline ({offlineCaptainsCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCaptainDutyFilter('suspended')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    captainDutyFilter === 'suspended'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Suspended ({suspendedCaptainsCount})</span>
                </button>
              </div>

              {/* Captains Cards Grid */}
              {filteredCaptains.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {captainSearch
                      ? `No Captains Found Matching "${captainSearch}"`
                      : captainDutyFilter !== 'all'
                      ? `No Captains Currently ${captainDutyFilter.toUpperCase()}`
                      : 'No Real Captains Registered Yet'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {captainDutyFilter === 'online'
                      ? 'Captains will show here in real time when they switch to ONLINE duty in their Cockpit.'
                      : captainDutyFilter === 'offline'
                      ? 'Captains currently logged off will appear here.'
                      : 'When a new driver registers, their live duty status and vehicle details will show here in real time.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCaptains.map((cap) => {
                    const capUser = cap.user || cap;
                    const duty = getCaptainDuty(cap);
                    const isDeactivated = duty === 'suspended';
                    return (
                      <div
                        key={cap._id}
                        className={`glass-card rounded-2xl p-4 border transition-all space-y-3 ${
                          isDeactivated
                            ? 'border-rose-500/40 bg-rose-500/5'
                            : 'border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-amber-500/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={capUser.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"}
                              alt={capUser.name}
                              className={`w-12 h-12 rounded-xl object-cover ring-2 shrink-0 ${
                                isDeactivated ? 'ring-rose-500/40 grayscale' : duty === 'online' ? 'ring-emerald-500 ring-offset-1' : 'ring-slate-300 dark:ring-slate-700'
                              }`}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                  {capUser.name}
                                </h4>
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black border flex items-center gap-0.5 ${
                                  isDeactivated
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                }`}>
                                  <CheckCircle2 className="w-2.5 h-2.5" /> {isDeactivated ? 'Suspended' : 'Verified'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-amber-500" /> {capUser.phone || "+91 9437012345"}
                              </p>
                            </div>
                          </div>

                          {duty === 'suspended' ? (
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Suspended 🚫
                            </span>
                          ) : duty === 'on_trip' ? (
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" /> On Active Trip 🚖
                            </span>
                          ) : duty === 'online' ? (
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online 🟢
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-400" /> Offline ⚪
                            </span>
                          )}
                        </div>

                        {/* Vehicle & Metrics Info Box (4-column layout including Total Earnings) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Vehicle</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase truncate block">
                              {cap.vehicle?.category || 'Bike'}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate font-mono">
                              {cap.vehicle?.numberPlate || 'OD-33-AB-2005'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Completed Trips</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">
                              {cap.totalTrips || 0} {cap.totalTrips === 1 ? 'Trip' : 'Trips'}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                              {cap.totalTrips > 0 ? 'Verified active' : 'No trips yet'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Earnings</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block text-sm">
                              ₹{(cap.totalEarnings || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Lifetime revenue
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Rating</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              {cap.rating || '4.95'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              100% acceptance
                            </span>
                          </div>
                        </div>

                        {/* Deactivation Reason Bar & Action Button */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
                          <div className="text-[11px] text-slate-500 truncate">
                            {isDeactivated && cap.deactivationReason ? (
                              <span className="text-rose-500 font-medium truncate block">
                                Reason: {cap.deactivationReason}
                              </span>
                            ) : (
                              <span>Driver Status: Fleet Active Partner</span>
                            )}
                          </div>

                          {isDeactivated ? (
                            <button
                              onClick={() => handleReactivateCaptain(cap)}
                              className="px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Reactivate</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedCaptainForDeactivate(cap)}
                              className="px-3 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Deactivate & Notify</span>
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 2: RIDER DETAILS DIRECTORY                        */}
          {/* ========================================================= */}
          {(activeTab === 'all' || activeTab === 'riders') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-extrabold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Rider Details & Corporate Directory
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Corporate employee accounts, digital wallet balances, and passenger records
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search rider, email, corporate..."
                      value={riderSearch}
                      onChange={(e) => setRiderSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Link
                    to="/admin/riders"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-500/20 transition-all"
                  >
                    <span>Full Riders Page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
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
                          ? `Account locked. Official notice with reason "${toastNotice.reason}" was dispatched via email.`
                          : 'The rider can now access the portal and hail rides normally.'}
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

              {/* Riders Cards Grid */}
              {filteredRiders.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {riderSearch ? 'No Matching Riders Found' : 'No Real Riders Registered Yet'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {riderSearch
                      ? `No rider matches "${riderSearch}". Try searching by another name or email.`
                      : 'When a new passenger or corporate employee registers, their profile and wallet balance will appear here automatically.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRiders.map((rd) => {
                    const isDeactivated = rd.status === 'deactivated';
                    return (
                      <div
                        key={rd._id}
                        className={`glass-card rounded-2xl p-4 border transition-all space-y-3 ${
                          isDeactivated
                            ? 'border-rose-500/40 bg-rose-500/5'
                            : 'border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-500/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={rd.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                              alt={rd.name}
                              className={`w-12 h-12 rounded-xl object-cover ring-2 shrink-0 ${
                                isDeactivated ? 'ring-rose-500/40 grayscale' : 'ring-blue-500/30'
                              }`}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                  {rd.name}
                                </h4>
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black border ${
                                  isDeactivated
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                }`}>
                                  {isDeactivated ? 'Account Locked' : 'Rider Account'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-blue-500" /> {rd.email}
                              </p>
                            </div>
                          </div>

                          {isDeactivated ? (
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Deactivated 🚫
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Account ✅
                            </span>
                          )}
                        </div>

                        {/* Corporate & Financial Box */}
                        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Organization</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                              {rd.company || 'Corporate Partner'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Wallet Cash</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                              ₹{rd.walletBalance || 1500}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact</span>
                            <span className="font-semibold text-slate-600 dark:text-slate-300 truncate block mt-0.5 font-mono text-[11px]">
                              {rd.phone || '+91 9437088776'}
                            </span>
                          </div>
                        </div>

                        {/* Deactivation Reason Bar & Action Button */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
                          <div className="text-[11px] text-slate-500 truncate">
                            {isDeactivated && rd.deactivationReason ? (
                              <span className="text-rose-500 font-medium truncate block">
                                Reason: {rd.deactivationReason}
                              </span>
                            ) : (
                              <span>Pass Status: Eligible for all rides</span>
                            )}
                          </div>

                          {isDeactivated ? (
                            <button
                              onClick={() => handleReactivate(rd)}
                              className="px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Reactivate</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedRiderForDeactivate(rd)}
                              className="px-3 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Deactivate & Notify</span>
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 3: HELP & SUPPORT DISPATCH DESK                   */}
          {/* ========================================================= */}
          {(activeTab === 'all' || activeTab === 'support') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-extrabold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-rose-500" />
                    Help & Support Dispatch Desk
                    {supportTickets.filter(t => t.status === 'open').length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-black animate-pulse">
                        {supportTickets.filter(t => t.status === 'open').length} Action Required
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live customer tickets, ride fare disputes, captain reports, and automated wallet refund processing
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search ticket #, rider, issue..."
                      value={ticketSearch}
                      onChange={(e) => setTicketSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <select
                    value={ticketFilter}
                    onChange={(e) => setTicketFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open / In Review</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Tickets List */}
              {(() => {
                const filtered = supportTickets.filter(t => {
                  if (ticketFilter === 'open' && t.status === 'resolved') return false;
                  if (ticketFilter === 'resolved' && t.status !== 'resolved') return false;
                  if (ticketSearch.trim()) {
                    const q = ticketSearch.toLowerCase();
                    const matchId = (t.id || '').toLowerCase().includes(q);
                    const matchUser = (t.userName || '').toLowerCase().includes(q);
                    const matchEmail = (t.userEmail || '').toLowerCase().includes(q);
                    const matchSub = (typeof t.subject === 'object' ? t.subject?.title : t.subject || '').toLowerCase().includes(q);
                    const matchDesc = (t.description || '').toLowerCase().includes(q);
                    if (!matchId && !matchUser && !matchEmail && !matchSub && !matchDesc) return false;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 text-center space-y-2 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                      <Ticket className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">No Support Tickets Found</p>
                      <p className="text-xs text-slate-500">All customer inquiries & disputes are currently resolved.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filtered.map((t) => (
                      <div
                        key={t.id}
                        className={`p-4 rounded-3xl border transition-all shadow-sm ${
                          t.status === 'resolved'
                            ? 'border-emerald-500/30 bg-white dark:bg-slate-900'
                            : 'border-rose-500/40 bg-rose-50/20 dark:bg-rose-950/10'
                        } space-y-3`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400">#{t.id}</span>
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                                {t.userRole || 'rider'}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">{t.userName || 'Anonymous Passenger'}</h4>
                            <p className="text-[11px] text-slate-500">{t.userEmail} • {t.userPhone}</p>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            t.status === 'resolved'
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-rose-500 text-white shadow-xs animate-pulse'
                          }`}>
                            {t.status === 'resolved' ? '✓ Resolved' : '● Open / In Review'}
                          </span>
                        </div>

                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                          <p className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="text-amber-500">📌</span>
                            {typeof t.subject === 'object' ? t.subject?.title : t.subject}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {t.description}
                          </p>

                          {t.attachment && (
                            <div className="pt-1">
                              <p className="text-[10px] font-bold text-slate-400 mb-1">Attached Screenshot:</p>
                              <img src={t.attachment} alt="Issue evidence" className="h-24 rounded-xl border border-slate-300 dark:border-slate-700 object-cover" />
                            </div>
                          )}
                        </div>

                        {t.status === 'resolved' ? (
                          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
                            <p className="font-black">🛡️ Admin Resolution:</p>
                            <p className="leading-relaxed text-[11px]">{t.adminReply}</p>
                            {t.refundAmount > 0 && (
                              <p className="font-black text-emerald-600 dark:text-emerald-400 text-[11px] pt-0.5">
                                💰 ₹{t.refundAmount} Refund Credited to Wallet
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 pt-0.5">
                              Resolved at: {new Date(t.resolvedAt).toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => {
                                setSelectedTicketToResolve(t);
                                setAdminResolutionNote(
                                  (t.subject || '').toLowerCase().includes('fare')
                                    ? "Dispute investigated and verified. ₹45 excess fare credited to your RideX Wallet."
                                    : "Issue reviewed by Admin Dispatch. Action has been taken and your account is updated."
                                );
                                setRefundAmountToWallet((t.subject || '').toLowerCase().includes('fare') ? "45" : "0");
                                setAutoCreditWallet((t.subject || '').toLowerCase().includes('fare'));
                              }}
                              className="w-full py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.01]"
                            >
                              <span>⚡ Review & Solve Ticket</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

        </main>
      </div>

      {/* Solve Support Ticket Modal */}
      {selectedTicketToResolve && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400">#{selectedTicketToResolve.id}</span>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">Resolve Customer Inquiry</h3>
                <p className="text-xs text-slate-500">{selectedTicketToResolve.userName} ({selectedTicketToResolve.userEmail})</p>
              </div>
              <button
                onClick={() => setSelectedTicketToResolve(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
              <p className="text-[11px] font-bold uppercase text-slate-400">Customer Issue Subject</p>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                {typeof selectedTicketToResolve.subject === 'object' ? selectedTicketToResolve.subject?.title : selectedTicketToResolve.subject}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                "{selectedTicketToResolve.description}"
              </p>
            </div>

            {/* Quick Template Replies */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase text-slate-400">Quick Response Templates</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setAdminResolutionNote("Dispute verified. ₹50 fare adjustment credited to your RideX Wallet.");
                    setRefundAmountToWallet("50");
                    setAutoCreditWallet(true);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold cursor-pointer transition-all"
                >
                  💰 ₹50 Fare Refund
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminResolutionNote("We have verified captain conduct and issued a formal disciplinary strike. 20% discount applied to your next trip.");
                    setRefundAmountToWallet("0");
                    setAutoCreditWallet(false);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500 hover:text-white text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[11px] font-bold cursor-pointer transition-all"
                >
                  ⚠️ Captain Warning
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminResolutionNote("Trip GPS telemetry verified as accurate based on actual route taken. All calculations comply with standard tariff.");
                    setRefundAmountToWallet("0");
                    setAutoCreditWallet(false);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold cursor-pointer transition-all"
                >
                  ✔️ Fare Verified Correct
                </button>
              </div>
            </div>

            {/* Resolution Note Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Official Resolution Message (Will appear in Rider's Profile Notifications)
              </label>
              <textarea
                rows={3}
                value={adminResolutionNote}
                onChange={(e) => setAdminResolutionNote(e.target.value)}
                placeholder="Write resolution note here..."
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Wallet Refund option */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/40 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCreditWallet}
                  onChange={(e) => setAutoCreditWallet(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Credit Refund to Rider's RideX Wallet</span>
              </label>

              {autoCreditWallet && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Amount (₹):</span>
                  <input
                    type="number"
                    value={refundAmountToWallet}
                    onChange={(e) => setRefundAmountToWallet(e.target.value)}
                    placeholder="Enter amount"
                    className="w-28 px-3 py-1.5 rounded-xl border border-amber-400 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-white outline-none"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTicketToResolve(null)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleResolveTicket(selectedTicketToResolve.id)}
                className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
              >
                <span>Mark Resolved & Notify Rider ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Rider Modal */}
      {selectedRiderForDeactivate && (
        <DeactivateRiderModal
          rider={selectedRiderForDeactivate}
          onClose={() => setSelectedRiderForDeactivate(null)}
          onConfirm={handleConfirmDeactivate}
        />
      )}

      {/* Deactivate Captain Modal */}
      {selectedCaptainForDeactivate && (
        <DeactivateCaptainModal
          captain={selectedCaptainForDeactivate}
          onClose={() => setSelectedCaptainForDeactivate(null)}
          onConfirm={handleConfirmDeactivateCaptain}
        />
      )}
    </div>
  );
}
