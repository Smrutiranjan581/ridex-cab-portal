import React, { useEffect } from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import HeroSection from '../components/landing/HeroSection';
import ServicesSection from '../components/landing/ServicesSection';
import HowItWorks from '../components/landing/HowItWorks';
import FleetShowcase from '../components/landing/FleetShowcase';
import Testimonials from '../components/landing/Testimonials';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Zap, DollarSign, Smartphone, QrCode, Navigation, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  const location = useLocation();
  const { user } = useAuth();

  // If Admin is logged in, strictly keep them on the Admin Dashboard
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />
      
      <main className="flex-1">
        {/* Rapido-Style Hero Booking & Captain Onboarding */}
        <HeroSection />

        {/* Rapido-Style Services (Bike Taxi, Auto, Cabs, Parcel) - Hidden for Captains */}
        {user?.role !== 'captain' && <ServicesSection />}

        {/* Fleet Matrix - Hidden for Captains */}
        {user?.role !== 'captain' && <FleetShowcase />}

        {/* How It Works */}
        <HowItWorks />

        {/* Rapido-Style Safety Commitment Grid */}
        <section className="py-16 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-black tracking-widest uppercase text-amber-600 dark:text-amber-400">
                RideX Safety Shield
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
                Your Safety is Our Top Priority
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-2xl mb-3">
                  🛡️
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">100% Verified Captains</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Police background verified & driving license checked before ride activation.</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl mb-3">
                  📡
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Live GPS Sharing</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Share your real-time trip route and arrival time with family & friends in 1 click.</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mb-3">
                  🚨
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">24x7 Emergency SOS</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Instant SOS alert to local police dispatch and our 24x7 emergency safety response team.</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-2xl mb-3">
                  🩹
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Trip Insurance Cover</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Every completed ride on RideX is insured with up to ₹5,00,000 accidental coverage.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <Testimonials />
      </main>

      <Footer />
    </div>
  );
}
