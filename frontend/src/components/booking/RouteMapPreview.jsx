import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, MapPin, Compass, ShieldCheck, Zap } from 'lucide-react';

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

function MapRecenterAndFit({ pickupCoords, dropCoords, hasDrop }) {
  const map = useMap();

  useEffect(() => {
    if (pickupCoords && dropCoords && hasDrop) {
      try {
        const bounds = L.latLngBounds([pickupCoords, dropCoords]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } catch (e) {}
    } else if (pickupCoords) {
      map.setView(pickupCoords, 14, { animate: true });
    }
  }, [pickupCoords, dropCoords, hasDrop, map]);

  return null;
}

export default function RouteMapPreview({
  pickupCoords = [20.3541, 85.8195],
  dropCoords = null,
  pickup = '',
  drop = '',
  distanceKm = 0,
  durationMins = 0,
  vehicleType = 'bike'
}) {
  const hasDrop = Boolean(drop && dropCoords && dropCoords.length === 2);

  // Generate intermediate waypoint route points
  const routePoints = hasDrop ? [
    pickupCoords,
    [pickupCoords[0] + (dropCoords[0] - pickupCoords[0]) * 0.25 + 0.005, pickupCoords[1] + (dropCoords[1] - pickupCoords[1]) * 0.25 - 0.004],
    [pickupCoords[0] + (dropCoords[0] - pickupCoords[0]) * 0.5 - 0.003, pickupCoords[1] + (dropCoords[1] - pickupCoords[1]) * 0.5 + 0.006],
    [pickupCoords[0] + (dropCoords[0] - pickupCoords[0]) * 0.75 + 0.002, pickupCoords[1] + (dropCoords[1] - pickupCoords[1]) * 0.75 - 0.003],
    dropCoords
  ] : [];

  const vehicleEmoji = vehicleType === 'bike' ? '🛵' : vehicleType === 'auto' ? '🛺' : '🚗';
  const vehiclePin = createCustomPin(vehicleEmoji, '#0F172A');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-3 sticky top-24">
      
      {/* Header bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-amber-500" />
            Live Route & GPS Radar
          </h3>
        </div>

        {hasDrop && distanceKm > 0 ? (
          <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 shadow-xs">
            {distanceKm} km • ~{durationMins} mins
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            GPS Location Active
          </span>
        )}
      </div>

      {/* Leaflet Map Box */}
      <div className="relative w-full h-[380px] sm:h-[420px] rounded-2xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800">
        <MapContainer
          center={pickupCoords || [20.3541, 85.8195]}
          zoom={14}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenterAndFit
            pickupCoords={pickupCoords}
            dropCoords={dropCoords}
            hasDrop={hasDrop}
          />

          {/* Pickup Marker */}
          {pickupCoords && (
            <Marker position={pickupCoords} icon={pickupPin}>
              <Popup>
                <div className="text-xs">
                  <b className="text-emerald-600 font-bold">🟢 Pickup Location:</b><br />
                  {pickup || "Your Detected GPS Location"}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Drop Marker */}
          {hasDrop && (
            <Marker position={dropCoords} icon={dropPin}>
              <Popup>
                <div className="text-xs">
                  <b className="text-rose-600 font-bold">🏁 Drop Destination:</b><br />
                  {drop}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Polyline Route */}
          {hasDrop && routePoints.length > 0 && (
            <>
              <Polyline
                positions={routePoints}
                color="#f59e0b"
                weight={6}
                opacity={0.85}
              />
              <Polyline
                positions={routePoints}
                color="#ffffff"
                weight={2}
                opacity={0.9}
                dashArray="6, 8"
              />
              <Marker position={routePoints[2]} icon={vehiclePin}>
                <Popup>
                  <div className="text-xs font-bold">
                    {vehicleEmoji} RideX Route in Progress
                  </div>
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>

        {/* Floating live status pill */}
        <div className="absolute bottom-3 left-3 right-3 z-[400] pointer-events-auto">
          <div className="p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between gap-3 text-xs">
            <div className="truncate">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {hasDrop ? "Calculated Route" : "Pickup Point Ready"}
              </p>
              <p className="font-extrabold text-slate-900 dark:text-white truncate">
                {hasDrop ? `${pickup} ➔ ${drop}` : pickup || "Detecting GPS location..."}
              </p>
            </div>
            {hasDrop && (
              <span className="shrink-0 font-black text-amber-600 dark:text-amber-400 font-mono text-sm">
                {distanceKm} KM
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Safety assurance footer */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Upfront Meter Pricing
        </span>
        <span className="text-slate-400">• No Hidden Surge</span>
      </div>

    </div>
  );
}
