import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import BookingsTable from '../../components/dashboard/BookingsTable';
import InvoiceModal from '../../components/booking/InvoiceModal';
import RatingModal from '../../components/booking/RatingModal';
import { useAuth } from '../../context/AuthContext';
import { compileRealRiderTrips } from '../../utils/realRides';
import api from '../../services/api';

export default function MyRidesPage() {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);

  const loadTrips = async () => {
    let apiList = [];
    try {
      const res = await api.get('/bookings/my-rides');
      if (res.data?.success && Array.isArray(res.data.rides)) {
        apiList = res.data.rides;
      }
    } catch (err) {}

    const compiled = compileRealRiderTrips(user, apiList);
    const tableFormat = compiled.map(r => ({
      _id: r._id,
      bookingId: r.id,
      rider: { name: user?.name || "Corporate Passenger", email: user?.email },
      pickup: { address: r.pickup },
      drop: { address: r.drop },
      vehicleType: r.vehicleType,
      fare: { total: r.fare },
      status: r.status === 'completed' ? 'trip_completed' : (r.status === 'cancelled' ? 'cancelled' : 'captain_arriving'),
      createdAt: r.date,
      date: r.date
    }));

    setRides(tableFormat);
  };

  useEffect(() => {
    loadTrips();

    const interval = setInterval(loadTrips, 5000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Trip Records
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              My Ride History
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              View all completed, active, and past corporate trips
            </p>
          </div>

          <BookingsTable
            bookings={rides}
            onViewInvoice={(b) => setSelectedInvoice(b)}
          />
        </main>
      </div>

      {selectedInvoice && (
        <InvoiceModal
          booking={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
