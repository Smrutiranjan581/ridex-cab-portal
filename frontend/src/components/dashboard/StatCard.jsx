import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({ title, value, change, isPositive = true, icon: Icon, onClick, subtitle }) {
  const isClickable = !!onClick;

  return (
    <div 
      onClick={onClick}
      className={`glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-sm transition-all ${
        isClickable ? 'cursor-pointer hover:border-amber-500 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] group' : 'hover:shadow-md'
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-amber-500 transition-colors flex items-center gap-1.5">
          {title}
          {isClickable && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded-full">
              Click to View ➔
            </span>
          )}
        </span>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{value}</h3>
        {change && (
          <div className="flex items-center gap-1 mt-1 text-xs font-bold">
            {isPositive ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> {change}
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5" /> {change}
              </span>
            )}
            {subtitle && <span className="text-slate-400 font-normal">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
