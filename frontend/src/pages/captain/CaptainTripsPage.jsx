import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import BookingsTable from '../../components/dashboard/BookingsTable';
import InvoiceModal from '../../components/booking/InvoiceModal';
import { DollarSign, CheckCircle2, Navigation, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function CaptainTripsPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const loadRealTrips = () => {
    try {
      const stored = localStorage.getItem('ridex_captain_trip_history');
      if (stored) {
        const list = JSON.parse(stored);
        const myTrips = list.filter(t => {
          if (!user) return false;
          const myEmail = user.email ? user.email.toLowerCase() : '';
          const myPhone = user.phone ? user.phone.replace(/[^0-9]/g, '').slice(-10) : '';

          const tEmail = (t.captainEmail || t.captain?.email || '').toLowerCase();
          const tPhone = (t.captainPhone || t.captain?.phone || '').replace(/[^0-9]/g, '').slice(-10);

          if (myEmail && tEmail && myEmail === tEmail) return true;
          if (myPhone && tPhone && myPhone === tPhone) return true;

          // Demo account fallback
          if (myEmail === 'captain@cab.com' && !tEmail && !tPhone) return true;
          return false;
        });
        setTrips(myTrips);
      } else {
        setTrips([]);
      }
    } catch (e) {
      setTrips([]);
    }
  };

  useEffect(() => {
    loadRealTrips();
    window.addEventListener('storage', loadRealTrips);
    return () => window.removeEventListener('storage', loadRealTrips);
  }, [user]);

  const totalEarnings = trips.reduce((acc, t) => acc + (t.fare?.total || t.fare || 0), 0);
  const totalKm = trips.reduce((acc, t) => acc + (t.distanceKm || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Real Earnings & History
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                Captain Trip Log
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your live completed rides, fare payouts, and trip distances
              </p>
            </div>

            {/* Quick Live Summary Stats */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  ₹
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Earned</p>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">₹{totalEarnings}</p>
                </div>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Completed</p>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">{trips.length} Rides</p>
                </div>
              </div>
            </div>
          </div>

          <BookingsTable 
            bookings={trips} 
            onViewInvoice={(booking) => setSelectedInvoice(booking)} 
          />

          {selectedInvoice && (
            <InvoiceModal 
              booking={selectedInvoice} 
              onClose={() => setSelectedInvoice(null)} 
            />
          )}
        </main>
      </div>
    </div>
  );
}
