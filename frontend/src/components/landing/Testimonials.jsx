import React from 'react';
import { Star, Quote, Award, Sparkles } from 'lucide-react';

export default function Testimonials() {
  const reviews = [
    {
      name: "Rahul Sharma",
      role: "Daily Commuter",
      company: "Infocity IT Hub",
      text: "RideX Bike Taxi has made daily office commute 10x faster. Beating heavy morning traffic in 15 minutes instead of 45 minutes by car is a life saver!",
      stars: 5,
      vehicle: "🏍️ Bike Taxi"
    },
    {
      name: "Priyanka Jena",
      role: "Passenger",
      company: "Khandagiri",
      text: "The RideX Auto feature is fantastic—no arguing over meters, no waiting. The Captains are polite and the app is super smooth and responsive.",
      stars: 5,
      vehicle: "🛺 RideX Auto"
    },
    {
      name: "Rajesh Mohapatra",
      role: "RideX Captain Partner",
      company: "Verified Driver",
      text: "As a Captain, the 15-minute bank payout guarantee and 0% commission on first month make RideX the best platform for daily livelihood earnings.",
      stars: 5,
      vehicle: "⭐ Top Captain"
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-black tracking-widest uppercase text-amber-600 dark:text-amber-400">
            Rider & Captain Trust
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
            Loved by Millions of Commuters Across India
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Read real stories from daily passengers and verified RideX Captains
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <div key={i} className="rounded-3xl p-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-amber-500/50 hover:shadow-xl transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(r.stars)].map((_, s) => (
                      <Star key={s} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    {r.vehicle}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium italic">
                  "{r.text}"
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-amber-500/20">
                  {r.name[0]}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">{r.name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">{r.role} • {r.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
