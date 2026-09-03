import React, { useState, useEffect } from 'react';
import { Navigation, X, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import CancelRideModal from './CancelRideModal';
import api from '../../services/api';

export default function SearchingRadar({ bookingData, onCancel, onCaptainAccepted }) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const tickerMessages = [
    "Broadcasting request to nearby verified captains...",
    "Live GPS radar searching active captains...",
    "Waiting for nearby captain to accept dispatch...",
    "Captain reviewing route and estimated fare..."
  ];

  useEffect(() => {
    const tickerInterval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerMessages.length);
    }, 3000);

    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    // 1. Cloud API polling for live multi-device captain acceptance
    const checkCloudAcceptance = setInterval(async () => {
      const searchId = bookingData?._id || bookingData?.id;
      if (!searchId) return;

      try {
        const res = await api.get(`/bookings/${searchId}`);
        if (res.data?.success && res.data.booking) {
          const b = res.data.booking;
          if (b.status === 'captain_assigned' || b.status === 'captain_arriving' || b.status === 'trip_started') {
            const acceptedData = {
              bookingId: b.bookingId || b._id,
              _id: b._id,
              pickup: typeof b.pickup === 'string' ? b.pickup : b.pickup?.address,
              drop: typeof b.drop === 'string' ? b.drop : b.drop?.address,
              fare: b.fare?.total || b.fare,
              distanceKm: b.distanceKm,
              category: b.vehicleType === 'bike' ? 'Bike Moto' : b.vehicleType === 'auto' ? 'Auto TukTuk' : 'Sedan Prime',
              riderName: b.rider?.name || bookingData?.riderName || 'Corporate Rider',
              riderPhone: b.rider?.phone || bookingData?.riderPhone || '+91 9437088776',
              otp: b.otp || bookingData?.otp || '4921',
              status: b.status,
              captain: {
                name: b.captain?.name || 'Rajesh Mohapatra',
                phone: b.captain?.phone || '+91 9123456780',
                rating: b.captainProfile?.rating || 4.95,
                trips: b.captainProfile?.totalTrips || 142
              },
              vehicle: {
                category: b.captainProfile?.vehicle?.category || b.vehicleType || 'sedan',
                model: b.captainProfile?.vehicle?.model || 'Maruti Swift Dzire',
                numberPlate: b.captainProfile?.vehicle?.numberPlate || 'OD-02-BA-9876'
              }
            };
            onCaptainAccepted(acceptedData);
          }
        }
      } catch (e) {}
    }, 2000);

    // 2. Check localStorage for local/tab acceptance fallback
    const checkAcceptance = setInterval(() => {
      try {
        const liveTrip = localStorage.getItem('fleetcorp_live_active_trip');
        if (liveTrip) {
          const parsed = JSON.parse(liveTrip);
          if (parsed.status === 'captain_assigned' || parsed.status === 'captain_arriving') {
            onCaptainAccepted(parsed);
          }
        }
      } catch (e) {}
    }, 1000);

    let channel;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('ridex_dispatch_channel');
      channel.onmessage = (event) => {
        if ((event.data?.type === 'CAPTAIN_ACCEPTED' || event.data?.type === 'CAPTAIN_ACCEPTED_RIDE') && event.data?.data) {
          onCaptainAccepted(event.data.data);
        }
      };
    }

    return () => {
      clearInterval(tickerInterval);
      clearInterval(timer);
      clearInterval(checkCloudAcceptance);
      clearInterval(checkAcceptance);
      if (channel) channel.close();
    };
  }, [bookingData, onCaptainAccepted, tickerMessages.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center space-y-6 overflow-hidden">
        
        {/* Top Cancel button */}
        <button
          onClick={() => setShowCancelModal(true)}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Cancel Search"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated Sonar Radar Rings */}
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-amber-500/20 border border-amber-500/40"
          />
          <motion.div
            animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: 0.8, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-amber-500/30 border border-amber-500/60"
          />
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center text-3xl shadow-xl shadow-amber-500/30 z-10 animate-pulse">
            {bookingData?.vehicleType === 'bike' ? '🏍️' : bookingData?.vehicleType === 'auto' ? '🛺' : '🚖'}
          </div>
        </div>

        {/* Status Text */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Searching Captain ({secondsElapsed}s)</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Connecting to Nearby Captains...
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium min-h-[20px] transition-all">
            {tickerMessages[tickerIndex]}
          </p>
        </div>

        {/* Route Snapshot */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-left text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200/50 dark:border-slate-700">
            <span className="capitalize">{bookingData?.vehicleType || "Sedan"} Ride</span>
            <span className="text-amber-600 dark:text-amber-400 font-mono text-sm">
              ₹{bookingData?.fare?.total || Math.round(bookingData?.distanceKm * 18 + 90)}
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 truncate">
            <span className="text-emerald-500 font-bold">📍 Pickup:</span> {bookingData?.pickup}
          </p>
          <p className="text-slate-600 dark:text-slate-300 truncate">
            <span className="text-amber-500 font-bold">🏁 Drop:</span> {bookingData?.drop}
          </p>
        </div>

        {/* Cancel Action */}
        <div className="pt-2">
          <button
            onClick={() => setShowCancelModal(true)}
            className="w-full py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 hover:border-rose-500 font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <X className="w-4 h-4" /> Cancel Ride Request
          </button>
        </div>

      </div>

      {showCancelModal && (
        <CancelRideModal
          onClose={() => setShowCancelModal(false)}
          onConfirmCancel={(reason) => {
            setShowCancelModal(false);
            onCancel(reason);
          }}
        />
      )}

    </div>
  );
}
