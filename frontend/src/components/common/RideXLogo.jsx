import React from 'react';
import { Zap } from 'lucide-react';

export default function RideXLogo({ 
  size = 'md', 
  showText = true, 
  showSubtitle = true, 
  subtitle = 'Smart City Commute',
  className = '',
  adminBadge = false 
}) {
  // Dimensions map
  const sizes = {
    sm: { icon: 'w-7 h-7 text-xs', text: 'text-base', sub: 'text-[8px]', logoBox: 'w-7 h-7 rounded-lg' },
    md: { icon: 'w-9 h-9 text-sm', text: 'text-xl', sub: 'text-[9px]', logoBox: 'w-9 h-9 rounded-xl' },
    lg: { icon: 'w-12 h-12 text-lg', text: 'text-2xl sm:text-3xl', sub: 'text-[11px]', logoBox: 'w-12 h-12 rounded-2xl' },
    xl: { icon: 'w-16 h-16 text-2xl', text: 'text-4xl', sub: 'text-xs', logoBox: 'w-16 h-16 rounded-3xl' },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* High-Impact Geometric RideX Emblem */}
      <div className={`relative ${s.logoBox} bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
        <div className="w-full h-full bg-slate-950 rounded-[inherit] flex items-center justify-center relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 via-transparent to-amber-500/10" />
          
          {/* Stylized Vector Emblem */}
          <svg viewBox="0 0 40 40" className="w-4/5 h-4/5 fill-none" xmlns="http://www.w3.org/2000/svg">
            {/* Speed tracks */}
            <path d="M4 28L14 12H20L10 28H4Z" fill="#F59E0B" fillOpacity="0.6" />
            {/* Bold Stylized R */}
            <path d="M12 10H24C27.5 10 29.5 12 29.5 15C29.5 17.5 28 19.5 25.5 20.2L30.5 30H24L19.5 21H16V30H12V10ZM16 14V17.5H23.5C24.8 17.5 25.5 16.6 25.5 15.5C25.5 14.4 24.8 14 23.5 14H16Z" fill="#FFFFFF" />
            {/* Electric Accent Lightning Bolt for X */}
            <path d="M26 8L20 20H25L21 32L34 18H28L31 8H26Z" fill="#FBBF24" />
          </svg>
        </div>

        {/* Outer subtle glow dot */}
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping opacity-75" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-950" />
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1 leading-none">
            <span className={`${s.text} font-black tracking-tight text-slate-900 dark:text-white`}>
              Ride<span className="text-amber-500">X</span>
            </span>
            {adminBadge && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                Admin
              </span>
            )}
          </div>
          {showSubtitle && (
            <span className={`${s.sub} font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400 mt-0.5`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
