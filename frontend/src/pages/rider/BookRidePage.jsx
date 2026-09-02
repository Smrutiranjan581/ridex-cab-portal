import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import BookingForm from '../../components/booking/BookingForm';
import RouteMapPreview from '../../components/booking/RouteMapPreview';
import SearchingRadar from '../../components/booking/SearchingRadar';
import { ShieldCheck, Zap, Navigation, Award, Clock, AlertTriangle, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BookRidePage() {
  const { user } = useAuth();
  const isDeactivated = user?.isDeactivated || user?.status === 'deactivated';
  const [isSearching, setIsSearching] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Real-time Route State synchronized with BookingForm
  const [routeInfo, setRouteInfo] = useState({
    pickup: '',
    drop: '',
    pickupCoords: [20.3541, 85.8195],
    dropCoords: null,
    distanceKm: 0,
    durationMins: 0,
    vehicleType: ''
  });

  const navigate = useNavigate();

  const handleStartBooking = (bookingData) => {
    setCurrentBooking(bookingData);
    setIsSearching(true);

    const dispatchData = {
      id: "RDX-" + Math.floor(1000 + Math.random() * 9000),
      pickup: bookingData.pickup,
      drop: bookingData.drop,
      vehicleType: bookingData.vehicleType,
      category: bookingData.vehicleType === 'bike' ? 'Bike Moto' : bookingData.vehicleType === 'auto' ? 'Auto TukTuk' : 'Sedan Prime',
      fare: bookingData.fare?.total || Math.round(bookingData.distanceKm * 18 + 90),
      distanceKm: bookingData.distanceKm,
      durationMins: bookingData.estimatedDurationMins,
      riderName: bookingData.riderName || "Corporate Rider",
      riderPhone: bookingData.riderPhone || "+91 9437088776",
      status: "pending_acceptance",
      createdAt: new Date().toISOString()
    };

    // Save pending dispatch request so Captain Dashboard can listen and accept
    try {
      localStorage.setItem('fleetcorp_live_dispatch_request', JSON.stringify(dispatchData));
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('ridex_dispatch_channel');
        channel.postMessage({ type: 'NEW_DISPATCH_REQUEST', data: dispatchData });
      }
    } catch (e) {}
  };

  const handleCaptainAccepted = (acceptedTrip) => {
    setIsSearching(false);
    // Save to local active trip
    try {
      localStorage.setItem('fleetcorp_active_booking', JSON.stringify(acceptedTrip));
    } catch (e) {}
    navigate(`/rider/track/${acceptedTrip.bookingId || 'RDX-9188'}`);
  };

  const handleCancelSearch = () => {
    setIsSearching(false);
    try {
      localStorage.removeItem('fleetcorp_live_dispatch_request');
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('ridex_dispatch_channel');
        channel.postMessage({ type: 'CANCEL_DISPATCH_REQUEST' });
      }
    } catch (e) {}
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Main Navbar with Logo and Profile */}
      <Navbar />

      {/* Main Dedicated Booking Container (No Sidebar) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Page Title & Highlights Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            {/* Prominent Back to Home Button */}
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-amber-500 hover:border-amber-500 hover:text-slate-950 dark:hover:bg-amber-500 dark:hover:text-slate-950 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition-all shadow-xs group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home Page</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Zap className="w-3.5 h-3.5" /> Instant RideX Dispatch
              </span>
              <span className="text-xs text-slate-400 font-semibold">• Live GPS Radar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Book a RideX
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Automatic GPS location detection & live route map from pickup to drop
            </p>
          </div>

          {/* Quick Perks Pill Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Acko Insured</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs">
              <Award className="w-4 h-4 text-amber-500" />
              <span>No Surge Rate</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>~2 Min Pickup</span>
            </div>
          </div>
        </div>

        {/* Deactivation Alert Banner */}
        {isDeactivated && (
          <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 space-y-2 shadow-lg animate-fadeIn">
            <div className="flex items-center gap-2 font-extrabold text-sm text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
              <span>Rider Account Access Suspended / Deactivated</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Your RideX passenger account has been deactivated by platform administration.
              {user?.deactivationReason && (
                <span className="font-bold text-rose-600 dark:text-rose-400 block mt-1">
                  Reason: "{user.deactivationReason}"
                </span>
              )}
              An official notification was dispatched to your registered email (<strong>{user?.email}</strong>). Please contact <strong>appeals@ridex.com</strong> to restore your account.
            </p>
          </div>
        )}

        {/* 2-Column Dedicated Layout: Booking Console (Left) + Live Route Map (Right) */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start ${isDeactivated ? 'opacity-40 pointer-events-none' : ''}`}>
          
          {/* 1. Left Side: Full Booking Form with Auto GPS detection */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xl">
            <BookingForm
              onConfirmBooking={handleStartBooking}
              isSubmitting={isSubmitting}
              onRouteChange={setRouteInfo}
            />
          </div>

          {/* 2. Right Side: Dynamic Route Map Preview from Pickup to Drop */}
          <div className="lg:col-span-5">
            <RouteMapPreview
              pickupCoords={routeInfo.pickupCoords}
              dropCoords={routeInfo.dropCoords}
              pickup={routeInfo.pickup}
              drop={routeInfo.drop}
              distanceKm={routeInfo.distanceKm}
              durationMins={routeInfo.durationMins}
              vehicleType={routeInfo.vehicleType}
            />
          </div>

        </div>
      </main>

      {/* Real-time Dispatch Searching Sonar Modal */}
      {isSearching && (
        <SearchingRadar
          bookingData={currentBooking}
          onCancel={handleCancelSearch}
          onCaptainAccepted={handleCaptainAccepted}
        />
      )}
    </div>
  );
}
