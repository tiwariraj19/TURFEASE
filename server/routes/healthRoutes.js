import express from "express";
import { getDbStatus } from "../config/db.js";

const router = express.Router();

// @desc    Health check endpoint
// @route   GET /api/health
// @access  Public
router.get("/health", (req, res) => {
  const dbStatus = getDbStatus();
  const uptimeSeconds = Math.floor(process.uptime());

  res.json({
    status: "ok",
    service: "TurfEase Management Engine",
    version: "2.4.0",
    timestamp: new Date().toISOString(),
    uptime: `${uptimeSeconds}s`,
    database: {
      status: dbStatus.state,
      connected: dbStatus.isConnected,
    },
    environment: process.env.NODE_ENV || "development",
  });
});

export default router;
