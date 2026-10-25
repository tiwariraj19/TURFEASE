import { Owner } from "../models/Owner.js";
import { generateToken } from "../utils/jwt.js";
import { getDbStatus } from "../config/db.js";

// @desc    Authenticate Owner & return token
// @route   POST /api/auth/login
// @access  Public (Owner Only)
export const loginOwner = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const seedEmail = (process.env.SEED_OWNER_EMAIL || "owner@turfease.in").toLowerCase();
    const seedPass = process.env.SEED_OWNER_PASSWORD || "owner1234";

    const dbStatus = getDbStatus();

    // If database is not connected yet, allow seed credentials with notice
    if (!dbStatus.isConnected) {
      if ((cleanEmail === seedEmail || cleanEmail === "manager@wembleyturf.com") && password === seedPass) {
        const token = generateToken({
          id: "seed-owner",
          email: seedEmail,
          role: "owner",
        });
        return res.json({
          success: true,
          message: "Owner authenticated successfully (Seed mode. Configure MONGODB_URI in server/.env for MongoDB Atlas persistence).",
          token,
          owner: {
            id: "seed-owner",
            name: process.env.SEED_OWNER_NAME || "Vansh Tiwari",
            email: seedEmail,
            role: "Head Turf Operator / Owner",
            facility: "Greenfield Sports Complex, Pune",
            avatar: "VT",
            badge: "Authorized Turf Owner",
            version: "Turf Engine v2.4 Commercial Edition",
          },
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Invalid turf operator credentials. (Note: Database is disconnected. Use SEED credentials or configure MONGODB_URI in server/.env).",
        });
      }
    }

    // Check database for owner
    let owner = await Owner.findOne({ email: cleanEmail });

    // Auto-create initial owner on first valid seed login attempt if not yet in database
    if (!owner && (cleanEmail === seedEmail || cleanEmail === "manager@wembleyturf.com") && password === seedPass) {
      owner = await Owner.create({
        name: process.env.SEED_OWNER_NAME || "Vansh Tiwari",
        email: seedEmail,
        password: seedPass,
        facility: "Greenfield Sports Complex, Pune",
      });
      console.log(`[Auth] Initial owner account auto-initialized for: ${seedEmail}`);
    }

    if (!owner) {
      return res.status(401).json({
        success: false,
        message: "Invalid turf operator credentials.",
      });
    }

    const isMatch = await owner.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid turf operator credentials.",
      });
    }

    const token = generateToken({
      id: owner._id,
      email: owner.email,
      role: owner.role,
    });

    res.json({
      success: true,
      message: "Owner authenticated successfully.",
      token,
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        role: "Head Turf Operator / Owner",
        facility: owner.facility || "Greenfield Sports Complex, Pune",
        avatar: owner.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
        badge: "Authorized Turf Owner",
        version: "Turf Engine v2.4 Commercial Edition",
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in owner
// @route   GET /api/auth/me
// @access  Private (Owner Only)
export const getMe = async (req, res, next) => {
  try {
    if (!req.owner) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated.",
      });
    }

    res.json({
      success: true,
      owner: {
        id: req.owner._id || req.owner.id,
        name: req.owner.name || "Vansh Tiwari",
        email: req.owner.email,
        role: "Head Turf Operator / Owner",
        facility: req.owner.facility || "Greenfield Sports Complex, Pune",
        badge: "Authorized Turf Owner",
      },
    });
  } catch (error) {
    next(error);
  }
};
