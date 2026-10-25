import express from "express";
import {
  getTurfs,
  getTurfById,
  createTurf,
  updateTurf,
  toggleTurfStatus,
  deleteTurf,
} from "../controllers/turfController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // All turf routes require owner authentication

router.route("/")
  .get(getTurfs)
  .post(createTurf);

router.route("/:id")
  .get(getTurfById)
  .put(updateTurf)
  .delete(deleteTurf);

router.patch("/:id/status", toggleTurfStatus);

export default router;
