import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, MapPin, Car, Phone, CheckCircle2 } from 'lucide-react';

const createIcon = (emoji, color) => {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">${emoji}</div>`,
    className: 'custom-map-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

const pickupIcon = createIcon('📍', '#10b981');
const dropIcon = createIcon('🏁', '#f59e0b');
const carIcon = createIcon('🚖', '#0f172a');

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function LiveMap({
  pickupCoords = [20.3541, 85.8195],
  dropCoords = [20.2444, 85.8178],
  status = "captain_arriving",
  driverName = "Rajesh Mohapatra",
  vehicleNo = "OD-02-BA-9876",
  otp = "4921",
  onStatusAdvance
}) {
  const [carPos, setCarPos] = useState(pickupCoords);
  const [stepIndex, setStepIndex] = useState(0);

  const routePoints = [
    [pickupCoords[0] + 0.015, pickupCoords[1] + 0.012],
    [pickupCoords[0] + 0.008, pickupCoords[1] + 0.006],
    pickupCoords,
    [pickupCoords[0] - 0.03, pickupCoords[1] - 0.005],
    [pickupCoords[0] - 0.06, pickupCoords[1] - 0.002],
    dropCoords
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => {
        const next = (prev + 1) % routePoints.length;
        setCarPos(routePoints[next]);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => {
    switch (status) {
      case "booking_confirmed":
        return { text: "Booking Confirmed ✅", color: "bg-blue-500 text-white" };
      case "captain_assigned":
        return { text: "Captain Assigned 🚖", color: "bg-amber-500 text-slate-950 font-bold" };
      case "captain_arriving":
        return { text: "Captain Arriving 📍", color: "bg-indigo-500 text-white animate-pulse" };
      case "trip_started":
        return { text: "Trip in Progress 🟢", color: "bg-emerald-500 text-white animate-pulse" };
      case "trip_completed":
        return { text: "Trip Completed 🎉", color: "bg-emerald-600 text-white" };
      default:
        return { text: "Live Tracking", color: "bg-slate-800 text-white" };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="relative w-full h-[450px] sm:h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
      
      <MapContainer
        center={pickupCoords}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={carPos} />

        <Polyline
          positions={[pickupCoords, ...routePoints, dropCoords]}
          color="#f59e0b"
          weight={5}
          opacity={0.8}
          dashArray="8, 8"
        />

        <Marker position={pickupCoords} icon={pickupIcon}>
          <Popup>📍 <b>Pickup Point</b></Popup>
        </Marker>

        <Marker position={dropCoords} icon={dropIcon}>
          <Popup>🏁 <b>Drop Destination</b></Popup>
        </Marker>

        <Marker position={carPos} icon={carIcon}>
          <Popup>🚖 <b>Captain {driverName}</b><br/>{vehicleNo}</Popup>
        </Marker>
      </MapContainer>

      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        <div className={`pointer-events-auto px-4 py-2 rounded-2xl shadow-xl text-xs font-bold ${badge.color}`}>
          {badge.text}
        </div>
        <div className="pointer-events-auto px-3.5 py-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl text-xs font-black text-amber-600 dark:text-amber-400">
          OTP: <span className="text-slate-900 dark:text-white tracking-widest text-sm">{otp}</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-auto">
        <div className="glass-card rounded-2xl p-4 shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
              alt="Captain"
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-500 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{driverName}</h4>
                <span className="text-xs font-bold text-amber-500">⭐ 4.92</span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Swift Dzire • <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">{vehicleNo}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onStatusAdvance && status !== "trip_completed" && (
              <button
                onClick={onStatusAdvance}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                Simulate Next Stage ➔
              </button>
            )}
            <a
              href="tel:+919437012345"
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-all shadow-md"
              title="Call Captain"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
