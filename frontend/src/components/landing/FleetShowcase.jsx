import React from 'react';
import { Users, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FleetShowcase() {
  const cabs = [
    {
      type: "Bike Taxi (Moto)",
      badge: "Fastest in Traffic",
      icon: "🏍️",
      capacity: "1 Seat",
      rate: "Base ₹20 + ₹8/km",
      features: ["Solo Commute", "Instant Pickup in Traffic", "Sanitized Helmet"]
    },
    {
      type: "RideX Auto",
      badge: "Economical",
      icon: "🛺",
      capacity: "3 Seats",
      rate: "Base ₹30 + ₹12/km",
      features: ["Zero Bargaining", "Doorstep Pickup", "Cash / UPI Accepted"]
    },
    {
      type: "Mini (Hatchback)",
      badge: "Daily Commute",
      icon: "🚗",
      capacity: "4 Seats",
      rate: "Base ₹60 + ₹15/km",
      features: ["AC Hatchback", "Affordable Daily Travel", "Compact Luggage"]
    },
    {
      type: "Sedan (Prime)",
      badge: "Corporate Choice",
      icon: "🚘",
      capacity: "4 Seats",
      rate: "Base ₹90 + ₹18/km",
      features: ["Spacious Boot Space", "Top-Rated Captains", "Complimentary AC"]
    },
    {
      type: "SUV (Spacious)",
      badge: "Team & Family",
      icon: "🚙",
      capacity: "6 Seats",
      rate: "Base ₹140 + ₹24/km",
      features: ["Innova / Ertiga", "Extra Legroom", "Large Luggage Space"]
    }
  ];

  return (
    <section id="fleet" className="py-20 bg-slate-100/60 dark:bg-slate-900/40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black tracking-widest uppercase text-amber-600 dark:text-amber-400">
            RideX Fleet Matrix
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
            A Ride for Every Pocket & Journey
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Choose from Bike Taxis, Autos, and AC Cabs with upfront transparent pricing
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {cabs.map((cab, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:border-amber-500/60 hover:shadow-2xl hover:-translate-y-1 transition-all"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-3xl">{cab.icon}</span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-xs">
                    {cab.badge}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{cab.type}</h3>
                <p className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono mt-1">{cab.rate}</p>
                
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-amber-500" /> {cab.capacity}
                  </p>
                  {cab.features.map((f, i) => (
                    <p key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 font-medium">
                      <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" /> {f}
                    </p>
                  ))}
                </div>
              </div>

              <Link
                to="/rider/book"
                className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" /> Book RideX
              </Link>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
