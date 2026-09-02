const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();

const app = express();

connectDB();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    service: "FleetCorp Cab Booking Portal API",
    timestamp: new Date().toISOString(),
    rolesSupported: ["rider", "captain", "admin"],
    version: "1.0.0"
  });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/captain", require("./routes/captainRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));

app.use(errorHandler);

let PORT = process.env.PORT || 5001;

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`🚀 FleetCorp Server running in ${process.env.NODE_ENV || "development"} mode on port ${port}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`⚠️ Port ${port} is in use, trying port ${Number(port) + 1}...`);
      startServer(Number(port) + 1);
    } else {
      console.error("Server error:", err);
    }
  });
};

startServer(PORT);
