import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  Clock,
  Wallet,
  HelpCircle,
  ShieldCheck,
  DollarSign,
  User,
  Car
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { triggerHaptic } from '../../utils/mobileDevice';

export default function MobileBottomNav({ appTarget = 'rider', onOpenProfileDrawer }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleNav = (path, subModal = null) => {
    triggerHaptic('light');
    if (subModal && onOpenProfileDrawer) {
      onOpenProfileDrawer(subModal);
    } else if (path) {
      navigate(path);
    }
  };

  if (appTarget === 'captain' || user?.role === 'captain') {
    const isRadar = location.pathname === '/captain' || location.pathname === '/captain/';
    const isTrips = location.pathname.includes('/captain/trips');

    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
        <button
          onClick={() => handleNav('/captain')}
          className={lex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all }
        >
          <div className={p-1 rounded-xl }>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Duty Radar</span>
        </button>

        <button
          onClick={() => handleNav('/captain/trips')}
          className={lex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all }
        >
          <div className={p-1 rounded-xl }>
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Trips</span>
        </button>

        <button
          onClick={() => handleNav(null, 'wallet')}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
        >
          <div className="p-1 rounded-xl hover:bg-slate-800">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-[10px] tracking-tight">Earnings</span>
        </button>

        <button
          onClick={() => handleNav(null, 'profile')}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
        >
          <div className="p-1 rounded-xl hover:bg-slate-800">
            <User className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Profile & KYC</span>
        </button>
      </nav>
    );
  }

  // Rider Mobile Navigation
  const isBook = location.pathname.includes('/rider/book') || location.pathname === '/';
  const isMyRides = location.pathname.includes('/rider/my-rides');

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
      <button
        onClick={() => handleNav('/rider/book')}
        className={lex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all }
      >
        <div className={p-1 rounded-xl }>
          <Car className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight">Book Ride</span>
      </button>

      <button
        onClick={() => handleNav('/rider/my-rides')}
        className={lex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all }
      >
        <div className={p-1 rounded-xl }>
          <Clock className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight">My Rides</span>
      </button>

      <button
        onClick={() => handleNav(null, 'wallet')}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-amber-500 transition-all cursor-pointer"
      >
        <div className="p-1 rounded-xl">
          <Wallet className="w-5 h-5 text-emerald-500" />
        </div>
        <span className="text-[10px] tracking-tight">Wallet</span>
      </button>

      <button
        onClick={() => handleNav(null, 'help')}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-amber-500 transition-all cursor-pointer"
      >
        <div className="p-1 rounded-xl">
          <HelpCircle className="w-5 h-5 text-amber-500" />
        </div>
        <span className="text-[10px] tracking-tight">AI Help 💬</span>
      </button>
    </nav>
  );
}
