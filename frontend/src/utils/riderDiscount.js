// Utility for Rider Welcome Discounts
export const getRiderRideCount = (user) => {
  if (!user) return 99; // Non-logged in: no welcome discount
  try {
    const myEmail = (user?.email || '').toLowerCase();
    const myPhone = (user?.phone || '').replace(/[^0-9]/g, '').slice(-10);
    const userKey = (user.email || user.phone || 'guest').toLowerCase();

    // 1. Existing demo account 'rider@cab.com' already has previous completed rides
    if (myEmail === 'rider@cab.com') {
      return 8; // Existing rider -> 0% discount, no popup
    }

    // 2. Check user object metrics from backend / registered accounts
    if (typeof user.totalTrips === 'number' && user.totalTrips > 0) {
      return user.totalTrips;
    }
    if (typeof user.tripsCount === 'number' && user.tripsCount > 0) {
      return user.tripsCount;
    }

    // 3. Check local user trips count storage
    const savedUserTrips = Number(localStorage.getItem(`ridex_rider_trips_count_${userKey}`) || 0);

    // 4. Check local rider booking history
    const storedHistory = JSON.parse(localStorage.getItem('ridex_rider_booking_history') || '[]');
    const myBookings = storedHistory.filter(t => {
      const rEmail = (t.rider?.email || t.riderEmail || '').toLowerCase();
      const rPhone = (t.rider?.phone || t.riderPhone || '').replace(/[^0-9]/g, '').slice(-10);
      if (myEmail && rEmail && myEmail === rEmail) return true;
      if (myPhone && rPhone && myPhone === rPhone) return true;
      return false;
    });

    // 5. Check captain trips matching rider
    const capTrips = JSON.parse(localStorage.getItem('ridex_captain_trip_history') || '[]');
    const matchingCapTrips = capTrips.filter(t => {
      const rEmail = (t.rider?.email || '').toLowerCase();
      const rPhone = (t.rider?.phone || '').replace(/[^0-9]/g, '').slice(-10);
      if (myEmail && rEmail && myEmail === rEmail) return true;
      if (myPhone && rPhone && myPhone === rPhone) return true;
      return false;
    });

    return Math.max(savedUserTrips, myBookings.length, matchingCapTrips.length);
  } catch (e) {
    return 0;
  }
};

export const getRiderWelcomeDiscount = (completedRidesCount) => {
  // Brand new riders who have never booked before (0 rides): 30% OFF on 1st ride
  // Riders on their 2nd ride (1 ride completed): 20% OFF on 2nd ride
  // Existing riders who already booked 2+ rides: 0% discount (No offer applies)
  if (completedRidesCount === 0) {
    return {
      discountPercent: 30,
      code: 'FIRST30',
      badgeText: '🎉 30% OFF (1st Ride Offer)',
      title: '30% Discount on 1st Ride',
      rideNumber: 1,
      isEligible: true
    };
  } else if (completedRidesCount === 1) {
    return {
      discountPercent: 20,
      code: 'RIDE20',
      badgeText: '⚡ 20% OFF (2nd Ride Offer)',
      title: '20% Discount on 2nd Ride',
      rideNumber: 2,
      isEligible: true
    };
  } else {
    return {
      discountPercent: 0,
      code: null,
      badgeText: null,
      title: 'Standard Fare',
      rideNumber: completedRidesCount + 1,
      isEligible: false
    };
  }
};
