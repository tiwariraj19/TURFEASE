import express from "express";
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
} from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // All booking routes require owner authentication

router.route("/")
  .get(getBookings)
  .post(createBooking);

router.route("/:id")
  .get(getBookingById)
  .put(updateBooking);

router.patch("/:id/cancel", cancelBooking);

export default router;
