import React from 'react';
import { Sparkles, Ticket, CheckCircle2, ArrowRight, X, Clock, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RiderWelcomeOfferModal({ isOpen, onClose, completedRidesCount }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isFirstRide = completedRidesCount === 0;
  const isSecondRide = completedRidesCount === 1;

  const handleClaimAndBook = () => {
    onClose();
    navigate('/rider/book');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-amber-500/50 space-y-6 animate-in zoom-in-95 text-center overflow-hidden">
        
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center mx-auto text-4l shadow-xl shadow-amber-500/30 ring-8 ring-amber-500/15 animate-bounce">
          🐁
        </div>


        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" /> Exclusive Welcome Rewards
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome to RideX Mobility!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Enjoy special introductory discounts on your first two rides.
          </p>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left pt-1">
          
          <div className={parseIsFirstRide ? 'p-4 rounded-2xl border-2 border-amber-500 bg-amber-500/10 dark:bg-amber-950/40 ring-2 ring-amber-500/30 shadow-md' : 'p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 opacity-80'}>
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5" /> 1st Ride
              </span>
              <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 shadow-xs">
                FIRST30
              </span>
            </div>
            <div className="pt-2.5 space-y-1">
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                30% OFF
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug">
                Instant 30% discount automatically applied on your 1st ride booking.
              </p>
            </div>
            <div className="pt-2.5">
              {isFirstRide ? (
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active on This Ride!
                </span>
            ) : (
                <span className="text-[10px] font-bold text-slate-400 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Completed
                </span>
            )}
            </div>
          </div>


          <div className={isSecondRide ? 'p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/40 ring-2 ring-emerald-500/30 shadow-md' : 'p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 opacity-80'}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> 2nd Ride
              </span>
              <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 shadow-xs">
                RIDE20
              </span>
            </div>
            <div className="pt-2.5 space-y-1">
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                20% OFF
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug">
                Instant 20% special discount applies on your second ride.
              </p>
            </div>
            <div className="pt-2.5">
              {isSecondRide ? (
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active on This Ride!
                </span>
            ) : isFirstRide ? (
                <span className="text-[10px] font-bold text-slate-400 inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Unlocks on 2nd Ride
                </span>
            ) : (
                <span className="text-[10px] font-bold text-slate-400 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Completed
                </span>
            )}
            </div>
          </div>

        </div>


        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-left text-[11px] text-slate-600 dark:text-slate-300 font-medium space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>Welcome Offer Terms</span>
          </div>
          <p className="leading-relaxed text-slate-500 dark:text-slate-400 text-[10px]">
            • 30% OFF on 1st ride + 20% special discount on 2nd ride. After your 2nd completed ride, standard fares will apply automatically with zero surge pricing.
          </p>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={onClose}
            className="py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer order-2 sm:order-1"
          >
            Maybe Later
          </button>
          <button
            onClick={handleClaimAndBook}
            className="py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 transition-transform hover:scale-105 cursor-pointer order-1 sm:order-2"
          >
            <span>Claim & Book Ride</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
