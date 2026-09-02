import React, { useState } from 'react';
import { ChevronRight, X, AlertTriangle, ArrowLeft, CheckCircle2, Car, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CancelRideModal({ onClose, onConfirmCancel }) {
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState("");
  const [isCancelledView, setIsCancelledView] = useState(false);
  const [confirmedReason, setConfirmedReason] = useState("");

  const reasons = [
    "Selected Wrong Pickup Location",
    "Selected Wrong Drop Location",
    "Booked by mistake",
    "Selected different service/vehicle",
    "Taking too long to confirm the ride",
    "Got a ride elsewhere",
    "Others"
  ];

  const handleReasonClick = (reason) => {
    if (reason === "Others") {
      setSelectedReason("Others");
    } else {
      setConfirmedReason(reason);
      setIsCancelledView(true);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const finalReason = customReason.trim() || "Other reason";
    setConfirmedReason(finalReason);
    setIsCancelledView(true);
  };

  const handleFinalDone = () => {
    onConfirmCancel(confirmedReason);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden">
        
        {/* State 1: In-App Cancellation Confirmed Popup */}
        {isCancelledView ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4 space-y-5"
          >
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-3xl shadow-inner animate-bounce">
              🚫
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Ride Cancelled
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your ride request has been cancelled safely
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-300">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Cancellation Reason</span>
              "{confirmedReason}"
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinalDone}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.01]"
              >
                Back to Home / Book Another Ride
              </button>
            </div>
          </motion.div>
        ) : (
          /* State 2: Reasons List */
          <>
            <div className="flex justify-between items-start pb-2">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Why do you want to cancel?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Please provide the reason for cancellation
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />

            {selectedReason !== "Others" ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {reasons.map((reason, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleReasonClick(reason)}
                    className="w-full py-3.5 px-2 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-amber-500 transition-colors">
                      {reason}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleCustomSubmit} className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReason(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to reasons
                </button>
                
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Please specify your reason:
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tell us why you are cancelling..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
                />

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Don't Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md"
                  >
                    Confirm Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                Keep My Ride (Don't Cancel)
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
