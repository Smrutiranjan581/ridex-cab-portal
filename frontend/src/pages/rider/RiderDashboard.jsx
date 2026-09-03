import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Clock, CheckCircle2, Wallet, Plus, Navigation, ArrowRight, ShieldCheck, MapPin, Search, Star, Plane, Building2, Sparkles, Ticket, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatCard from '../../components/dashboard/StatCard';
import BookingsTable from '../../components/dashboard/BookingsTable';
import InvoiceModal from '../../components/booking/InvoiceModal';
import RatingModal from '../../components/booking/RatingModal';
import LiveMap from '../../components/booking/LiveMap';
import RiderWelcomeOfferModal from '../../components/rider/RiderWelcomeOfferModal';
import { getRiderRideCount, getRiderWelcomeDiscount } from '../../utils/riderDiscount';
import api from '../../services/api';

export default function RiderDashboard() {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [quickDestination, setQuickDestination] = useState('');
  const navigate = useNavigate();

  const rideCount = getRiderRideCount(user);
  const discountInfo = getRiderWelcomeDiscount(rideCount);

  const [showOfferModal, setShowOfferModal] = useState(() => {
    try {
      const seen = sessionStorage.getItem('ridex_offer_modal_seen');
      return rideCount < 2 && !seen;
    } catch (e) {
      return rideCount < 2;
    }
  });

  const handleCloseOfferModal = () => {
    try {
      sessionStorage.setItem('ridex_offer_modal_seen', 'true');
    } catch (e) {}
    setShowOfferModal(false);
  };

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const res = await api.get('/bookings/my-rides');
        if (res.data.success && Array.isArray(res.data.rides)) {
          setRides(res.data.rides);
          const userKey = (user?.email || user?.phone || 'guest').toLowerCase();
          if (res.data.rides.length > 0) {
            localStorage.setItem(`ridex_rider_trips_count_${userKey}`, String(res.data.rides.length));
          }
        }
      } catch (err) {
        console.log("Using demo fallback rides");
      }
    };
    fetchRides();
  }, [user]);

  const completedCount = rides.filter(r => r.status === 'trip_completed').length || 8;
  const activeRide = rides.find(r => ['captain_assigned', 'captain_arriving', 'trip_started'].includes(r.status));

  const savedPlaces = [
    { title: "BBI Airport Terminal 1", desc: "18.5 KM • ~38 mins", icon: Plane, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30" },
    { title: "Infocity IT Hub, Silicon Hills", desc: "12.4 KM • ~26 mins", icon: Building2, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" },
    { title: "Esplanade One Mall, Rasulgarh", desc: "9.2 KM • ~20 mins", icon: MapPin, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          
          {/* Top Hero Card with Search & Quick Book */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent relative overflow-hidden shadow-sm">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Corporate Commute Pass Active</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Where are you heading today, {user?.name?.split(' ')[0] || "Rahul"}?
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                {user?.company || "TCS Innovation Hub"} • Fast corporate cab booking with guaranteed on-time pickup.
              </p>

              {/* Quick Destination Search Box */}
              <div className="pt-3 flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter airport, office hub, or destination..."
                    value={quickDestination}
                    onChange={(e) => setQuickDestination(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') navigate('/rider/book'); }}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                  />
                </div>
                <Link
                  to="/rider/book"
                  className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shrink-0"
                >
                  <Car className="w-4 h-4" /> Book Cab Now
                </Link>
              </div>
            </div>
          </div>

          {/* Active Welcome Discount Callout Banner */}
          {discountInfo.isEligible && (
            <div 
              onClick={() => setShowOfferModal(true)}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 border-2 border-amber-500/40 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:border-amber-500 transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-bold text-2xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
                  🎁
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                      Active Offer
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      Code: {discountInfo.code}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mt-0.5">
                    {discountInfo.title} Applied Automatically!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {rideCount === 0 ? "Get 30% OFF on your 1st ride + 20% OFF on your 2nd ride." : "Enjoy 20% OFF on this 2nd ride."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:underline">
                  View Reward Details
                </span>
                <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

          {/* Active Trip Banner if ongoing */}
          {activeRide && (
            <div className="rounded-3xl p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-bold text-xl animate-bounce">
                  🚖
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-400">
                    Live Active Trip
                  </span>
                  <h3 className="font-extrabold text-base sm:text-lg mt-0.5">
                    Captain Arriving • Swift Dzire ({activeRide.captainProfile?.vehicle?.numberPlate || "OD-02-BA-9876"})
                  </h3>
                  <p className="text-xs font-semibold opacity-90 mt-0.5">
                    Secure OTP: <span className="font-mono font-bold tracking-widest text-white bg-slate-950 px-2 py-0.5 rounded ml-1">{activeRide.otp || "4921"}</span>
                  </p>
                </div>
              </div>

              <Link
                to={`/rider/track/${activeRide._id || 'demo'}`}
                className="px-5 py-2.5 rounded-xl bg-slate-950 text-white hover:bg-slate-900 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
              >
                <Navigation className="w-4 h-4 text-amber-400" /> Open Live Map Tracker
              </Link>
            </div>
          )}

          {/* KPI Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Rides"
              value={rides.length || 14}
              change="+3"
              isPositive={true}
              icon={Car}
            />
            <StatCard
              title="Active Trips"
              value={activeRide ? 1 : 0}
              icon={Clock}
            />
            <StatCard
              title="Completed Commutes"
              value={completedCount}
              change="+18%"
              isPositive={true}
              icon={CheckCircle2}
            />
            <StatCard
              title="Corporate Wallet"
              value={`₹${user?.walletBalance || 2450}`}
              icon={Wallet}
            />
          </div>

          {/* Split Section: Saved Places + Live City Radar Map */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Saved Corporate Destinations */}
            <div className="lg:col-span-5 space-y-4">
              <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Saved Corporate Hubs</span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">1-Tap Book</span>
                </h3>

                <div className="space-y-2 pt-1">
                  {savedPlaces.map((place, idx) => {
                    const Icon = place.icon;
                    return (
                      <Link
                        key={idx}
                        to="/rider/book"
                        className="flex items-center gap-3 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group"
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 ${place.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                            {place.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{place.desc}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live City Radar */}
            <div className="lg:col-span-7 space-y-4">
              <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      City Live Fleet Radar
                    </h3>
                    <p className="text-[11px] text-slate-500">18 Cabs currently active & available near you</p>
                  </div>
                  <Link to="/rider/book" className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
                    View Route Map ➔
                  </Link>
                </div>

                <div className="h-64 rounded-2xl overflow-hidden">
                  <LiveMap
                    status="captain_arriving"
                    driverName="Rajesh Mohapatra"
                    vehicleNo="OD-02-BA-9876"
                    otp="4921"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Recent Rides Table */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Recent Commutes</h3>
                <p className="text-xs text-slate-500">Track history, download official tax invoices, and rate captains</p>
              </div>
              <Link to="/rider/my-rides" className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
                View All History <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <BookingsTable
              bookings={rides.length ? rides : [
                {
                  _id: "bk_demo_1",
                  bookingId: "FLT-9042",
                  rider: { name: user?.name || "Rahul Sharma" },
                  pickup: { address: "Infocity IT Hub, Silicon Hills" },
                  drop: { address: "Biju Patnaik Airport (BBI)" },
                  vehicleType: "sedan",
                  fare: { total: 410 },
                  status: "trip_completed"
                },
                {
                  _id: "bk_demo_2",
                  bookingId: "FLT-9188",
                  rider: { name: user?.name || "Rahul Sharma" },
                  pickup: { address: "Fortune Tower, Maitree Vihar" },
                  drop: { address: "Esplanade Mall, Rasulgarh" },
                  vehicleType: "suv",
                  fare: { total: 366 },
                  status: "captain_arriving"
                }
              ]}
              onViewInvoice={(b) => setSelectedInvoice(b)}
            />
          </div>

        </main>
      </div>

      {selectedInvoice && (
        <InvoiceModal
          booking={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {selectedReview && (
        <RatingModal
          booking={selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      )}

      {/* Rider Welcome Offer Pop-up (30% off 1st ride, 20% off 2nd ride) */}
      <RiderWelcomeOfferModal
        isOpen={showOfferModal}
        onClose={handleCloseOfferModal}
        completedRidesCount={rideCount}
      />
    </div>
  );
}
