import React, { useState } from 'react';
import { Zap, ShieldCheck, DollarSign, Package, Car, Navigation, Clock, Sparkles, X, CheckCircle2, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function ServicesSection() {
  const [comingSoonItem, setComingSoonItem] = useState(null);

  const services = [
    {
      id: 'bike',
      icon: '🏍️',
      title: "RideX Bike Taxi",
      badge: "Traffic Buster",
      rate: "Fares from ₹20",
      desc: "Fastest solo ride through heavy city traffic. Doorstep pickup with helmet and verified captain.",
      link: "/rider/book",
      isComingSoon: false
    },
    {
      id: 'auto',
      icon: '🛺',
      title: "RideX Auto",
      badge: "Affordable & Fair",
      rate: "Fares from ₹30",
      desc: "No bargaining, no meter tampering. Direct transparent pricing for up to 3 passengers.",
      link: "/rider/book",
      isComingSoon: false
    },
    {
      id: 'cab',
      icon: '🚗',
      title: "RideX Cabs (Prime)",
      badge: "Comfort & AC",
      rate: "Fares from ₹60",
      desc: "Top-rated sedans and hatchbacks with zero surge surprises. Perfect for daily commutes and airport runs.",
      link: "/rider/book",
      isComingSoon: false
    },
    {
      id: 'parcel',
      icon: '📦',
      title: "RideX Parcel Express",
      badge: "Hyperlocal Delivery",
      rate: "Fares from ₹25",
      desc: "Send food boxes, documents, keys, and urgent packages across town with real-time live GPS tracking.",
      link: "/rider/book",
      isComingSoon: true
    }
  ];

  return (
    <section id="services" className="py-20 bg-slate-100/60 dark:bg-slate-900/40 transition-colors relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black tracking-widest uppercase text-amber-600 dark:text-amber-400">
            RideX Mobility Network
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
            Affordable Commute for Every Indian
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-3 font-medium">
            From quick bike taxi rides to comfortable AC cabs, RideX connects you with verified captains within 2 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((item, index) => {
            return (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/60 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl p-2.5 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                      {item.icon}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 shadow-xs">
                      {item.badge}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono mb-2">{item.rate}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                </div>

                {item.isComingSoon ? (
                  <button
                    type="button"
                    onClick={() => setComingSoonItem(item)}
                    className="mt-6 w-full py-3 rounded-2xl bg-slate-100 hover:bg-amber-500 dark:bg-slate-800 dark:hover:bg-amber-500 text-slate-900 dark:text-white hover:text-slate-950 font-black text-xs text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" /> Book Now ➔
                  </button>
                ) : (
                  <Link
                    to={item.link}
                    className="mt-6 w-full py-3 rounded-2xl bg-slate-100 hover:bg-amber-500 dark:bg-slate-800 dark:hover:bg-amber-500 text-slate-900 dark:text-white hover:text-slate-950 font-black text-xs text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" /> Book Now ➔
                  </Link>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* COMING SOON POPUP MODAL */}
      <AnimatePresence>
        {comingSoonItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-amber-500/30 shadow-2xl relative text-center space-y-5"
            >
              {/* Close Button */}
              <button
                onClick={() => setComingSoonItem(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Pulsing Icon */}
              <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/15 text-5xl flex items-center justify-center border-2 border-amber-500/30 shadow-lg shadow-amber-500/20 animate-bounce">
                {comingSoonItem.icon}
              </div>

              {/* Badge & Title */}
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" /> Coming Soon
                </span>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {comingSoonItem.title}
                </h3>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                We are actively expanding! <span className="font-bold text-amber-600 dark:text-amber-400">{comingSoonItem.title}</span> will be launching very soon in your city. You'll be able to send documents, packages, food items, and keys with 1-click live GPS tracking!
              </p>

              {/* Feature Highlights */}
              <div className="grid grid-cols-3 gap-2 text-left pt-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-base">⚡</span>
                  <p className="text-[10px] font-black text-slate-900 dark:text-white mt-0.5">15-Min Pickup</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-base">🔒</span>
                  <p className="text-[10px] font-black text-slate-900 dark:text-white mt-0.5">OTP Handover</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-base">📍</span>
                  <p className="text-[10px] font-black text-slate-900 dark:text-white mt-0.5">Live Radar</p>
                </div>
              </div>

              {/* Close / Got it Button */}
              <button
                type="button"
                onClick={() => setComingSoonItem(null)}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.01] cursor-pointer"
              >
                Got It, Thank You! ➔
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
