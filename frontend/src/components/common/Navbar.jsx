import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, Menu, X, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import Notifications from './Notifications';
import ProfileDrawerModal from './ProfileDrawerModal';
import RideXLogo from './RideXLogo';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'captain') return '/captain';
    return '/rider/book';
  };

  const isCurrent = (path) => location.pathname === path && !location.hash;

  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const scrollToTop = () => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <button 
          onClick={() => {
            if (user?.role === 'admin') {
              navigate('/admin');
            } else {
              scrollToTop();
            }
          }} 
          className="flex items-center gap-3 group text-left cursor-pointer"
        >
          <RideXLogo 
            size="md" 
            adminBadge={user?.role === 'admin'} 
            subtitle={user?.role === 'admin' ? 'Super Admin Portal' : 'Smart City Commute'} 
          />
        </button>

        {/* Desktop Navigation Links (Admin sees dedicated console badge instead of public marketing links) */}
        {user?.role === 'admin' ? (
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-700 dark:text-purple-300 font-extrabold text-xs">
            <ShieldCheck className="w-4 h-4 text-purple-500" /> Executive Fleet Command Console
          </div>
        ) : (
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <button
              onClick={scrollToTop}
              className={`hover:text-amber-500 transition-colors ${isCurrent('/') ? 'text-amber-500 font-bold' : ''}`}
            >
              Home
            </button>
            
            {user?.role !== 'captain' && (
              <button
                onClick={() => scrollToSection('services')}
                className="hover:text-amber-500 transition-colors"
              >
                Services
              </button>
            )}
            
            {user?.role !== 'captain' && (
              <button
                onClick={() => scrollToSection('fleet')}
                className="hover:text-amber-500 transition-colors"
              >
                Our Fleet
              </button>
            )}
            
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-amber-500 transition-colors"
            >
              How It Works
            </button>
          </nav>
        )}

        {/* Actions / CTA */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* Profile button shown only for Riders and Captains, hidden for Admin */}
              {user?.role !== 'admin' && (
                <button
                  onClick={() => setShowProfileDrawer(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 hover:border-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer shadow-sm group"
                >
                  <img
                    src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                    alt="Profile"
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-amber-500/50 group-hover:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                    Profile
                  </span>
                </button>
              )}

              {/* Logout button shown only for Admin in Navbar */}
              {user?.role === 'admin' && (
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/rider/book"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all hover:scale-[1.02]"
              >
                <Car className="w-4 h-4" /> Book Ride
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-4 pt-4 pb-6 space-y-3">
          <button
            onClick={scrollToTop}
            className="w-full text-left block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Home
          </button>
          
          {user?.role !== 'captain' && (
            <button
              onClick={() => scrollToSection('services')}
              className="w-full text-left block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Services
            </button>
          )}
          
          {user?.role !== 'captain' && (
            <button
              onClick={() => scrollToSection('fleet')}
              className="w-full text-left block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Our Fleet
            </button>
          )}
          
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="w-full text-left block px-3 py-2 rounded-lg text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            How It Works
          </button>

          {isAuthenticated ? (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <Link
                to={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 mb-2"
              >
                Go to Dashboard ({user?.role})
              </Link>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); navigate('/'); }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                Logout ({user?.name})
              </button>
            </div>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-white"
              >
                Sign In
              </Link>
              <Link
                to="/rider/book"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
              >
                Book a Cab Now
              </Link>
            </div>
          )}
        </div>
      )}
          {showProfileDrawer && (
        <ProfileDrawerModal onClose={() => setShowProfileDrawer(false)} />
      )}
    </header>
  );
}
