import { Booking } from "../models/Booking.js";
import { TimeSlot } from "../models/TimeSlot.js";
import { Payment } from "../models/Payment.js";
import { getDbStatus } from "../config/db.js";
import { findTurfByIdOrCustomId } from "./turfController.js";

// Helper: parse HH:MM to decimal hours for duration calculation & comparison
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Check if two time ranges [start1, end1] and [start2, end2] overlap
const isOverlapping = (start1, end1, start2, end2) => {
  const s1 = parseTimeToMinutes(start1);
  const e1 = parseTimeToMinutes(end1);
  const s2 = parseTimeToMinutes(start2);
  const e2 = parseTimeToMinutes(end2);
  return s1 < e2 && s2 < e1;
};

// Active in-memory store for standalone / fallback mode
let memoryBookings = [
  {
    id: "TE-8841",
    bookingId: "TE-8841",
    customerName: "Aarav Sharma",
    customerPhone: "+91 98201 12044",
    customerInitials: "AS",
    turfId: "pitch-1",
    turfName: "Greenfield Sports Arena",
    turfType: "FIFA Pro 50mm Synthetic Turf",
    date: new Date().toISOString().split("T")[0],
    displayDate: "Today",
    timeSlot: "18:00 - 20:00",
    startTime: "18:00",
    endTime: "20:00",
    durationHours: 2,
    bookingType: "Night Football League",
    amount: 2800,
    paidAmount: 2800,
    status: "Confirmed",
    paymentStatus: "Paid",
    paymentMethod: "UPI (GPay)",
    isFloodlightOn: true,
  },
  {
    id: "TE-8840",
    bookingId: "TE-8840",
    customerName: "Rohan Patel",
    customerPhone: "+91 98334 56789",
    customerInitials: "RP",
    turfId: "pitch-2",
    turfName: "KickOff Football Arena",
    turfType: "Hybrid 4G Turf",
    date: new Date().toISOString().split("T")[0],
    displayDate: "Today",
    timeSlot: "16:00 - 18:00",
    startTime: "16:00",
    endTime: "18:00",
    durationHours: 2,
    bookingType: "Corporate Match",
    amount: 2200,
    paidAmount: 2200,
    status: "Completed",
    paymentStatus: "Paid",
    paymentMethod: "UPI (PhonePe)",
    isFloodlightOn: false,
  }
];

export const getMemoryBookings = () => memoryBookings;

// @desc    List bookings with date, turf, status, and search filters
// @route   GET /api/bookings
// @access  Private
export const getBookings = async (req, res, next) => {
  try {
    const { date, turfId, status, search, limit } = req.query;

    if (getDbStatus().isConnected) {
      const query = {};
      if (date) query.date = date;
      if (status && status !== "all") query.status = status;
      if (turfId && turfId !== "all") {
        if (turfId.match(/^[0-9a-fA-F]{24}$/)) {
          query.turf = turfId;
        } else {
          query.turfId = turfId;
        }
      }
      if (search) {
        query.$or = [
          { bookingId: { $regex: search, $options: "i" } },
          { customerName: { $regex: search, $options: "i" } },
          { customerPhone: { $regex: search, $options: "i" } },
          { turfName: { $regex: search, $options: "i" } },
        ];
      }

      let queryBuilder = Booking.find(query).sort({ date: -1, startTime: 1 });
      if (limit) queryBuilder = queryBuilder.limit(Number(limit));
      const bookings = await queryBuilder;

      return res.json({
        success: true,
        count: bookings.length,
        data: bookings,
      });
    }

    // Standalone memory mode
    let list = [...memoryBookings];
    if (date) list = list.filter((b) => b.date === date);
    if (status && status !== "all") list = list.filter((b) => b.status === status);
    if (turfId && turfId !== "all") list = list.filter((b) => b.turfId === turfId);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.bookingId.toLowerCase().includes(s) ||
          b.customerName.toLowerCase().includes(s) ||
          b.turfName.toLowerCase().includes(s)
      );
    }
    if (limit) list = list.slice(0, Number(limit));

    res.json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking details by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req, res, next) => {
  try {
    if (getDbStatus().isConnected) {
      let booking = await Booking.findOne({ bookingId: req.params.id }).populate("turf");
      if (!booking && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        booking = await Booking.findById(req.params.id).populate("turf");
      }
      if (booking) return res.json({ success: true, data: booking });
    }

    const found = memoryBookings.find(
      (b) => b.id === req.params.id || b.bookingId === req.params.id
    );
    if (!found) {
      return res.status(404).json({
        success: false,
        message: "Booking record not found.",
      });
    }

    res.json({
      success: true,
      data: found,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create manual booking entered by owner
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res, next) => {
  try {
    const {
      turfId,
      customerName,
      customerPhone,
      date,
      timeSlot,
      startTime: reqStartTime,
      endTime: reqEndTime,
      bookingType,
      paymentMethod,
      paymentStatus,
      paidAmount: reqPaidAmount,
      notes,
    } = req.body;

    if (!turfId || !customerName || !date || (!timeSlot && (!reqStartTime || !reqEndTime))) {
      return res.status(400).json({
        success: false,
        message: "Please provide pitch facility, customerName, date, and timeSlot.",
      });
    }

    // Determine start and end times
    let startTime = reqStartTime;
    let endTime = reqEndTime;
    let formattedSlot = timeSlot;

    if (timeSlot && (!startTime || !endTime)) {
      // Handles format "20:00 - 22:00" or "20:00 - 22:00 (Late Night)"
      const cleanSlot = timeSlot.split("(")[0].trim();
      const parts = cleanSlot.split(" - ");
      if (parts.length === 2) {
        startTime = parts[0].trim();
        endTime = parts[1].trim();
      }
    }

    if (!formattedSlot && startTime && endTime) {
      formattedSlot = `${startTime} - ${endTime}`;
    }

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      return res.status(400).json({
        success: false,
        message: "Booking end time must be later than start time.",
      });
    }

    const durationHours = Math.round(((endMinutes - startMinutes) / 60) * 100) / 100;

    // Resolve Turf using robust resolver (MongoDB or master list)
    const turf = await findTurfByIdOrCustomId(turfId);
    if (!turf) {
      return res.status(404).json({
        success: false,
        message: "Selected turf does not exist.",
      });
    }

    if (turf.status && turf.status !== "active") {
      return res.status(400).json({
        success: false,
        message: `Turf "${turf.name}" is currently inactive and cannot accept new bookings.`,
      });
    }

    // 1. Check for overlapping Confirmed/Pending bookings on same turf and date
    if (getDbStatus().isConnected) {
      const existingBookings = await Booking.find({
        $or: [{ turf: turf._id }, { turfId: turf.customId || turf._id.toString() }],
        date: date,
        status: { $in: ["Confirmed", "Pending", "Completed"] },
      });

      for (const b of existingBookings) {
        if (isOverlapping(startTime, endTime, b.startTime, b.endTime)) {
          return res.status(409).json({
            success: false,
            message: `Schedule conflict: ${turf.name} is already booked from ${b.startTime} to ${b.endTime} for "${b.customerName}" (Ref #${b.bookingId}).`,
          });
        }
      }

      // Check maintenance blocks
      const blockedSlots = await TimeSlot.find({
        $or: [{ turf: turf._id }, { turfId: turf.customId || turf._id.toString() }],
        date: date,
        status: "Blocked",
      });

      for (const slot of blockedSlots) {
        if (isOverlapping(startTime, endTime, slot.startTime, slot.endTime)) {
          return res.status(409).json({
            success: false,
            message: `Slot is unavailable: ${turf.name} is blocked for maintenance (${slot.blockReason || "Facility Maintenance"}).`,
          });
        }
      }
    } else {
      const existingBookings = memoryBookings.filter(
        (b) =>
          b.turfId === turf.id &&
          b.date === date &&
          b.status !== "Cancelled"
      );
      for (const b of existingBookings) {
        if (isOverlapping(startTime, endTime, b.startTime, b.endTime)) {
          return res.status(409).json({
            success: false,
            message: `Schedule conflict: ${turf.name} is already booked from ${b.startTime} to ${b.endTime} for "${b.customerName}" (Ref #${b.bookingId}).`,
          });
        }
      }
    }

    // Server-side calculation of total price
    const calculatedAmount = Math.round(turf.hourlyPrice * durationHours * 100) / 100;

    const initialPaymentStatus = paymentStatus || "Paid";
    let paidAmount = 0;
    if (initialPaymentStatus === "Paid") {
      paidAmount = calculatedAmount;
    } else if (initialPaymentStatus === "Partial") {
      paidAmount = reqPaidAmount !== undefined ? Math.min(Number(reqPaidAmount), calculatedAmount) : calculatedAmount / 2;
    }

    const customerInitials = (customerName || "WG")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const generatedBookingId = `TE-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBookingData = {
      id: generatedBookingId,
      bookingId: generatedBookingId,
      customerName: customerName.trim(),
      customerPhone: customerPhone ? customerPhone.trim() : "",
      customerInitials,
      turf: turf._id || turf.id,
      turfId: turf.customId || turf.id || turf._id.toString(),
      turfName: turf.name,
      turfType: turf.surfaceGrade || turf.sport || "Synthetic 4G",
      date,
      displayDate: `Date: ${date}`,
      startTime,
      endTime,
      timeSlot: formattedSlot,
      durationHours,
      bookingType: bookingType || "Casual Match",
      amount: calculatedAmount,
      paidAmount,
      status: "Confirmed",
      paymentStatus: initialPaymentStatus,
      paymentMethod: paymentMethod || "Cash at Desk",
      isFloodlightOn: startMinutes >= 1080 || endMinutes >= 1080,
      notes: notes || "",
    };

    if (getDbStatus().isConnected) {
      const createdBooking = await Booking.create(newBookingData);

      // Create TimeSlot record
      await TimeSlot.create({
        turf: turf._id,
        turfId: turf.customId || turf._id.toString(),
        date,
        startTime,
        endTime,
        timeSlot: formattedSlot,
        status: "Booked",
        booking: createdBooking._id,
        notes: `Booked by ${customerName}`,
      });

      // Ledger Payment record
      if (paidAmount > 0) {
        const generatedPayId = `PAY-${Math.floor(2100 + Math.random() * 8900)}`;
        await Payment.create({
          paymentId: generatedPayId,
          booking: createdBooking._id,
          bookingId: createdBooking.bookingId,
          customerName: createdBooking.customerName,
          customerPhone: createdBooking.customerPhone,
          customerInitials: createdBooking.customerInitials,
          turfName: createdBooking.turfName,
          slotTime: `${createdBooking.date}, ${createdBooking.timeSlot}`,
          totalAmount: calculatedAmount,
          receivedAmount: paidAmount,
          dueBalance: Math.max(0, calculatedAmount - paidAmount),
          paymentMethod: paymentMethod || "Cash at Desk",
          paymentMethodType: (paymentMethod || "").toLowerCase().includes("upi") ? "upi" : "cash",
          status: paidAmount >= calculatedAmount ? "Paid" : "Partial",
          date: new Date().toISOString().replace("T", " ").slice(0, 16),
          ref: `REC-${generatedBookingId}`,
        });
      }

      return res.status(201).json({
        success: true,
        message: "Booking confirmed successfully.",
        data: createdBooking,
      });
    }

    // Standalone memory storage
    memoryBookings.unshift(newBookingData);

    res.status(201).json({
      success: true,
      message: "Booking confirmed successfully.",
      data: newBookingData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update eligible booking
// @route   PUT /api/bookings/:id
// @access  Private
export const updateBooking = async (req, res, next) => {
  try {
    if (getDbStatus().isConnected) {
      let booking = await Booking.findOne({ bookingId: req.params.id });
      if (!booking && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        booking = await Booking.findById(req.params.id);
      }
      if (booking) {
        const { customerName, customerPhone, bookingType, notes } = req.body;
        if (customerName) booking.customerName = customerName;
        if (customerPhone !== undefined) booking.customerPhone = customerPhone;
        if (bookingType) booking.bookingType = bookingType;
        if (notes !== undefined) booking.notes = notes;
        await booking.save();
        return res.json({ success: true, message: "Booking updated.", data: booking });
      }
    }

    const idx = memoryBookings.findIndex((b) => b.id === req.params.id || b.bookingId === req.params.id);
    if (idx !== -1) {
      memoryBookings[idx] = { ...memoryBookings[idx], ...req.body };
      return res.json({ success: true, message: "Booking updated.", data: memoryBookings[idx] });
    }

    res.status(404).json({ success: false, message: "Booking not found." });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking safely
// @route   PATCH /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res, next) => {
  try {
    if (getDbStatus().isConnected) {
      let booking = await Booking.findOne({ bookingId: req.params.id });
      if (!booking && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        booking = await Booking.findById(req.params.id);
      }
      if (booking) {
        booking.status = "Cancelled";
        booking.paymentStatus = "Refunded";
        await booking.save();
        await TimeSlot.deleteMany({ booking: booking._id });
        await Payment.updateMany({ booking: booking._id }, { status: "Refunded" });
        return res.json({
          success: true,
          message: `Booking #${booking.bookingId} cancelled safely. Slot released.`,
          data: booking,
        });
      }
    }

    const idx = memoryBookings.findIndex((b) => b.id === req.params.id || b.bookingId === req.params.id);
    if (idx !== -1) {
      memoryBookings[idx].status = "Cancelled";
      memoryBookings[idx].paymentStatus = "Refunded";
      return res.json({
        success: true,
        message: `Booking #${memoryBookings[idx].bookingId} cancelled safely. Slot released.`,
        data: memoryBookings[idx],
      });
    }

    res.status(404).json({ success: false, message: "Booking not found." });
  } catch (error) {
    next(error);
  }
};
