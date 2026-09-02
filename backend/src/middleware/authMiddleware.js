const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "super_secret_jwt_key_fleetcorp_2026");

      let user = null;
      try {
        user = await User.findById(decoded.id).select("-password");
      } catch (e) {}

      if (!user) {
        req.user = { _id: decoded.id, role: decoded.role, name: decoded.name || "User", email: decoded.email };
        return next();
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error("Token verification error:", error.message);
      return res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
  }
};

module.exports = { protect };
