import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import BookingsTable from '../../components/dashboard/BookingsTable';
import InvoiceModal from '../../components/booking/InvoiceModal';
import RatingModal from '../../components/booking/RatingModal';
import api from '../../services/api';

export default function MyRidesPage() {
  const [rides, setRides] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const res = await api.get('/bookings/my-rides');
        if (res.data.success) {
          setRides(res.data.rides);
        }
      } catch (err) {
        console.log("Using mock rides");
      }
    };
    fetchRides();
  }, []);

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
            bookings={rides.length ? rides : [
              {
                _id: "bk_demo_1",
                bookingId: "FLT-9042",
                pickup: { address: "Infocity IT Hub, Silicon Hills" },
                drop: { address: "Biju Patnaik Airport Terminal 1" },
                vehicleType: "sedan",
                fare: { total: 410 },
                status: "trip_completed"
              },
              {
                _id: "bk_demo_2",
                bookingId: "FLT-9188",
                pickup: { address: "Fortune Tower, Maitree Vihar" },
                drop: { address: "Esplanade Mall, Rasulgarh" },
                vehicleType: "suv",
                fare: { total: 366 },
                status: "captain_arriving"
              }
            ]}
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
