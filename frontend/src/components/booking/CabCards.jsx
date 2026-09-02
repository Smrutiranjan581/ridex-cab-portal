import React from 'react';
import { Users, Check, Sparkles } from 'lucide-react';

export default function CabCards({ selectedType, onSelectType, estimates, distanceKm, durationMins, hasRoute }) {
  const cabs = [
    {
      id: 'bike',
      name: 'Bike / Moto',
      icon: '🏍️',
      capacity: 1,
      eta: '2 mins away',
      desc: 'Fastest & cheapest solo ride',
      baseRate: 20,
      perKm: 8,
      popular: true
    },
    {
      id: 'auto',
      name: 'Auto / Tuk-Tuk',
      icon: '🛺',
      capacity: 3,
      eta: '3 mins away',
      desc: 'Fastest for city traffic',
      baseRate: 30,
      perKm: 12
    },
    {
      id: 'mini',
      name: 'Mini (Hatchback)',
      icon: '🚗',
      capacity: 4,
      eta: '5 mins away',
      desc: 'Affordable compact AC ride',
      baseRate: 60,
      perKm: 15
    },
    {
      id: 'sedan',
      name: 'Sedan (Prime)',
      icon: '🚘',
      capacity: 4,
      eta: '4 mins away',
      desc: 'Comfortable with top captains',
      baseRate: 90,
      perKm: 18
    },
    {
      id: 'suv',
      name: 'SUV (Spacious)',
      icon: '🚙',
      capacity: 6,
      eta: '6 mins away',
      desc: 'Spacious for teams & luggage',
      baseRate: 140,
      perKm: 24
    },
    {
      id: 'luxury',
      name: 'Corporate Luxury',
      icon: '✨',
      capacity: 4,
      eta: '8 mins away',
      desc: 'Executive class experience',
      baseRate: 250,
      perKm: 38
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Select Vehicle Category
        </h3>
        {hasRoute ? (
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
            {distanceKm} KM • ~{durationMins} Mins
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-slate-400">
            Enter pickup & drop to calculate fare
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {cabs.map((cab) => {
          const isSelected = selectedType === cab.id;
          const fareData = estimates?.[cab.id];
          const calculatedFare = fareData ? fareData.total : Math.round(cab.baseRate + distanceKm * cab.perKm);
          const displayFare = hasRoute ? `₹${calculatedFare}` : `From ₹${cab.baseRate}`;

          return (
            <div
              key={cab.id}
              onClick={() => onSelectType(cab.id)}
              className={`cursor-pointer rounded-2xl p-3.5 border transition-all duration-150 flex items-center justify-between ${
                isSelected
                  ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 shadow-md ring-1 ring-amber-500'
                  : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-amber-400/50'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className="text-3xl p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                  {cab.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{cab.name}</h4>
                    {cab.popular && (
                      <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{cab.desc}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] font-semibold text-slate-400">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3 text-amber-500" /> {cab.capacity} Seat{cab.capacity > 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{cab.eta}</span>
                  </div>
                </div>
              </div>

              <div className="text-right pl-3">
                <p className="text-lg font-black text-slate-900 dark:text-white">{displayFare}</p>
                <p className="text-[10px] text-slate-400">{hasRoute ? "Taxes included" : "Base rate"}</p>
                {isSelected && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                    <Check className="w-3.5 h-3.5" /> Selected
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
