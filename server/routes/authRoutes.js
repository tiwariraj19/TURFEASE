import express from "express";
import { loginOwner, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/login", authLimiter, loginOwner);
router.get("/me", protect, getMe);

export default router;
