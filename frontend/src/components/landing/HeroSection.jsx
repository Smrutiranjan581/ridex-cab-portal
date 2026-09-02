import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Car, ArrowRight, ShieldCheck, Clock, Sparkles, CheckCircle2, 
  Navigation, Zap, Shield, Award, Users, DollarSign 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import RideMotionVideoShowcase from './RideMotionVideoShowcase';
import RideXLogo from '../common/RideXLogo';

export default function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden py-12 lg:py-20 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent transition-colors">
      {/* Background ambient lighting */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-400/20 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Rapido-Style Banner Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-amber-500/30 text-xs font-bold text-slate-900 dark:text-amber-300 shadow-md">
          <div className="flex items-center gap-3">
            <RideXLogo size="sm" showSubtitle={false} />
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
            <span className="hidden sm:inline font-black text-slate-700 dark:text-slate-200">
              Bharat's Favorite Bike Taxi, Auto & Cab Network
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
            <span>📍 100+ Cities</span>
            <span>•</span>
            <span>⭐ 4.9 App Rating</span>
            <span>•</span>
            <span>🛡️ 100% Insured Rides</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Heading, Description & Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-6 text-center lg:text-left"
          >
            
            {/* Title & Subtitle */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Zero Surge Pricing • 2-Min Pickup Guarantee</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                Every Ride, <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600">
                  Affordable & Fast on RideX
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl font-medium leading-relaxed mx-auto lg:mx-0">
                Beat the city traffic with instant Bike Taxis, comfortable Autos, and verified Cabs. Low upfront fares, zero surge surprises, and doorstep pickup in 2 minutes.
              </p>
            </div>

            {/* Quick Action CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start">
              {user?.role === 'captain' ? (
                <Link
                  to="/captain"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/30 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Navigation className="w-5 h-5" /> Go to Captain Cockpit ➔
                </Link>
              ) : (
                <Link
                  to="/rider/book"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/30 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Zap className="w-5 h-5 fill-slate-950" /> Book a Ride Now ➔
                </Link>
              )}
            </div>

            {/* Rapido Trust Highlights */}
            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-slate-200/80 dark:border-slate-800 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Verified Captains
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" /> Zero Surge Fares
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Clock className="w-4 h-4 text-blue-500 shrink-0" /> 24x7 Support Desk
              </div>
            </div>

          </motion.div>

          {/* Right Column: Live Telemetry & Ride Showcase */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-6"
          >
            <RideMotionVideoShowcase isCaptain={user?.role === 'captain'} />
          </motion.div>

        </div>

      </div>
    </section>
  );
}
