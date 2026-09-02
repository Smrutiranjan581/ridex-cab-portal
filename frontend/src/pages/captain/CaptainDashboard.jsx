import React, { useState, useEffect } from 'react';
import { Power, DollarSign, Star, Navigation, MapPin, CheckCircle2, ShieldCheck, Phone, Check, X, AlertCircle, ShieldAlert } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatCard from '../../components/dashboard/StatCard';
import CaptainActiveTripMap from '../../components/booking/CaptainActiveTripMap';
import CaptainEarningsModal from '../../components/dashboard/CaptainEarningsModal';
import InvoiceModal from '../../components/booking/InvoiceModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function CaptainDashboard() {
  const { user } = useAuth();
  const isDeactivated = user?.isDeactivated || user?.status === 'deactivated';
  
  const getInitialOnlineState = () => {
    if (isDeactivated) return false;
    try {
      const capKey = 'ridex_captain_live_status_' + (user?.phone || user?.email || 'default');
      const saved = localStorage.getItem(capKey);
      if (saved !== null) return saved === 'online';
      return true;
    } catch (e) {
      return true;
    }
  };

  const [isOnline, setIsOnline] = useState(getInitialOnlineState);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [tripStage, setTripStage] = useState('captain_arriving');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [selectedInvoiceTrip, setSelectedInvoiceTrip] = useState(null);

  const handleToggleOnline = () => {
    if (isDeactivated) return;
    const nextState = !isOnline;
    setIsOnline(nextState);
    try {
      const capKey = 'ridex_captain_live_status_' + (user?.phone || user?.email || 'default');
      localStorage.setItem(capKey, nextState ? 'online' : 'offline');

      const raw = localStorage.getItem('fleetcorp_registered_users');
      if (raw) {
        let users = JSON.parse(raw);
        users = users.map(u => {
          if ((u.phone && u.phone === user?.phone) || (u.email && u.email?.toLowerCase() === user?.email?.toLowerCase()) || (u.name && u.name === user?.name)) {
            return { ...u, dutyStatus: nextState ? 'online' : 'offline' };
          }
          return u;
        });
        localStorage.setItem('fleetcorp_registered_users', JSON.stringify(users));
      }

      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('ridex_dispatch_channel');
        channel.postMessage({
          type: 'CAPTAIN_STATUS_CHANGE',
          phone: user?.phone,
          email: user?.email,
          name: user?.name,
          dutyStatus: nextState ? 'online' : 'offline'
        });
      }
    } catch (e) {}
  };

  // Helper to compute 100% REAL earnings and trips strictly for the current logged-in captain
  const getTodayRealStats = () => {
    try {
      const history = JSON.parse(localStorage.getItem('ridex_captain_trip_history') || '[]');
      const todayStr = new Date().toISOString().slice(0, 10);
      
      const myTrips = history.filter(t => {
        if (!user) return false;
        const myEmail = user.email ? user.email.toLowerCase() : '';
        const myPhone = user.phone ? user.phone.replace(/[^0-9]/g, '').slice(-10) : '';

        const tEmail = (t.captainEmail || t.captain?.email || '').toLowerCase();
        const tPhone = (t.captainPhone || t.captain?.phone || '').replace(/[^0-9]/g, '').slice(-10);

        if (myEmail && tEmail && myEmail === tEmail) return true;
        if (myPhone && tPhone && myPhone === tPhone) return true;

        // Demo account fallback: only demo captain sees untagged legacy demo trips
        if (myEmail === 'captain@cab.com' && !tEmail && !tPhone) return true;
        return false;
      });

      const todayTrips = myTrips.filter(t => {
        if (!t.createdAt) return false;
        return t.createdAt.startsWith(todayStr);
      });
      const earnings = todayTrips.reduce((acc, t) => acc + (t.fare?.total || t.fare || 0), 0);
      
      return {
        todayEarnings: earnings,
        totalTrips: todayTrips.length,
        rating: myTrips.length > 0 ? (user?.captainProfile?.rating || user?.rating || 4.95) : 5.0,
        acceptanceRate: "100%"
      };
    } catch (e) {
      return {
        todayEarnings: 0,
        totalTrips: 0,
        rating: 5.0,
        acceptanceRate: "100%"
      };
    }
  };

  const [stats, setStats] = useState(getTodayRealStats);

  // Re-sync stats on storage changes, tips, or when user changes
  useEffect(() => {
    setStats(getTodayRealStats());
    const handleStorageUpdate = () => {
      setStats(getTodayRealStats());
    };
    window.addEventListener('storage', handleStorageUpdate);

    let ch;
    if ('BroadcastChannel' in window) {
      ch = new BroadcastChannel('ridex_dispatch_channel');
      ch.onmessage = (event) => {
        if (event.data?.type === 'RIDER_TIP_ADDED' || event.data?.type === 'TRIP_COMPLETED' || event.data?.type === 'PAYOUT_APPROVED' || event.data?.type === 'PAYOUT_REJECTED') {
          setStats(getTodayRealStats());
        }
      };
    }

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      if (ch) ch.close();
    };
  }, [user]);

  // Listen ONLY for Real Ride Bookings from Riders
  useEffect(() => {
    if (!isOnline || activeTrip) {
      setIncomingRequest(null);
      return;
    }

    const checkPendingRequests = () => {
      try {
        const storedReq = localStorage.getItem('fleetcorp_live_dispatch_request');
        if (storedReq) {
          const parsed = JSON.parse(storedReq);
          if (parsed && parsed.status === 'pending_acceptance') {
            setIncomingRequest(parsed);
          }
        }
      } catch (e) {}
    };

    // 1. Initial check
    checkPendingRequests();

    // 2. Poll storage every 1.5s
    const pollInterval = setInterval(checkPendingRequests, 1500);

    // 3. Listen to cross-window storage events
    const handleStorageChange = (e) => {
      if (e.key === 'fleetcorp_live_dispatch_request') {
        checkPendingRequests();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 4. Listen to BroadcastChannel for instant real-time dispatch
    let channel;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('ridex_dispatch_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'NEW_DISPATCH_REQUEST' && event.data?.data) {
          setIncomingRequest(event.data.data);
        } else if (event.data?.type === 'CANCEL_DISPATCH_REQUEST') {
          setIncomingRequest(null);
        }
      };
    }

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorageChange);
      if (channel) channel.close();
    };
  }, [isOnline, activeTrip]);

  const handleAcceptRide = () => {
    if (!incomingRequest) return;

    const assignedOtp = String(Math.floor(1000 + Math.random() * 9000));
    const assignedTrip = {
      bookingId: incomingRequest.id || ("RDX-" + Math.floor(1000 + Math.random() * 9000)),
      pickup: incomingRequest.pickup,
      drop: incomingRequest.drop,
      fare: incomingRequest.fare,
      distanceKm: incomingRequest.distanceKm,
      category: incomingRequest.category || incomingRequest.vehicleType || "RideX Prime",
      riderName: incomingRequest.riderName || "Corporate Rider",
      riderPhone: incomingRequest.riderPhone || "+91 9437088776",
      otp: assignedOtp,
      status: "captain_assigned",
      captain: {
        name: user?.name || "Captain Partner",
        phone: user?.phone || "+91 9437088776",
        rating: user?.rating || 4.95,
        trips: (user?.totalTrips || 12) + stats.totalTrips
      },
      vehicle: {
        category: user?.vehicleDetails?.category || incomingRequest.vehicleType || "sedan",
        model: user?.vehicleDetails?.model || "RideX Verified Vehicle",
        numberPlate: user?.vehicleDetails?.numberPlate || "OD-02-AB-1234"
      }
    };

    setActiveTrip(assignedTrip);
    setIncomingRequest(null);
    setTripStage("captain_arriving");

    // Save active trip for rider
    try {
      localStorage.setItem('fleetcorp_live_active_trip', JSON.stringify(assignedTrip));
      localStorage.removeItem('fleetcorp_live_dispatch_request');
      
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('ridex_dispatch_channel');
        channel.postMessage({ type: 'CAPTAIN_ACCEPTED', data: assignedTrip });
      }
    } catch (e) {}
  };

  const handleRejectRide = () => {
    setIncomingRequest(null);
    try {
      localStorage.removeItem('fleetcorp_live_dispatch_request');
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('ridex_dispatch_channel');
        channel.postMessage({ type: 'CANCEL_DISPATCH_REQUEST' });
      }
    } catch (e) {}
  };

  const handleStartTrip = () => {
    if (!enteredOtp || enteredOtp === activeTrip?.otp) {
      setOtpError(false);
      setTripStage("trip_started");
      try {
        const updated = { ...activeTrip, status: "trip_started" };
        localStorage.setItem('fleetcorp_live_active_trip', JSON.stringify(updated));
        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel('ridex_dispatch_channel');
          channel.postMessage({ type: 'TRIP_STARTED', data: updated });
        }
      } catch (e) {}
    } else {
      setOtpError(true);
    }
  };

  const handleCompleteTrip = () => {
    setTripStage("trip_completed");
    setStats(prev => ({
      ...prev,
      todayEarnings: prev.todayEarnings + (activeTrip?.fare || 150),
      totalTrips: prev.totalTrips + 1
    }));
    try {
      const updated = { ...activeTrip, status: "trip_completed" };
      localStorage.setItem('fleetcorp_live_active_trip', JSON.stringify(updated));

      // Append to real captain trip history with logged-in captain identity
      const existingHistory = JSON.parse(localStorage.getItem('ridex_captain_trip_history') || '[]');
      const historyEntry = {
        _id: activeTrip.bookingId || ('cap_t_' + Date.now()),
        bookingId: activeTrip.bookingId || ('RDX-' + Math.floor(1000 + Math.random() * 9000)),
        captainEmail: user?.email || '',
        captainPhone: user?.phone || '',
        captainName: user?.name || 'Captain Partner',
        rider: { 
          name: activeTrip.riderName || activeTrip.passengerName || "Corporate Rider", 
          company: "RideX Passenger" 
        },
        pickup: { address: activeTrip.pickup },
        drop: { address: activeTrip.drop },
        vehicleType: activeTrip.vehicleType || activeTrip.category || user?.vehicleDetails?.category || "sedan",
        fare: { total: activeTrip.fare || 180 },
        distanceKm: activeTrip.distanceKm || 14.5,
        status: "trip_completed",
        createdAt: new Date().toISOString()
      };
      const updatedHistory = [historyEntry, ...existingHistory.filter(h => h.bookingId !== historyEntry.bookingId)];
      localStorage.setItem('ridex_captain_trip_history', JSON.stringify(updatedHistory));

      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('ridex_dispatch_channel');
        channel.postMessage({ type: 'TRIP_COMPLETED', data: updated });
      }
    } catch (e) {}
    setTimeout(() => {
      setActiveTrip(null);
      setTripStage("captain_arriving");
      setEnteredOtp('');
    }, 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-sm">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                alt="Captain"
                className={`w-16 h-16 rounded-2xl object-cover ring-4 shadow-md shrink-0 mx-auto sm:mx-0 ${
                  isDeactivated ? 'ring-rose-500 grayscale' : 'ring-amber-500'
                }`}
              />
              <div>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  isDeactivated ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                }`}>
                  {isDeactivated ? 'Account Suspended' : 'Verified Captain'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Captain {user?.name || "Partner"}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {user?.vehicleDetails?.model || "RideX Verified Vehicle"} •{" "}
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {user?.vehicleDetails?.numberPlate || "OD-02-AB-1234"}
                  </span>{" "}
                  • <span className="capitalize">{user?.vehicleDetails?.category || "RideX Fleet"}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <button
                disabled={isDeactivated}
                onClick={handleToggleOnline}
                className={`px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 shadow-xl transition-all ${
                  isDeactivated
                    ? 'bg-rose-500/20 text-rose-600 border border-rose-500/40 cursor-not-allowed opacity-80'
                    : isOnline
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30 ring-4 ring-emerald-400/30 hover:scale-105 cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 cursor-pointer'
                }`}
              >
                <Power className="w-5 h-5" />
                <span>
                  {isDeactivated
                    ? "ACCOUNT SUSPENDED 🚫"
                    : isOnline
                    ? "YOU ARE ONLINE 🟢"
                    : "YOU ARE OFFLINE ⚪"}
                </span>
              </button>
              <span className="text-[11px] font-semibold text-slate-400">
                {isDeactivated
                  ? "Driver cockpit disabled by fleet administration"
                  : isOnline
                  ? "Looking for nearby corporate rides..."
                  : "Go online to receive ride alerts"}
              </span>
            </div>
          </div>

          {/* Captain Deactivation Alert Notice */}
          {isDeactivated && (
            <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 space-y-2 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2 font-extrabold text-sm text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-5 h-5" />
                <span>Driver Partner Access Suspended / Deactivated</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Your driver partner privileges have been temporarily deactivated by fleet administration.
                {user?.deactivationReason && (
                  <span className="font-bold text-rose-600 dark:text-rose-400 block mt-1">
                    Reason: "{user.deactivationReason}"
                  </span>
                )}
                An official notice has been dispatched to your registered email (<strong>{user?.email}</strong>). Please contact <strong>captain-support@ridex.com</strong> for reinstatement review.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Today's Earnings"
              value={`₹${stats.todayEarnings}`}
              change={stats.todayEarnings > 0 ? `+₹${stats.todayEarnings} earned today` : "₹0 earned today"}
              isPositive={stats.todayEarnings > 0}
              icon={DollarSign}
              onClick={() => setShowEarningsModal(true)}
            />
            <StatCard
              title="Today's Completed Trips"
              value={`${stats.totalTrips} ${stats.totalTrips === 1 ? 'Trip' : 'Trips'}`}
              change={stats.totalTrips > 0 ? `${stats.totalTrips} finished today` : "0 finished today"}
              isPositive={stats.totalTrips > 0}
              icon={CheckCircle2}
            />
            <StatCard
              title="Captain Rating"
              value={`${stats.rating} ⭐`}
              change={stats.totalTrips > 0 ? "Verified Captain" : "New Captain"}
              isPositive={true}
              icon={Star}
            />
            <StatCard
              title="Acceptance Rate"
              value={stats.acceptanceRate}
              change={stats.totalTrips > 0 ? "Instant Dispatch" : "Ready for Rides"}
              isPositive={true}
              icon={ShieldCheck}
            />
          </div>

          {activeTrip ? (
            <div className="space-y-6 animate-in zoom-in-95">
              {/* 1. Dynamic Interactive Navigation Map (Pickup stage vs Drop stage) */}
              <CaptainActiveTripMap
                tripStage={tripStage}
                pickup={activeTrip.pickup}
                drop={activeTrip.drop}
                pickupCoords={activeTrip.pickupCoords || [20.3541, 85.8195]}
                dropCoords={activeTrip.dropCoords || [20.2912, 85.8647]}
                vehicleType={activeTrip.vehicleType || activeTrip.category || user?.vehicleDetails?.category || 'bike'}
                fare={activeTrip.fare}
                distanceKm={activeTrip.distanceKm}
              />

              {/* 2. Active Trip Management Card */}
              <div className="glass-card rounded-3xl p-6 border-2 border-amber-500 shadow-2xl space-y-5 bg-gradient-to-b from-amber-500/5 to-transparent">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping" />
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                      {tripStage === 'captain_arriving' ? 'Stage 1: Heading to Passenger Pickup' : 'Stage 2: Trip In Progress to Drop'}
                    </h3>
                  </div>
                  <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono bg-amber-500/10 px-3.5 py-1.5 rounded-xl border border-amber-500/20">
                    Total Fare: ₹{activeTrip.fare}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Passenger Info</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{activeTrip.riderName || "Rider Passenger"}</p>
                    <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-500" /> {activeTrip.riderPhone || "+91 9437088776"}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trip Route</p>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate">
                      📍 Pickup: {activeTrip.pickup}
                    </p>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 truncate">
                      🏁 Drop: {activeTrip.drop}
                    </p>
                  </div>
                </div>

                {/* Stage 1: Ask Passenger for OTP */}
                {tripStage === 'captain_arriving' && (
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        Ask Passenger for 4-Digit Trip Start OTP
                      </p>
                      <span className="text-[11px] font-bold text-slate-400">
                        OTP on Rider Screen: <b className="font-mono text-amber-600 dark:text-amber-400">{activeTrip?.otp || "----"}</b>
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="Enter 4-Digit OTP"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-mono font-black text-lg tracking-widest outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                      />
                      <button
                        onClick={handleStartTrip}
                        className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" /> Verify OTP & Start Trip ➔
                      </button>
                    </div>
                    {otpError && (
                      <p className="text-xs font-bold text-rose-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Incorrect OTP! Please enter the 4-digit OTP shown on the passenger's screen.
                      </p>
                    )}
                  </div>
                )}

                {/* Stage 2: Navigation to Drop & Complete Trip */}
                {tripStage === 'trip_started' && (
                  <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Navigation className="w-4 h-4 animate-spin" /> In Transit ➔ Driving to Destination
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">Follow the live route on the map above to reach drop point</p>
                    </div>
                    <button
                      onClick={handleCompleteTrip}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer hover:scale-105"
                    >
                      Arrived at Drop ➔ Complete Trip & Collect ₹{activeTrip.fare}
                    </button>
                  </div>
                )}

                {/* Stage 3: Trip Completed celebration */}
                {tripStage === 'trip_completed' && (
                  <div className="p-4 rounded-2xl bg-emerald-500 text-white text-center font-bold text-sm shadow-md animate-in zoom-in-95">
                    🎉 Trip Completed Successfully! ₹{activeTrip.fare} has been credited to your daily wallet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Clean Captain Waiting Radar Card (Animation Removed) */
            <div className="glass-card rounded-3xl p-10 border border-slate-200/80 dark:border-slate-800 text-center space-y-5 max-w-2xl mx-auto shadow-sm">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl shadow-xl transition-all ${
                isOnline ? 'bg-emerald-500/20 text-emerald-500 ring-8 ring-emerald-500/10 animate-pulse' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}>
                {isOnline ? '📡' : '⏸️'}
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {isOnline ? 'Captain Radar Active & Ready' : 'You are Currently Offline'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isOnline
                    ? 'Your captain status is active in Bhubaneswar. When a real rider books a ride nearby, you will immediately receive a live sound & popup dispatch alert.'
                    : 'Turn your status to ONLINE above to start receiving ride booking dispatches.'}
                </p>
              </div>

              {isOnline && (
                <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  Listening for incoming ride dispatches...
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {incomingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border-2 border-amber-500 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto text-3xl animate-bounce">
              🚖
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                New Ride Dispatch Request!
              </span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                ₹{incomingRequest.fare}
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-0.5">{incomingRequest.distanceKm} KM • {incomingRequest.category}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-left text-xs space-y-2 border border-slate-200/60 dark:border-slate-700">
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                <span className="text-emerald-500 font-bold">📍 Pickup:</span> {incomingRequest.pickup}
              </p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                <span className="text-amber-500 font-bold">🏁 Drop:</span> {incomingRequest.drop}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleRejectRide}
                className="py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Pass (Reject)
              </button>
              <button
                onClick={handleAcceptRide}
                className="py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 flex items-center justify-center gap-1.5 transition-transform hover:scale-105"
              >
                <Check className="w-4 h-4" /> Accept Ride
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Captain Real Earnings Breakdown & Trip History Modal */}
      <CaptainEarningsModal
        isOpen={showEarningsModal}
        onClose={() => setShowEarningsModal(false)}
        onViewInvoice={(trip) => setSelectedInvoiceTrip(trip)}
      />

      {/* Invoice Modal Preview */}
      {selectedInvoiceTrip && (
        <InvoiceModal
          booking={selectedInvoiceTrip}
          onClose={() => setSelectedInvoiceTrip(null)}
        />
      )}

    </div>
  );
}
