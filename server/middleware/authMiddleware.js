import { verifyToken } from "../utils/jwt.js";
import { Owner } from "../models/Owner.js";
import { getDbStatus } from "../config/db.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Authentication token is missing.",
    });
  }

  try {
    const decoded = verifyToken(token);

    if (getDbStatus().isConnected && decoded.id && decoded.id.match(/^[0-9a-fA-F]{24}$/)) {
      const owner = await Owner.findById(decoded.id).select("-password");
      if (!owner) {
        return res.status(401).json({
          success: false,
          message: "Session expired or owner account no longer exists.",
        });
      }
      req.owner = owner;
    } else {
      req.owner = {
        _id: decoded.id || "seed-owner",
        id: decoded.id || "seed-owner",
        email: decoded.email || process.env.SEED_OWNER_EMAIL || "owner@turfease.in",
        name: process.env.SEED_OWNER_NAME || "Vansh Tiwari",
        role: "owner",
        facility: "Greenfield Sports Complex, Pune",
      };
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authorization token.",
    });
  }
};
