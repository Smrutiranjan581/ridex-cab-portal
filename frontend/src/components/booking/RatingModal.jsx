import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Star, CheckCircle2, Heart, Award, ShieldCheck, ThumbsUp, DollarSign, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export default function RatingModal({ booking, onClose, onSubmitSuccess }) {
  // Clean empty initial states - nothing is auto selected
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tipAmount, setTipAmount] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  if (!booking) return null;

  const compliments = [
    { label: "Smooth Driving", icon: "🚗" },
    { label: "Polite Captain", icon: "🌟" },
    { label: "Clean Vehicle", icon: "✨" },
    { label: "On-time Arrival", icon: "⏱️" },
    { label: "Safe Driving", icon: "🛡️" },
    { label: "Good Route", icon: "🗺️" }
  ];

  const ratingDescriptions = {
    0: "Tap a star to rate your ride ⭐",
    5: "Excellent! Loved the ride 😍",
    4: "Good! Great commute 😊",
    3: "Average ride experience 🙂",
    2: "Below expectations 😕",
    1: "Poor experience 😞"
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);

    const bookingTargetId = booking.bookingId || booking._id || booking.id;
    const addedTip = Number(tipAmount) || 0;

    try {
      await api.post('/reviews/submit', {
        bookingId: bookingTargetId,
        rating,
        tags: selectedTags,
        tipAmount: addedTip,
        comment
      });
    } catch (err) {}

    // 1. Update Captain Trip History to record tip and update total fare
    let resolvedCaptainEmail = booking.captain?.email || booking.captainEmail || '';
    let resolvedCaptainPhone = booking.captain?.phone || booking.captainPhone || '';

    try {
      const historyRaw = JSON.parse(localStorage.getItem('ridex_captain_trip_history') || '[]');
      let matched = false;
      const updatedHistory = historyRaw.map(trip => {
        const tripId = trip.bookingId || trip._id;
        if (tripId === bookingTargetId || (!matched && !tripId)) {
          matched = true;
          resolvedCaptainEmail = resolvedCaptainEmail || trip.captainEmail || '';
          resolvedCaptainPhone = resolvedCaptainPhone || trip.captainPhone || '';
          
          const existingBase = trip.fare?.baseFare || (trip.tip ? (trip.fare?.total - trip.tip) : (trip.fare?.total || trip.fare || 180));
          const newTotalFare = existingBase + addedTip;

          return {
            ...trip,
            rating,
            tip: addedTip,
            feedbackTags: selectedTags,
            feedbackComment: comment,
            fare: {
              ...trip.fare,
              baseFare: existingBase,
              total: newTotalFare,
              tip: addedTip
            }
          };
        }
        return trip;
      });

      localStorage.setItem('ridex_captain_trip_history', JSON.stringify(updatedHistory));
    } catch (e) {}

    // 2. If Tip added, record a dedicated CREDIT transaction in Captain's Ledger
    if (addedTip > 0) {
      try {
        const existingTxns = JSON.parse(localStorage.getItem('ridex_captain_transactions') || '[]');
        
        // Check if tip transaction already exists for this trip
        const tipExists = existingTxns.some(t => t.bookingId === bookingTargetId && t.category === 'rider_tip');
        if (!tipExists) {
          const tipTxn = {
            id: 'TIP-' + Math.floor(100000 + Math.random() * 900000),
            captainEmail: resolvedCaptainEmail,
            captainPhone: resolvedCaptainPhone,
            type: 'CREDIT',
            amount: addedTip,
            title: '⭐ Passenger Tip Received',
            subtitle: `Tip for Trip #${bookingTargetId} from ${booking.rider?.name || 'Passenger'}`,
            bookingId: bookingTargetId,
            date: new Date().toISOString(),
            status: 'SUCCESS',
            category: 'rider_tip'
          };
          existingTxns.unshift(tipTxn);
          localStorage.setItem('ridex_captain_transactions', JSON.stringify(existingTxns));
        }

        // 3. Send real-time notification to Captain's Drawer
        const targetEmail = (resolvedCaptainEmail || 'captain@cab.com').toLowerCase();
        const notifKey = `ridex_user_notifications_${targetEmail}`;
        const existingNotifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
        existingNotifs.unshift({
          id: 'notif_tip_' + Date.now(),
          title: `🌟 ₹${addedTip} Tip Received!`,
          desc: `Passenger ${booking.rider?.name || 'Rider'} gave you ${rating}⭐ and tipped ₹${addedTip} for trip #${bookingTargetId}. Added to your wallet balance!`,
          time: 'Just now',
          type: 'tip_received',
          amount: addedTip,
          createdAt: new Date().toISOString(),
          isRead: false
        });
        localStorage.setItem(notifKey, JSON.stringify(existingNotifs));

        // 4. Broadcast live update
        if ('BroadcastChannel' in window) {
          const ch = new BroadcastChannel('ridex_dispatch_channel');
          ch.postMessage({
            type: 'RIDER_TIP_ADDED',
            bookingId: bookingTargetId,
            captainEmail: targetEmail,
            tipAmount: addedTip,
            rating: rating
          });
          ch.close();
        }
      } catch (e) {}
    }

    // Clean active live trip
    try {
      const activeTrip = localStorage.getItem('fleetcorp_live_active_trip');
      if (activeTrip) {
        localStorage.removeItem('fleetcorp_live_active_trip');
      }
    } catch (e) {}

    setIsSubmitting(false);
    setIsSubmitted(true);

    if (onSubmitSuccess) {
      onSubmitSuccess();
    }
  };

  const handleFinishAndBookAnother = () => {
    onClose();
    navigate('/rider/book');
  };

  const captainName = booking?.captain?.name || "Captain Jitendra Mohanty";
  const vehicleModel = booking?.vehicle?.model || "RideX Verified Vehicle";
  const vehicleNumber = booking?.vehicle?.numberPlate || "OD-02-AB-1234";
  const fare = booking?.fare?.total || booking?.fare || 180;
  const distanceKm = booking?.distanceKm || 12.5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 my-8 text-center space-y-5 animate-in zoom-in-95">
        
        {/* Top close */}
        <button
          onClick={handleFinishAndBookAnother}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          /* Submitted Celebration Screen */
          <div className="py-6 space-y-5 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto text-4xl shadow-xl shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Thank You for Your Feedback!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Your rating has been shared with {captainName}. Hope you had a safe and comfortable ride with RideX!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 max-w-xs mx-auto text-xs font-bold text-amber-700 dark:text-amber-300">
              ⭐ {rating}.0 Stars • ₹{fare + tipAmount} Total Paid
            </div>

            <button
              onClick={handleFinishAndBookAnother}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              Book Another RideX ➔
            </button>
          </div>
        ) : (
          /* Real Uber/Rapido Rating Form */
          <>
            {/* Header */}
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Trip Completed
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                You've Reached Your Destination!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rate your commute experience with your Captain
              </p>
            </div>

            {/* Trip Fare Summary Pill */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-left">
              <div>
                <p className="text-[10px] uppercase font-extrabold text-slate-400">Total Fare</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  ₹{fare}
                </p>
                <p className="text-[11px] text-slate-500 font-semibold">{distanceKm} KM • Ride Completed</p>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase font-extrabold text-slate-400">Captain</p>
                <p className="text-xs font-black text-slate-900 dark:text-white">{captainName}</p>
                <p className="text-[10px] font-mono text-slate-500">{vehicleModel} • {vehicleNumber}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Star Rating Section */}
              <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  How was your ride with {captainName}?
                </p>

                <div className="flex justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-9 h-9 transition-colors ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400 drop-shadow-md'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <p className={`text-xs font-black min-h-[18px] transition-colors ${
                  rating > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                }`}>
                  {ratingDescriptions[rating]}
                </p>
              </div>

              {/* Compliments / Tags (Clean unselected by default) */}
              <div className="space-y-2 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  What went well? (Optional compliments)
                </p>
                <div className="flex flex-wrap gap-2">
                  {compliments.map((comp, i) => {
                    const isSelected = selectedTags.includes(comp.label);
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => toggleTag(comp.label)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-black scale-105'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-400'
                        }`}
                      >
                        <span>{comp.icon}</span>
                        <span>{comp.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tip the Captain (Optional) */}
              <div className="space-y-2 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Add a Tip for Captain (Optional)</span>
                  {tipAmount > 0 && <span className="text-emerald-500 font-bold">+₹{tipAmount}</span>}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 10, 20, 50].map((amt) => {
                    const isTipSelected = tipAmount === amt;
                    return (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setTipAmount(amt)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          amt > 0 && isTipSelected
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-md font-black'
                            : amt === 0 && isTipSelected
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 font-black'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {amt === 0 ? "No Tip" : `+ ₹${amt}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment text box */}
              <div>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a note to your captain (optional)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Submitting..."
                  : rating === 0
                  ? "Please Tap a Star Rating to Submit ⭐"
                  : `Submit ${rating}-Star Rating & Finish ➔`}
              </button>

            </form>
          </>
        )}

      </div>
    </div>
  );
}
