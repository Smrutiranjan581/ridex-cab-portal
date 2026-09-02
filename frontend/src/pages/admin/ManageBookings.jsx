import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import BookingsTable from '../../components/dashboard/BookingsTable';
import InvoiceModal from '../../components/booking/InvoiceModal';
import api from '../../services/api';

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/admin/bookings');
        if (res.data.success) {
          setBookings(res.data.bookings);
        }
      } catch (err) {
        console.log("Using mock bookings");
      }
    };
    fetchBookings();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Trip Dispatch Master
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              All Bookings & Dispatches
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Master log of all completed, active, and scheduled corporate rides
            </p>
          </div>

          <BookingsTable
            bookings={bookings.length ? bookings : [
              {
                _id: "bk_adm_1",
                bookingId: "FLT-9042",
                rider: { name: "Rahul Sharma", company: "TCS Innovation Hub" },
                pickup: { address: "Infocity IT Hub, Silicon Hills" },
                drop: { address: "Biju Patnaik Airport Terminal 1" },
                vehicleType: "sedan",
                fare: { total: 410 },
                status: "trip_completed"
              },
              {
                _id: "bk_adm_2",
                bookingId: "FLT-9188",
                rider: { name: "Priyanka Jena", company: "Infosys Campus" },
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
