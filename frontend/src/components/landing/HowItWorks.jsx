import React from 'react';
import { MapPin, UserCheck, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: MapPin,
      title: "Set Pickup & Drop",
      desc: "Open RideX on web or app, select Bike Taxi, Auto or Cab, and see guaranteed upfront fares with zero surge."
    },
    {
      number: "02",
      icon: Zap,
      title: "Fast Captain Match (2 Mins)",
      desc: "Nearest verified captain accepts your ride instantly. Track them live on GPS radar with a secure 4-digit OTP."
    },
    {
      number: "03",
      icon: ShieldCheck,
      title: "Safe, Pocket-Friendly Commute",
      desc: "Reach on time, pay via Wallet, UPI or Cash, and rate your captain. 100% insured & tracked 24x7."
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black tracking-widest uppercase text-amber-600 dark:text-amber-400">
            Simple, Fast & Reliable
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
            How RideX Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Booking a ride or driving as a captain takes less than 30 seconds on RideX
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="relative rounded-3xl p-8 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col items-start hover:border-amber-500/50 hover:shadow-xl transition-all">
                <span className="text-4xl font-black text-amber-500/30 dark:text-amber-400/20 mb-3 font-mono">{step.number}</span>
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{step.desc}</p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
