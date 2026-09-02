import React from 'react';
import { Car, Shield, Phone, Mail, MapPin, Heart, Sparkles, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import RideXLogo from './RideXLogo';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <Link to="/" className="inline-block group">
              <RideXLogo size="lg" subtitle="Smart Mobility Network" />
            </Link>
            <p className="text-xs leading-relaxed font-medium">
              Bharat's fastest growing Bike Taxi, Auto, and Cab-hailing network with zero surges, instant GPS dispatch, and verified captains.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-bold pt-1">
              <Shield className="w-4 h-4 text-emerald-500" /> 100% Insured Rides & Verified Captains
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3">RideX Portals</h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li><Link to="/rider/book" className="hover:text-amber-500 transition-colors">Book a RideX</Link></li>
              <li><Link to="/register?role=captain" className="hover:text-amber-500 transition-colors">Become a Captain (Drive & Earn)</Link></li>
              <li><Link to="/captain" className="hover:text-amber-500 transition-colors">Captain Cockpit Dashboard</Link></li>
              <li><Link to="/login" className="hover:text-amber-500 transition-colors">User Sign In / Register</Link></li>
            </ul>
          </div>

          {/* RideX Categories */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3">RideX Offerings</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>🏍️ Bike Taxi (Fastest in Traffic)</li>
              <li>🛺 RideX Auto (No Bargaining)</li>
              <li>🚗 Sedan Prime (AC Daily Travel)</li>
              <li>🚙 SUV Prime (Spacious Group Commute)</li>
              <li>📦 Parcel Express (Hyperlocal Delivery)</li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3">24x7 Help Desk</h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500" /> +91 1800-RIDEX-INDIA
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500" /> support@ridex.in
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0" /> Bharatpur, G. A. Colony, Bhubaneswar, Odisha
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4">
          <p>© 2026 RideX Technologies Pvt Ltd. All rights reserved.</p>
          <p className="flex items-center gap-1 font-medium">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for commuters across India
          </p>
        </div>
      </div>
    </footer>
  );
}
