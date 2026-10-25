import express from "express";
import {
  getAvailability,
  blockSlot,
  unblockSlot,
} from "../controllers/slotController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/availability", getAvailability);
router.post("/block", blockSlot);
router.post("/unblock", unblockSlot);

export default router;
