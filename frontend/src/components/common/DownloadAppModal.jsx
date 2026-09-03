import React from 'react';
import { createPortal } from 'react-dom';
import { Smartphone, Download, ShieldCheck, Car, X, QrCode, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function DownloadAppModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return createPortal(
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[9999999] overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-slate-950/85 backdrop-blur-md animate-in fade-in"
    >
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto relative animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-500/15 via-transparent to-transparent border-b border-slate-100 dark:border-slate-800 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 font-black shrink-0">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-full">
                Direct Android APKs
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                Download RideX Mobile Apps
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Install directly on any Android smartphone with zero Play Store fees. Fast, lightweight & 100% connected to real-time dispatch.
          </p>
        </div>

        {/* Apps Selection Cards */}
        <div className="p-4 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
          
          {/* Card 1: Rider App */}
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:border-amber-500 transition-all group">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 mt-0.5">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                    RideX Rider App
                  </h4>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                    30% Off
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  For Commuters & Passengers. Live GPS booking, 30% first ride discount, Wallet, AI Help.
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                  <span>v1.0.0</span>
                  <span>•</span>
                  <span>25.7 MB</span>
                  <span>•</span>
                  <span className="text-emerald-500 font-bold">Android 8.0+</span>
                </div>
              </div>
            </div>

            <a
              href="/apks/RideX_Rider.apk"
              download="RideX_Rider.apk"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 shrink-0 transition-all hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>Download APK</span>
            </a>
          </div>

          {/* Card 2: Captain App */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:border-amber-500 transition-all group">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-900 dark:bg-slate-800 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-md mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                    RideX Partner Captain App
                  </h4>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase">
                    Drivers
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  For Drivers & Fleet Captains. Duty Switch, Incoming Ride Audio Siren, Payouts & Passbook.
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                  <span>v1.0.0</span>
                  <span>•</span>
                  <span>25.7 MB</span>
                  <span>•</span>
                  <span className="text-emerald-500 font-bold">Android 8.0+</span>
                </div>
              </div>
            </div>

            <a
              href="/apks/RideX_Partner_Captain.apk"
              download="RideX_Partner_Captain.apk"
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-amber-500 dark:hover:bg-amber-400 dark:hover:text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-2 shrink-0 transition-all hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>Download APK</span>
            </a>
          </div>

          {/* Quick Install Guide Callout */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Installation Guide:
            </p>
            <p className="leading-relaxed">
              1. Tap <b>Download APK</b> & click <b>Open</b> on your phone. <br />
              2. If prompted, allow <b>"Install Unknown Apps"</b> in Android Settings. <br />
              3. Launch RideX and enjoy real-time smart mobility!
            </p>
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
}
