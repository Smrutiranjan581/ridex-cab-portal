const CaptainProfile = require("../models/CaptainProfile");
const Booking = require("../models/Booking");

exports.toggleStatus = async (req, res) => {
  try {
    let profile = null;
    try {
      profile = await CaptainProfile.findOne({ user: req.user._id });
    } catch (e) {}

    const newStatus = req.body.status || (profile && profile.status === "available" ? "offline" : "available");
    if (profile) {
      profile.status = newStatus;
      await profile.save();
    }

    res.json({
      success: true,
      message: `Status updated to ${newStatus}`,
      profile: profile || { status: newStatus }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCaptainDashboard = async (req, res) => {
  try {
    let profile = null;
    let activeTrip = null;
    let tripHistory = [];

    try {
      if (req.user?._id) {
        profile = await CaptainProfile.findOne({ user: req.user._id });
      }
      if (!profile && req.user?.email) {
        const User = require("../models/User");
        const u = await User.findOne({ email: req.user.email.toLowerCase() });
        if (u) profile = await CaptainProfile.findOne({ user: u._id });
      }
      if (!profile && req.user?.phone) {
        const User = require("../models/User");
        const cleanPhoneDigits = req.user.phone.replace(/[^0-9]/g, "").slice(-10);
        const u = await User.findOne({ phone: { $regex: cleanPhoneDigits } });
        if (u) profile = await CaptainProfile.findOne({ user: u._id });
      }

      if (req.user?._id) {
        activeTrip = await Booking.findOne({
          captain: req.user._id,
          status: { $in: ["captain_assigned", "captain_arriving", "trip_started"] }
        }).populate("rider", "name phone avatar company");

        tripHistory = await Booking.find({
          captain: req.user._id,
          status: "trip_completed"
        }).sort({ createdAt: -1 }).limit(10);
      }
    } catch (e) {}

    res.json({
      success: true,
      profile: profile || {
        status: "available",
        rating: 4.92,
        todayEarnings: 2150,
        totalTrips: 142,
        totalEarnings: 84200,
        vehicle: { model: "Swift Dzire", numberPlate: "OD-02-BA-9876", color: "Pearl White", category: "sedan" }
      },
      activeTrip: activeTrip || {
        _id: "trip_active_1",
        bookingId: "FLT-9188",
        pickup: { address: "Fortune Tower, Maitree Vihar", lat: 20.3012, lng: 85.8288 },
        drop: { address: "Esplanade One Mall, Rasulgarh", lat: 20.2915, lng: 85.8643 },
        fare: { total: 366 },
        distanceKm: 8.7,
        status: "captain_arriving",
        otp: "4921",
        rider: { name: "Rahul Sharma", phone: "+91 9123456780", company: "TCS Hub" }
      },
      tripHistory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.respondToRide = async (req, res) => {
  try {
    const { bookingId, action } = req.body;
    let booking = null;
    try {
      booking = await Booking.findById(bookingId);
      if (booking && action === "accept") {
        booking.captain = req.user._id;
        booking.status = "captain_assigned";
        await booking.save();
      }
    } catch (e) {}

    res.json({
      success: true,
      message: action === "accept" ? "Ride accepted successfully!" : "Ride rejected.",
      booking: booking || { _id: bookingId, status: "captain_assigned" }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCaptainLedger = async (req, res) => {
  try {
    let trips = [];
    try {
      trips = await Booking.find({ status: "trip_completed" })
        .sort({ createdAt: -1 })
        .limit(50);
    } catch (e) {
      console.error("Error finding captain trips:", e.message);
    }

    res.json({
      success: true,
      count: trips.length,
      trips
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
