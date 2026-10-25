import { Payment } from "../models/Payment.js";
import { Booking } from "../models/Booking.js";
import { getDbStatus } from "../config/db.js";

// @desc    List payments with date, method, status, and search filters
// @route   GET /api/payments
// @access  Private
export const getPayments = async (req, res, next) => {
  try {
    if (!getDbStatus().isConnected) {
      return res.json({
        success: true,
        count: 0,
        summary: {
          totalCollected: 0,
          totalPending: 0,
          settledCount: 0,
          partialCount: 0,
        },
        data: [],
        warning: "MongoDB Atlas is disconnected. Please configure MONGODB_URI in server/.env.",
      });
    }

    const { status, method, search, limit } = req.query;

    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (method && method !== "all") {
      query.paymentMethodType = method.toLowerCase();
    }

    if (search) {
      query.$or = [
        { paymentId: { $regex: search, $options: "i" } },
        { bookingId: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
        { turfName: { $regex: search, $options: "i" } },
        { ref: { $regex: search, $options: "i" } },
      ];
    }

    let queryBuilder = Payment.find(query).sort({ createdAt: -1 });
    if (limit) {
      queryBuilder = queryBuilder.limit(Number(limit));
    }

    const payments = await queryBuilder;

    // KPI Summary
    const allPayments = await Payment.find();
    const totalCollected = allPayments.reduce(
      (sum, p) => (p.status !== "Refunded" ? sum + (p.receivedAmount || 0) : sum),
      0
    );
    const totalPending = allPayments.reduce(
      (sum, p) => (p.status !== "Refunded" ? sum + (p.dueBalance || 0) : sum),
      0
    );

    res.json({
      success: true,
      count: payments.length,
      summary: {
        totalCollected,
        totalPending,
        settledCount: allPayments.filter((p) => p.status === "Paid").length,
        partialCount: allPayments.filter((p) => p.status === "Partial").length,
      },
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment details by ID
// @route   GET /api/payments/:id
// @access  Private
export const getPaymentById = async (req, res, next) => {
  try {
    let payment = await Payment.findOne({ paymentId: req.params.id }).populate("booking");
    if (!payment && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      payment = await Payment.findById(req.params.id).populate("booking");
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment transaction record not found.",
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a payment against an existing booking
// @route   POST /api/payments
// @access  Private
export const recordPayment = async (req, res, next) => {
  try {
    const { bookingId, amountToCollect, paymentMethod, refNote, paymentId } = req.body;

    if (!bookingId || amountToCollect === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide bookingId and amountToCollect.",
      });
    }

    const collectAmt = Number(amountToCollect);
    if (isNaN(collectAmt) || collectAmt <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount to collect must be a valid positive number.",
      });
    }

    // If paymentId is passed, reconcile an existing payment record
    if (paymentId) {
      const existingPay = await Payment.findOne({
        $or: [{ paymentId }, ...(paymentId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: paymentId }] : [])],
      });

      if (existingPay) {
        const remainingDue = existingPay.dueBalance;
        if (collectAmt > remainingDue + 0.01) {
          return res.status(400).json({
            success: false,
            message: `Overpayment prohibited: Remaining due is $${remainingDue.toFixed(2)}, cannot record $${collectAmt.toFixed(2)}.`,
          });
        }

        const newReceived = existingPay.receivedAmount + collectAmt;
        const newDue = Math.max(0, existingPay.totalAmount - newReceived);
        const newStatus = newDue <= 0.01 ? "Paid" : "Partial";

        existingPay.receivedAmount = newReceived;
        existingPay.dueBalance = newDue;
        existingPay.status = newStatus;
        if (paymentMethod) existingPay.paymentMethod = paymentMethod;
        if (refNote) existingPay.ref = refNote;
        await existingPay.save();

        // Also update matching booking
        const booking = await Booking.findById(existingPay.booking);
        if (booking) {
          booking.paidAmount = newReceived;
          booking.paymentStatus = newStatus;
          await booking.save();
        }

        return res.json({
          success: true,
          message: "Payment successfully reconciled.",
          data: existingPay,
        });
      }
    }

    // Otherwise, find booking by bookingId or _id
    let booking = await Booking.findOne({ bookingId });
    if (!booking && bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findById(bookingId);
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `Booking record "#${bookingId}" not found.`,
      });
    }

    const currentPaid = booking.paidAmount || 0;
    const totalDue = Math.max(0, booking.amount - currentPaid);

    // Prevent overpayment
    if (collectAmt > totalDue + 0.01) {
      return res.status(400).json({
        success: false,
        message: `Overpayment prohibited: Outstanding balance is $${totalDue.toFixed(2)}, cannot collect $${collectAmt.toFixed(2)}.`,
      });
    }

    const updatedPaid = currentPaid + collectAmt;
    const newRemainingDue = Math.max(0, booking.amount - updatedPaid);
    const newStatus = newRemainingDue <= 0.01 ? "Paid" : "Partial";

    // Update booking
    booking.paidAmount = updatedPaid;
    booking.paymentStatus = newStatus;
    if (paymentMethod) booking.paymentMethod = paymentMethod;
    await booking.save();

    // Determine payment method type
    const methodLower = (paymentMethod || "").toLowerCase();
    const paymentMethodType = methodLower.includes("upi")
      ? "upi"
      : methodLower.includes("cash")
      ? "cash"
      : methodLower.includes("wire")
      ? "wire"
      : methodLower.includes("card") || methodLower.includes("stripe")
      ? "card"
      : "other";

    const generatedPayId = `PAY-${Math.floor(2100 + Math.random() * 8900)}`;

    const newPayment = await Payment.create({
      paymentId: generatedPayId,
      booking: booking._id,
      bookingId: booking.bookingId,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerInitials: booking.customerInitials,
      turfName: booking.turfName,
      slotTime: `${booking.date}, ${booking.timeSlot}`,
      totalAmount: booking.amount,
      receivedAmount: collectAmt,
      dueBalance: newRemainingDue,
      paymentMethod: paymentMethod || "UPI (PhonePe)",
      paymentMethodType,
      status: newStatus,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      ref: refNote || `POS-REC-${Date.now().toString().slice(-4)}`,
    });

    res.status(201).json({
      success: true,
      message: `Payment of $${collectAmt.toFixed(2)} recorded successfully. Outstanding balance: $${newRemainingDue.toFixed(2)}.`,
      data: newPayment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment reference or method
// @route   PUT /api/payments/:id
// @access  Private
export const updatePayment = async (req, res, next) => {
  try {
    let payment = await Payment.findOne({ paymentId: req.params.id });
    if (!payment && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      payment = await Payment.findById(req.params.id);
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found.",
      });
    }

    const { paymentMethod, ref } = req.body;
    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (ref !== undefined) payment.ref = ref;

    await payment.save();

    res.json({
      success: true,
      message: "Payment details updated.",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};
