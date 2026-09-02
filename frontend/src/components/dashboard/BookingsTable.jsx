import React, { useState } from 'react';
import { Search, FileText, CheckCircle2, Clock, XCircle, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BookingsTable({ bookings = [], onViewInvoice }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      b.bookingId?.toLowerCase().includes(search.toLowerCase()) ||
      b.rider?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.pickup?.address?.toLowerCase().includes(search.toLowerCase()) ||
      b.drop?.address?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (st) => {
    switch (st) {
      case 'trip_completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'captain_arriving':
      case 'captain_assigned':
      case 'trip_started':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 animate-pulse"><Clock className="w-3 h-3" /> Active</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"><XCircle className="w-3 h-3" /> Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Confirmed</span>;
    }
  };

  return (
    <div className="glass-card rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search booking ID, route, rider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['all', 'trip_completed', 'captain_arriving', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors shrink-0 ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Rides' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
            <tr>
              <th className="px-5 py-3">Booking ID</th>
              <th className="px-5 py-3">Rider / Route</th>
              <th className="px-5 py-3">Vehicle</th>
              <th className="px-5 py-3">Fare</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 text-3xl flex items-center justify-center mx-auto mb-3">
                    🚖
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">No Trips in Log</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Once you accept and complete passenger rides on the Captain Dashboard, your live earnings and trip records will be logged here automatically.
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                    {b.bookingId || "RDX-9042"}
                  </td>
                <td className="px-5 py-4">
                  <p className="font-bold text-slate-900 dark:text-white">{b.rider?.name || "Rahul Sharma"}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                    {b.pickup?.address} ➔ {b.drop?.address}
                  </p>
                </td>
                <td className="px-5 py-4 uppercase font-bold text-slate-700 dark:text-slate-300">
                  {b.vehicleType || "Sedan"}
                </td>
                <td className="px-5 py-4 font-extrabold text-amber-600 dark:text-amber-400">
                  ₹{b.fare?.total || 410}
                </td>
                <td className="px-5 py-4">
                  {getStatusBadge(b.status)}
                </td>
                <td className="px-5 py-4 text-right space-x-2">
                  {b.status === 'trip_completed' && onViewInvoice && (
                    <button
                      onClick={() => onViewInvoice(b)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" /> Invoice
                    </button>
                  )}
                  {b.status !== 'trip_completed' && b.status !== 'cancelled' && (
                    <Link
                      to={`/rider/track/${b._id}`}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Track Live
                    </Link>
                  )}
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
