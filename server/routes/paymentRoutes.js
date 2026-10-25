import express from "express";
import {
  getPayments,
  getPaymentById,
  recordPayment,
  updatePayment,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getPayments)
  .post(recordPayment);

router.route("/:id")
  .get(getPaymentById)
  .put(updatePayment);

export default router;
