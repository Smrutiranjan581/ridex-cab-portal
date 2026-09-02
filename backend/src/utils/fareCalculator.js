const FARE_RATES = {
  bike: {
    baseFare: 20,
    perKmRate: 8,
    perMinRate: 1.0,
    minFare: 25,
    surge: 1.0,
    capacity: 1,
    name: "Bike / Moto",
    icon: "🏍️",
    description: "Fastest & most affordable solo ride in traffic"
  },
  auto: {
    baseFare: 30,
    perKmRate: 12,
    perMinRate: 1.5,
    minFare: 40,
    surge: 1.0,
    capacity: 3,
    name: "Auto / Tuk-Tuk",
    icon: "🛺",
    description: "Fastest for city traffic & short commutes"
  },
  mini: {
    baseFare: 60,
    perKmRate: 15,
    perMinRate: 2.0,
    minFare: 80,
    surge: 1.0,
    capacity: 4,
    name: "Mini (Hatchback)",
    icon: "🚗",
    description: "Affordable compact rides for daily travel"
  },
  sedan: {
    baseFare: 90,
    perKmRate: 18,
    perMinRate: 2.5,
    minFare: 120,
    surge: 1.0,
    capacity: 4,
    name: "Sedan (Prime)",
    icon: "🚘",
    description: "Comfortable sedans with top rated captains"
  },
  suv: {
    baseFare: 140,
    perKmRate: 24,
    perMinRate: 3.5,
    minFare: 180,
    surge: 1.1,
    capacity: 6,
    name: "SUV (Spacious)",
    icon: "🚙",
    description: "Spacious 6-seater for team & family trips"
  },
  luxury: {
    baseFare: 250,
    perKmRate: 38,
    perMinRate: 5.0,
    minFare: 350,
    surge: 1.2,
    capacity: 4,
    name: "Corporate Luxury",
    icon: "✨",
    description: "Premium executive fleet with VIP amenities"
  }
};

const calculateFare = (distanceKm, durationMins, vehicleType = "sedan") => {
  const rates = FARE_RATES[vehicleType] || FARE_RATES.sedan;
  const rawFare = rates.baseFare + (distanceKm * rates.perKmRate) + (durationMins * rates.perMinRate);
  const totalWithSurge = Math.max(rawFare * rates.surge, rates.minFare);
  const taxes = Math.round(totalWithSurge * 0.05); // 5% GST
  const total = Math.round(totalWithSurge + taxes);

  return {
    vehicleType,
    vehicleName: rates.name,
    capacity: rates.capacity,
    icon: rates.icon,
    description: rates.description,
    baseFare: rates.baseFare,
    distanceCharge: Math.round(distanceKm * rates.perKmRate),
    timeCharge: Math.round(durationMins * rates.perMinRate),
    taxes,
    total,
    distanceKm: Number(distanceKm.toFixed(1)),
    durationMins: Math.round(durationMins)
  };
};

const estimateAllCabs = (distanceKm, durationMins) => {
  const options = {};
  for (const type of Object.keys(FARE_RATES)) {
    options[type] = calculateFare(distanceKm, durationMins, type);
  }
  return options;
};

module.exports = { calculateFare, estimateAllCabs, FARE_RATES };
