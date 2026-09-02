import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Calendar, Clock, Users, FileText, ArrowRight, Wallet, AlertCircle, Locate, Loader2, Sparkles } from 'lucide-react';
import CabCards from './CabCards';

export default function BookingForm({ onConfirmBooking, isSubmitting, onRouteChange }) {
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [pickupCoords, setPickupCoords] = useState([20.3541, 85.8195]);
  const [dropCoords, setDropCoords] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  // Clean empty initial states - no auto-selected values
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [passengerCount, setPassengerCount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [validationError, setValidationError] = useState('');

  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMins, setDurationMins] = useState(0);

  const landmarks = [
    { label: "Infocity IT Corridor, Patia", coords: [20.3588, 85.8164], km: 14.2, mins: 32 },
    { label: "Fortune Tower, Maitree Vihar", coords: [20.3082, 85.8242], km: 11.5, mins: 26 },
    { label: "BBI Airport Terminal 1", coords: [20.2525, 85.8178], km: 18.5, mins: 42 },
    { label: "Esplanade One Mall, Rasulgarh", coords: [20.2912, 85.8647], km: 9.8, mins: 22 },
    { label: "KIIT University Campus", coords: [20.3541, 85.8195], km: 15.1, mins: 35 },
    { label: "Master Canteen Railway Sq", coords: [20.2667, 85.8436], km: 10.4, mins: 25 }
  ];

  // Automatic Current Location Detection on Mount
  const detectCurrentLocation = () => {
    setIsDetectingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const detectedCoords = [lat, lng];
          setPickupCoords(detectedCoords);

          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await res.json();
            if (data && data.display_name) {
              const parts = data.display_name.split(',');
              const shortAddr = parts[0] + (parts[1] ? `, ${parts[1].trim()}` : '') + (parts[2] ? `, ${parts[2].trim()}` : '');
              setPickup(`📍 Current Location (${shortAddr})`);
              notifyRouteSync(`📍 Current Location (${shortAddr})`, drop, detectedCoords, dropCoords, vehicleType);
            } else {
              setPickup("📍 Current Location (Infocity IT Corridor, Patia)");
              notifyRouteSync("📍 Current Location (Infocity IT Corridor, Patia)", drop, detectedCoords, dropCoords, vehicleType);
            }
          } catch {
            setPickup("📍 Current Location (Infocity IT Corridor, Patia)");
            notifyRouteSync("📍 Current Location (Infocity IT Corridor, Patia)", drop, detectedCoords, dropCoords, vehicleType);
          }
          setIsDetectingLocation(false);
        },
        () => {
          // Fallback if permission denied
          const fallback = [20.3541, 85.8195];
          setPickupCoords(fallback);
          setPickup("📍 Current Location (Infocity IT Corridor, Patia)");
          setIsDetectingLocation(false);
          notifyRouteSync("📍 Current Location (Infocity IT Corridor, Patia)", drop, fallback, dropCoords, vehicleType);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      const fallback = [20.3541, 85.8195];
      setPickupCoords(fallback);
      setPickup("📍 Current Location (Infocity IT Corridor, Patia)");
      setIsDetectingLocation(false);
      notifyRouteSync("📍 Current Location (Infocity IT Corridor, Patia)", drop, fallback, dropCoords, vehicleType);
    }
  };

  useEffect(() => {
    detectCurrentLocation();
  }, []);

  const notifyRouteSync = (p, d, pC, dC, vT) => {
    let km = distanceKm;
    let mins = durationMins;

    if (p && d) {
      const hash = (p.length * 7 + d.length * 13) % 25;
      km = Number((8.5 + hash * 0.8).toFixed(1));
      mins = Math.max(15, Math.round(km * 2.2));
      setDistanceKm(km);
      setDurationMins(mins);
    }

    if (onRouteChange) {
      onRouteChange({
        pickup: p,
        drop: d,
        pickupCoords: pC,
        dropCoords: dC,
        distanceKm: km,
        durationMins: mins,
        vehicleType: vT
      });
    }
  };

  const handlePickupChange = (val) => {
    setPickup(val);
    notifyRouteSync(val, drop, pickupCoords, dropCoords, vehicleType);
  };

  const handlePickupSelect = (landmark) => {
    setPickup(landmark.label);
    setPickupCoords(landmark.coords);
    notifyRouteSync(landmark.label, drop, landmark.coords, dropCoords, vehicleType);
  };

  const handleDropChange = (val) => {
    setDrop(val);
    const matched = landmarks.find(l => l.label.toLowerCase().includes(val.toLowerCase()));
    const resolvedDropCoords = matched ? matched.coords : [20.2912, 85.8647];
    setDropCoords(resolvedDropCoords);
    notifyRouteSync(pickup, val, pickupCoords, resolvedDropCoords, vehicleType);
  };

  const handleDropSelect = (landmark) => {
    setDrop(landmark.label);
    setDropCoords(landmark.coords);
    notifyRouteSync(pickup, landmark.label, pickupCoords, landmark.coords, vehicleType);
  };

  const handleVehicleSelect = (type) => {
    setVehicleType(type);
    notifyRouteSync(pickup, drop, pickupCoords, dropCoords, type);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!pickup.trim()) {
      setValidationError('Please enter your pickup location');
      return;
    }

    if (!drop.trim()) {
      setValidationError('Please enter your destination drop location');
      return;
    }

    if (!passengerCount) {
      setValidationError('Please select number of passengers');
      return;
    }

    if (!vehicleType) {
      setValidationError('Please select a vehicle category (Bike, Auto, Sedan, SUV, etc.) below');
      return;
    }

    if (!paymentMethod) {
      setValidationError('Please select a payment method (Corporate Wallet or UPI / Cash)');
      return;
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const nowTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

    const finalKm = distanceKm > 0 ? distanceKm : 12.5;
    const finalMins = durationMins > 0 ? durationMins : 28;

    onConfirmBooking({
      pickup,
      drop,
      scheduledDate: scheduledDate || todayDate,
      scheduledTime: scheduledTime || nowTime,
      vehicleType,
      passengerCount: Number(passengerCount),
      specialInstructions,
      distanceKm: finalKm,
      estimatedDurationMins: finalMins,
      paymentMethod
    });
  };

  const hasRoute = pickup.trim() && drop.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {validationError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Location selector section */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Pickup Location (Auto-Detected)
            </label>
            <button
              type="button"
              onClick={detectCurrentLocation}
              disabled={isDetectingLocation}
              className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
            >
              {isDetectingLocation ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> Detecting GPS...
                </>
              ) : (
                <>
                  <Locate className="w-3 h-3" /> Auto-Detect GPS
                </>
              )}
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              required
              value={pickup}
              onChange={(e) => handlePickupChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              placeholder="Detecting your current location..."
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">🟢</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Quick Pickup:</span>
            {landmarks.slice(0, 3).map((lm, i) => (
              <button
                type="button"
                key={i}
                onClick={() => handlePickupSelect(lm)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-300 transition-colors"
              >
                📍 {lm.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-rose-500" /> Destination Drop Location
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={drop}
              onChange={(e) => handleDropChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              placeholder="Enter destination, mall, airport or office hub..."
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">🏁</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Popular Drops:</span>
            {landmarks.slice(2, 6).map((lm, i) => (
              <button
                type="button"
                key={i}
                onClick={() => handleDropSelect(lm)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-300 transition-colors"
              >
                🏁 {lm.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Date, Time, Passengers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-500" /> Journey Date
          </label>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Pickup Time
          </label>
          <input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-amber-500" /> Passengers
          </label>
          <select
            value={passengerCount}
            onChange={(e) => setPassengerCount(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
          >
            <option value="">Select Passengers</option>
            <option value="1">1 Passenger</option>
            <option value="2">2 Passengers</option>
            <option value="3">3 Passengers</option>
            <option value="4">4 Passengers</option>
            <option value="6">6 Passengers (SUV)</option>
          </select>
        </div>
      </div>

      {/* Cab Selection */}
      <CabCards
        selectedType={vehicleType}
        onSelectType={handleVehicleSelect}
        distanceKm={distanceKm > 0 ? distanceKm : 10}
        durationMins={durationMins > 0 ? durationMins : 25}
        hasRoute={hasRoute}
      />

      {/* Payment Method & Instructions */}
      <div className="space-y-3 pt-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Payment Method
        </label>
        
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => setPaymentMethod('corporate_wallet')}
            className={`flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all ${
              paymentMethod === 'corporate_wallet'
                ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500 shadow-md scale-[1.01]'
                : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-400'
            }`}
          >
            <Wallet className="w-4 h-4 text-amber-500" />
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-white">Corporate Wallet</p>
              <p className="text-[10px] text-slate-500">Auto Tax Invoice</p>
            </div>
          </div>

          <div
            onClick={() => setPaymentMethod('upi')}
            className={`flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all ${
              paymentMethod === 'upi'
                ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500 shadow-md scale-[1.01]'
                : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-400'
            }`}
          >
            <span className="text-sm">📱</span>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-white">UPI / Cash</p>
              <p className="text-[10px] text-slate-500">Pay on Drop</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> Special Instructions (Optional)
          </label>
          <input
            type="text"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="e.g. Need helmet / boot space for luggage"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/30 hover:shadow-amber-500/40 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            <span>Assigning Nearby Captain...</span>
          </>
        ) : (
          <>
            <span>Confirm & Book Ride</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}
