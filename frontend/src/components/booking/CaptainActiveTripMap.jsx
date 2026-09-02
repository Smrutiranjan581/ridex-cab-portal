import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, MapPin, Compass, ShieldCheck } from 'lucide-react';

const createCustomPin = (emoji, bgColor) => {
  return L.divIcon({
    html: `<div style="background-color: ${bgColor}; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 3px solid white; box-shadow: 0 4px 14px rgba(0,0,0,0.35);">${emoji}</div>`,
    className: 'custom-map-icon',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19]
  });
};

const pickupPin = createCustomPin('🟢', '#10B981');
const dropPin = createCustomPin('🏁', '#EF4444');

function MapFitBounds({ p1, p2 }) {
  const map = useMap();
  useEffect(() => {
    if (p1 && p2) {
      try {
        const bounds = L.latLngBounds([p1, p2]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } catch (e) {}
    } else if (p1) {
      map.setView(p1, 14, { animate: true });
    }
  }, [p1, p2, map]);
  return null;
}

export default function CaptainActiveTripMap({
  tripStage = 'captain_arriving', // 'captain_arriving' | 'trip_started' | 'trip_completed'
  pickup = '',
  drop = '',
  pickupCoords = [20.3541, 85.8195],
  dropCoords = [20.2912, 85.8647],
  vehicleType = 'bike',
  fare = 0,
  distanceKm = 0
}) {
  const [captainPos] = useState([pickupCoords[0] + 0.010, pickupCoords[1] + 0.008]);
  const vehicleEmoji = vehicleType === 'bike' ? '🛵' : vehicleType === 'auto' ? '🛺' : '🚘';
  const vehiclePin = createCustomPin(vehicleEmoji, '#0F172A');

  // Route points when heading to pickup vs heading to drop
  const routeToPickup = [
    captainPos,
    [pickupCoords[0] + 0.005, pickupCoords[1] + 0.004],
    pickupCoords
  ];

  const routeToDrop = [
    pickupCoords,
    [pickupCoords[0] + (dropCoords[0] - pickupCoords[0]) * 0.33 + 0.004, pickupCoords[1] + (dropCoords[1] - pickupCoords[1]) * 0.33 - 0.003],
    [pickupCoords[0] + (dropCoords[0] - pickupCoords[0]) * 0.66 - 0.003, pickupCoords[1] + (dropCoords[1] - pickupCoords[1]) * 0.66 + 0.004],
    dropCoords
  ];

  const isHeadingToPickup = tripStage === 'captain_arriving';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
      {/* Top stage status header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-500" />
              {isHeadingToPickup ? "Navigation ➔ Heading to Passenger Pickup" : "In-Transit ➔ Navigating to Drop Destination"}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isHeadingToPickup ? `Drive to: ${pickup}` : `Driving from ${pickup} ➔ ${drop}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold text-xs">
            {isHeadingToPickup ? "ETA ~3 Mins" : `${distanceKm || 12} KM • ₹${fare}`}
          </span>
        </div>
      </div>

      {/* Interactive Leaflet Navigation Map */}
      <div className="relative w-full h-[360px] sm:h-[400px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
        <MapContainer
          center={isHeadingToPickup ? pickupCoords : pickupCoords}
          zoom={14}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapFitBounds
            p1={isHeadingToPickup ? captainPos : pickupCoords}
            p2={isHeadingToPickup ? pickupCoords : dropCoords}
          />

          {/* Stage 1: Heading to Pickup */}
          {isHeadingToPickup && (
            <>
              {/* Captain Current Position Pin */}
              <Marker position={captainPos} icon={vehiclePin}>
                <Popup>
                  <div className="text-xs font-bold">
                    {vehicleEmoji} You (Captain Live Position)
                  </div>
                </Popup>
              </Marker>

              {/* Rider Pickup Pin */}
              <Marker position={pickupCoords} icon={pickupPin}>
                <Popup>
                  <div className="text-xs">
                    <b className="text-emerald-600 font-bold">🟢 Passenger Pickup:</b><br />
                    {pickup}
                  </div>
                </Popup>
              </Marker>

              {/* Navigation Route Line to Pickup */}
              <Polyline positions={routeToPickup} color="#10B981" weight={6} opacity={0.85} />
              <Polyline positions={routeToPickup} color="#ffffff" weight={2} opacity={0.9} dashArray="6, 8" />
            </>
          )}

          {/* Stage 2: In-Transit from Pickup to Drop */}
          {!isHeadingToPickup && (
            <>
              {/* Pickup Pin */}
              <Marker position={pickupCoords} icon={pickupPin}>
                <Popup>
                  <div className="text-xs">
                    <b className="text-emerald-600 font-bold">🟢 Trip Started From:</b><br />
                    {pickup}
                  </div>
                </Popup>
              </Marker>

              {/* Drop Pin */}
              <Marker position={dropCoords} icon={dropPin}>
                <Popup>
                  <div className="text-xs">
                    <b className="text-rose-600 font-bold">🏁 Destination Drop:</b><br />
                    {drop}
                  </div>
                </Popup>
              </Marker>

              {/* Vehicle Moving along route */}
              <Marker position={routeToDrop[2]} icon={vehiclePin}>
                <Popup>
                  <div className="text-xs font-bold">
                    {vehicleEmoji} Trip In Progress (On Road)
                  </div>
                </Popup>
              </Marker>

              {/* Route Line from Pickup to Drop */}
              <Polyline positions={routeToDrop} color="#f59e0b" weight={6} opacity={0.85} />
              <Polyline positions={routeToDrop} color="#ffffff" weight={2} opacity={0.9} dashArray="6, 8" />
            </>
          )}
        </MapContainer>

        {/* Floating instruction banner */}
        <div className="absolute bottom-3 left-3 right-3 z-[400] pointer-events-auto">
          <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between gap-3 text-xs">
            <div className="truncate">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {isHeadingToPickup ? "Next Action: Reach Pickup Point" : "Next Action: Drive to Destination Drop"}
              </p>
              <p className="font-black text-slate-900 dark:text-white truncate text-sm">
                {isHeadingToPickup ? `📍 ${pickup}` : `🏁 ${drop}`}
              </p>
            </div>
            <span className="shrink-0 font-extrabold text-xs px-2.5 py-1 rounded-xl bg-slate-900 text-amber-400 dark:bg-amber-400 dark:text-slate-950 font-mono">
              {isHeadingToPickup ? "PICKUP" : "DROP"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
