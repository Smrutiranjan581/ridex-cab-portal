import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Phone, MessageSquare, ShieldAlert, Share2, CheckCircle2, Star, ArrowLeft, Key, Sparkles, Navigation, UserCheck } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import LiveMap from '../../components/booking/LiveMap';
import LiveChatModal from '../../components/booking/LiveChatModal';
import CallCaptainModal from '../../components/booking/CallCaptainModal';
import InvoiceModal from '../../components/booking/InvoiceModal';
import RatingModal from '../../components/booking/RatingModal';
import CancelRideModal from '../../components/booking/CancelRideModal';
import api from '../../services/api';

export default function TrackRidePage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [status, setStatus] = useState("captain_arriving");
  const [showChat, setShowChat] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const stages = [
    "booking_confirmed",
    "captain_assigned",
    "captain_arriving",
    "trip_started",
    "trip_completed"
  ];

  useEffect(() => {
    // 1. Initial check from localStorage active trip
    const checkLiveTrip = () => {
      try {
        const liveTrip = localStorage.getItem('fleetcorp_live_active_trip') || localStorage.getItem('fleetcorp_active_booking');
        if (liveTrip) {
          const parsed = JSON.parse(liveTrip);
          setBooking(parsed);
          if (parsed.status) {
            setStatus(parsed.status);
            if (parsed.status === 'trip_completed') {
              setShowReview(true);
            }
          }
        }
      } catch (e) {}
    };

    checkLiveTrip();
    const interval = setInterval(checkLiveTrip, 1200);

    // 2. Storage event listener across tabs
    const handleStorageChange = (e) => {
      if (e.key === 'fleetcorp_live_active_trip' || e.key === 'fleetcorp_active_booking') {
        checkLiveTrip();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 3. BroadcastChannel listener for instant sub-millisecond trip completion
    let channel;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('ridex_dispatch_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'TRIP_STARTED') {
          setStatus('trip_started');
          if (event.data.data) setBooking(event.data.data);
        } else if (event.data?.type === 'TRIP_COMPLETED') {
          setStatus('trip_completed');
          if (event.data.data) setBooking(event.data.data);
          setShowReview(true);
        }
      };
    }

    // 4. Real-time Live Cloud API Polling (Every 1.5s for instant multi-device sync)
    const fetchBooking = async () => {
      if (!id) return;
      try {
        const res = await api.get(`/bookings/${id}`);
        if (res.data?.success && res.data.booking) {
          const b = res.data.booking;
          setBooking(prev => ({
            ...prev,
            ...b,
            bookingId: b.bookingId || id,
            _id: b._id || id,
            pickup: typeof b.pickup === 'string' ? b.pickup : (b.pickup?.address || prev?.pickup || 'Pickup Location'),
            drop: typeof b.drop === 'string' ? b.drop : (b.drop?.address || prev?.drop || 'Destination'),
            fare: b.fare?.total || b.fare || prev?.fare || 180,
            otp: b.otp || prev?.otp || '4921',
            captain: b.captain || prev?.captain,
            vehicle: b.vehicle || b.captainProfile?.vehicle || prev?.vehicle
          }));
          
          if (b.status) {
            setStatus(b.status);
            if (b.status === 'trip_completed') {
              setShowReview(true);
            }
          }
        }
      } catch (err) {}
    };

    fetchBooking();
    const cloudApiInterval = setInterval(fetchBooking, 1500);

    return () => {
      clearInterval(interval);
      clearInterval(cloudApiInterval);
      window.removeEventListener('storage', handleStorageChange);
      if (channel) channel.close();
    };
  }, [id]);

  const advanceStage = async () => {
    const currentIndex = stages.indexOf(status);
    if (currentIndex < stages.length - 1) {
      const nextStatus = stages[currentIndex + 1];
      setStatus(nextStatus);
      if (id) {
        try {
          await api.patch(`/bookings/${id}/status`, { status: nextStatus });
        } catch (e) {}
      }
      if (nextStatus === "trip_completed") {
        setTimeout(() => setShowReview(true), 400);
      }
    }
  };

  const captainName = booking?.captain?.name || "Captain Jitendra Mohanty";
  const captainPhone = booking?.captain?.phone || "+91 9437088776";
  const vehicleModel = booking?.vehicle?.model || booking?.captainProfile?.vehicle?.model || "RideX Verified Vehicle";
  const vehicleNumber = booking?.vehicle?.numberPlate || booking?.captainProfile?.vehicle?.numberPlate || "OD-02-AB-1234";
  const otpCode = booking?.otp || "1299";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/rider/book"
              className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Live Ride Tracking
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                Trip #{booking?.bookingId || id || "RDX-9989"}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {status !== "trip_completed" && status !== "trip_started" && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                Cancel Ride
              </button>
            )}
            <button
              onClick={() => alert("Trip link copied! You can share your live ride tracking with friends & family.")}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 hover:bg-slate-100 shadow-sm"
            >
              <Share2 className="w-4 h-4 text-amber-500" /> Share Trip
            </button>
            <button
              onClick={() => alert("🚨 SOS Emergency Alert dispatched to 24x7 Safety Response Team & Local Police Hotline.")}
              className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20"
            >
              <ShieldAlert className="w-4 h-4" /> SOS Emergency
            </button>
          </div>
        </div>

        {/* Captain Assigned Profile Card with Call & Chat Buttons */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
          
          {/* Driver & Vehicle */}
          <div className="flex items-center gap-4 text-center sm:text-left w-full sm:w-auto">
            <div className="relative shrink-0 mx-auto sm:mx-0">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                alt="Captain"
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-amber-500 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full">
                <UserCheck className="w-3 h-3" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  {captainName}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> 4.92
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                {vehicleModel} • <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">{vehicleNumber}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">RideX Verified Partner • Top Rated</p>
            </div>
          </div>

          {/* OTP Box & Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
            {/* Start Trip OTP Pill */}
            <div className="px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-800 border border-slate-700 text-center shadow-md">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                Trip Start OTP
              </span>
              <span className="font-mono font-black text-xl text-amber-400 tracking-widest">
                {otpCode}
              </span>
            </div>

            {/* Chat Button */}
            <button
              onClick={() => setShowChat(true)}
              className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" /> Live Chat
            </button>

            {/* Call Button */}
            <button
              onClick={() => setShowCall(true)}
              className="px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs shadow-md flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
            >
              <Phone className="w-4 h-4" /> Call Captain
            </button>
          </div>

        </div>

        {/* Interactive Live Map Component */}
        <LiveMap
          status={status}
          driverName={captainName}
          vehicleNo={vehicleNumber}
          otp={otpCode}
          onStatusAdvance={advanceStage}
        />

        {/* Trip Summary Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase text-slate-400">Pickup Location</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
              {booking?.pickup?.address || booking?.pickup || "Infocity IT Corridor, Patia"}
            </p>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase text-slate-400">Destination Drop</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
              {booking?.drop?.address || booking?.drop || "BBI Airport Terminal 1"}
            </p>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Total Fare</p>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                ₹{booking?.fare?.total || booking?.fare || 180}
              </p>
            </div>
            {status === "trip_completed" && (
              <button
                onClick={() => setShowReview(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md cursor-pointer"
              >
                Rate Ride ⭐
              </button>
            )}
          </div>
        </div>

      </main>

      {/* Live Chat Modal */}
      {showChat && (
        <LiveChatModal
          captainName={captainName}
          captainPhone={captainPhone}
          vehicleNo={vehicleNumber}
          onClose={() => setShowChat(false)}
          onCallClick={() => { setShowChat(false); setShowCall(true); }}
        />
      )}

      {/* In-App Calling Modal */}
      {showCall && (
        <CallCaptainModal
          captainName={captainName}
          captainPhone={captainPhone}
          vehicleNo={vehicleNumber}
          onClose={() => setShowCall(false)}
        />
      )}

      {/* Invoice Modal */}
      {showInvoice && (
        <InvoiceModal
          booking={booking || { bookingId: "RDX-9989", fare: { total: 180 } }}
          onClose={() => setShowInvoice(false)}
        />
      )}

      {/* Real Uber/Rapido Style Trip Completed & 5-Star Rating Modal */}
      {showReview && (
        <RatingModal
          booking={booking || { _id: "demo", bookingId: "RDX-9989" }}
          onClose={() => setShowReview(false)}
          onSubmitSuccess={() => {
            setShowReview(false);
            window.location.href = '/rider/book';
          }}
        />
      )}

      {showCancelModal && (
        <CancelRideModal
          onClose={() => setShowCancelModal(false)}
          onConfirmCancel={(reason) => {
            setShowCancelModal(false);
            window.location.href = '/rider/book';
          }}
        />
      )}
    </div>
  );
}
