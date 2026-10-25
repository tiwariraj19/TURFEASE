import express from "express";
import {
  getDashboardStats,
  getAnalyticsReports,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/dashboard/stats", getDashboardStats);
router.get("/reports/analytics", getAnalyticsReports);

export default router;
