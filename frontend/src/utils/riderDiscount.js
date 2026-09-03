// Utility for Rider Welcome Discounts
export const getRiderRideCount = (user) => {
  try {
    const myEmail = (user?.email || '').toLowerCase();
    const myPhone = (user?.phone || '').replace(/[^0-9]/g, '').slice(-10);

    // 1. Check local rider booking history
    const storedHistory = JSON.parse(localStorage.getItem('ridex_rider_booking_history') || '[]');
    let count = storedHistory.filter(t => t.status === 'trip_completed' || t.status === 'completed').length;

    // 2. Check captain trips matching rider
    const capTrips = JSON.parse(localStorage.getItem('ridex_captain_trip_history') || '[]');
    const matchingCapTrips = capTrips.filter(t => {
      if (t.status !== 'trip_completed') return false;
      const rEmail = (t.rider?.email || '').toLowerCase();
      const rPhone = (t.rider?.phone || '').replace(/[^0-9]/g, '').slice(-10);
      if (myEmail && rEmail && myEmail === rEmail) return true;
      if (myPhone && rPhone && myPhone === rPhone) return true;
      return false;
    });

    return Math.max(count, matchingCapTrips.length);
  } catch (e) {
    return 0;
  }
};

export const getRiderWelcomeDiscount = (completedRidesCount) => {
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
