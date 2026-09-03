export const formatTripDate = (timestamp) => {
  if (!timestamp) return 'Recent Trip';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return String(timestamp);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch (e) {
    return 'Recent Trip';
  }
};

export const getVehicleIcon = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('bike') || t.includes('moto')) return '🔵';
  if (t.includes('auto') || t.includes('tuk')) return '🛪';
  if (t.includes('suv')) return '🙙';
  if (t.includes('lux')) return '✨';
  return '🙖';
};

export const formatVehicleName = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('bike') || t.includes('moto')) return 'Bike / Moto';
  if (t.includes('auto') || t.includes('tuk')) return 'Auto / Tuk-Tuk';
  if (t.includes('suv')) return 'SUV (Spacious)';
  if (t.includes('sedan')) return 'Sedan (Prime)';
  if (t.includes('mini')) return 'Mini (Hatchback)';
  if (t.includes('lux')) return 'Corporate Luxury';
  return 'Cab (RideX)';
};

export const compileRealRiderTrips = (user, apiBookings = []) => {
  const myEmail = (user?.email || '').trim().toLowerCase();
  const myPhone = (user?.phone || '').replace(/[^0-9]/g, '').slice(-10);
  const myName = (user?.name || '').trim().toLowerCase();

  const allTrips = [];

  // 1. Process API Bookings from MongoDB Atlas
  if (Array.isArray(apiBookings)) {
    apiBookings.forEach(b => {
      if (!b) return;
      const rEmail = (b.rider?.email || b.riderEmail || '').toLowerCase();
      const rPhone = (b.rider?.phone || b.riderPhone || '').replace(/[^0-9]/g, '').slice(-10);
      const rName = (b.rider?.name || '').toLowerCase();

      const isMatch = (myEmail && rEmail && myEmail === rEmail) ||
                      (myPhone && rPhone && myPhone === rPhone) ||
                      (myName && rName && myName === rName) ||
                      (!rEmail && !rPhone);

      if (isMatch) {
        allTrips.push({
          id: b.bookingId || ('RDX-' + String(b._id || Date.now()).slice(-4)),
          _id: b._id || b.id || ('api_b_' + Date.now()),
          date: formatTripDate(b.createdAt || b.date || b.scheduledDate),
          pickup: typeof b.pickup === 'string' ? b.pickup : b.pickup?.address || 'Pickup Point',
          drop: typeof b.drop === 'string' ? b.drop : b.drop?.address || 'Drop Destination',
          distance: b.distanceKm ? (b.distanceKm + ' km') : '11.5 km',
          duration: b.estimatedDurationMins ? (b.estimatedDurationMins + ' mins') : '24 mins',
          vehicleType: formatVehicleName(b.vehicleType || b.category),
          vehicleNumber: b.captainProfile?.vehicle?.numberPlate || b.vehicleNumber || 'OD-02-BA-9876',
          vehicleIcon: getVehicleIcon(b.vehicleType || b.category),
          captainName: b.captain?.name || b.captainProfile?.name || 'Verified RideX Captain',
          captainRating: '4.92',
          fare: Number(b.fare?.total || b.fare || 150),
          paymentMode: b.paymentMethod === 'corporate_wallet' ? 'RideX Wallet' : (b.paymentMethod || 'RideX Wallet'),
          status: (b.status === 'trip_completed' || b.status === 'completed') ? 'completed' : (b.status === 'cancelled' ? 'cancelled' : 'in_progress'),
          userRating: b.rating || 5,
          baseFare: Math.round(Number(b.fare?.total || b.fare || 150) * 0.3),
          distanceFare: Math.round(Number(b.fare?.total || b.fare || 150) * 0.6),
          taxes: Math.round(Number(b.fare?.total || b.fare || 150) * 0.1),
          timestamp: new Date(b.createdAt || Date.now()).getTime()
        });
      }
    });
  }

  // 2. Process Local Rider Booking History
  try {
    const rawLocal = localStorage.getItem(' ridex_rider_booking_history');
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      parsed.forEach(b => {
        if (!b) return;
        const rEmail = (b.rider?.email || b.riderEmail || '').toLowerCase();
        const rPhone = (b.rider?.phone || b.riderPhone || '').replace(/[^0-9]/g, '').slice(-10);
        const rName = (b.rider?.name || '').toLowerCase();

        const isMatch = (myEmail && rEmail && myEmail === rEmail) ||
                      (myPhone && rPhone && myPhone === rPhone) ||
                      (myName && rName && myName === rName) ||
                      (!rEmail && !rPhone);

        if (isMatch) {
          allTrips.push({
            id: b.bookingId || b.id || ('RDX-' + String(b._id || Date.now()).slice(-4)),
            _id: b._id || b.id || ('loc_b_' + Date.now()),
            date: formatTripDate(b.timestamp || b.createdAt || b.date),
            pickup: typeof b.pickup === 'string' ? b.pickup : b.pickup?.address || 'Pickup Point',
            drop: typeof b.drop === 'string' ? b.drop : b.drop?.address || 'Drop Destination',
            distance: b.distanceKm ? (b.distanceKm + ' km') : (b.distance ? (b.distance + ' km') : '10.2 km'),
            duration: b.duration ? (b.duration + ' mins') : '20 mins',
            vehicleType: formatVehicleName(b.vehicleType || b.category),
            vehicleNumber: b.captainProfile?.vehicle?.numberPlate || b.vehicleNumber || 'OD-02-BA-9876',
            vehicleIcon: getVehicleIcon(b.vehicleType || b.category),
            captainName: b.captain?.name || b.captainName || 'Verified RideX Captain',
            captainRating: '4.90',
            fare: Number(b.fare?.total || b.fare || 150),
            paymentMode: b.paymentMethod === 'corporate_wallet' ? 'RideX Wallet' : (b.paymentMethod || 'RideW Wallet'),
            status: (b.status === 'trip_completed' || b.status === 'completed') ? 'completed' : (b.status === 'cancelled' ? 'cancelled' : 'in_progress'),
            userRating: 5,
            baseFare: Math.round(Number(b.fare?.total || b.fare || 150) * 0.3),
            distanceFare: Math.round(Number(b.fare?.total || b.fare || 150) * 0.6),
            taxes: Math.round(Number(b.fare?.total || b.fare || 150) * 0.1),
            timestamp: b.timestamp || new Date(b.createdAt || Date.now()).getTime()
          });
        }
      });
    }
  } catch (e) {}

  // 3. Process Captain Completed Trips History matching Rider
  try {
    const rawCap = localStorage.getItem('ridex_captain_trip_history');
    if (rawCap) {
      const parsed = JSON.parse(rawCap);
      parsed.forEach(t => {
        if (!t) return;
        const rEmail = (t.rider?.email || '').toLowerCase();
        const rPhone = (t.rider?.phone || '').replace(/^0-9]/g, '').slice(-10);
        const rName = (t.rider?.name || '').toLowerCase();

        const isMatch = (myEmail && rEmail && myEmail === rEmail) ||
                      (myPhone && rPhone && myPhone === rPhone) ||
                      (myName && rName && myName === rName);

        if (isMatch) {
          allTrips.push({
            id: t.id || ('RDX-' + String(t._id || Date.now()).slice(-4)),
            _id: t._id || t.id,
            date: formatTripDate(t.timestamp || Date.now()),
            pickup: typeof t.pickup === 'string' ? t.pickup : t.pickup?.address || 'Pickup Point',
            drop: typeof t.drop === 'string' ? t.drop : t.drop?.address || 'Drop Destination',
            distance: t.distance || '12.4 km',
            duration: t.duration || '26 mins',
            vehicleType: formatVehicleName(t.vehicleType || t.category),
            vehicleNumber: t.vehicleNumber || 'OD-02-BA-9876',
            vehicleIcon: getVehicleIcon(t.vehicleType || t.category),
            captainName: t.captainName || 'Verified RideX Captain',
            captainRating: '4.95',
            fare: Number(t.fare || t.amount || 150),
            paymentMode: 'RideW Wallet',
            status: t.status === 'cancelled' ? 'cancelled' : 'completed',
            userRating: 5,
            baseFare: Math.round(Number(t.fare || 150) * 0.3),
            distanceFare: Math.round(Number(t.fare || 150) * 0.6),
            taxes: Math.round(Number(t.fare || 150) * 0.1),
            timestamp: t.timestamp || Date.now()
          });
        }
      });
    }
  } catch (e) {}

  // De-duplicate by id & sort by latest timestamp
  const unique = allTrips.filter((r1, idx, arr) => arr.findIndex(x => x.id === r1.id || (x._id && x._id === r1._id)) === idx);
  unique.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return unique;
};