import { TimeSlot } from "../models/TimeSlot.js";
import { Turf } from "../models/Turf.js";
import { Booking } from "../models/Booking.js";
import { getDbStatus } from "../config/db.js";
import { INITIAL_TURFS } from "../constants/initialData.js";
import { findTurfByIdOrCustomId } from "./turfController.js";
import { getMemoryBookings } from "./bookingController.js";

// Standard time intervals matching the frontend slots calendar
const STANDARD_SLOT_TIMES = [
  "06:00 - 08:00",
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
  "18:00 - 20:00",
  "20:00 - 22:00",
  "22:00 - 24:00",
];

let memoryBlockedSlots = [];

// @desc    Get availability matrix for a date and turfs
// @route   GET /api/slots/availability
// @access  Private
export const getAvailability = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];

    let turfs = [];
    let bookings = [];
    let blockedSlots = [];

    if (getDbStatus().isConnected) {
      turfs = await Turf.find({ status: "active" }).sort({ createdAt: 1 });
      bookings = await Booking.find({
        date,
        status: { $in: ["Confirmed", "Pending", "Completed"] },
      });
      blockedSlots = await TimeSlot.find({
        date,
        status: "Blocked",
      });
    } else {
      turfs = INITIAL_TURFS.filter((t) => t.status === "active");
      bookings = getMemoryBookings().filter(
        (b) => b.date === date && b.status !== "Cancelled"
      );
      blockedSlots = memoryBlockedSlots.filter((b) => b.date === date);
    }

    // Build responsive matrix suitable for the Slots & Bookings UI
    const matrix = STANDARD_SLOT_TIMES.map((timeRange, index) => {
      const slotRow = {
        id: `slot-${index + 1}`,
        time: timeRange,
      };

      turfs.forEach((turf, tIdx) => {
        const pitchKey = `pitch${tIdx + 1}`;
        const turfIdStr = turf.customId || turf.id || turf._id?.toString();

        // 1. Check if blocked for maintenance
        const blocked = blockedSlots.find(
          (b) =>
            (b.turf?.toString() === turf._id?.toString() || b.turfId === turfIdStr || b.turfId === turf.id) &&
            b.timeSlot === timeRange
        );

        if (blocked) {
          slotRow[pitchKey] = {
            type: "blocked",
            title: blocked.blockReason || "Maintenance & Irrigation",
            subtitle: blocked.notes || "Facility Blocked",
            reason: blocked.blockReason || "Maintenance",
            slotId: blocked._id || `block-${index}`,
          };
          return;
        }

        // 2. Check if booked
        const booking = bookings.find(
          (b) =>
            (b.turf?.toString() === turf._id?.toString() || b.turfId === turfIdStr || b.turfId === turf.id) &&
            (b.timeSlot === timeRange || b.timeSlot?.startsWith(timeRange.split(" - ")[0]))
        );

        if (booking) {
          slotRow[pitchKey] = {
            type: "booked",
            title: `${booking.customerName} (${booking.bookingType || "Match"})`,
            customer: booking.customerName,
            amount: `$${booking.amount}`,
            bookingId: booking.bookingId || booking.id,
            status: booking.paymentStatus,
            isPrime: timeRange.includes("18:00") || timeRange.includes("20:00"),
          };
          return;
        }

        // 3. Available
        slotRow[pitchKey] = {
          type: "available",
          price: `$${turf.hourlyPrice}/hr`,
          turfId: turfIdStr,
          turfName: turf.name,
          isPrime: timeRange.includes("18:00") || timeRange.includes("20:00"),
        };
      });

      return slotRow;
    });

    res.json({
      success: true,
      date,
      turfs: turfs.map((t, idx) => ({
        key: `pitch${idx + 1}`,
        id: t.customId || t.id || t._id?.toString(),
        name: t.name,
        price: t.hourlyPrice,
      })),
      matrix,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Block a slot for maintenance, private event or aeration
// @route   POST /api/slots/block
// @access  Private
export const blockSlot = async (req, res, next) => {
  try {
    const { turfId, date, timeSlot, startTime, endTime, reason, notes } = req.body;

    if (!turfId || !date || (!timeSlot && (!startTime || !endTime))) {
      return res.status(400).json({
        success: false,
        message: "Please provide turfId, date, and slot time details.",
      });
    }

    const turf = await findTurfByIdOrCustomId(turfId);
    if (!turf) {
      return res.status(404).json({
        success: false,
        message: "Turf not found.",
      });
    }

    let slotStart = startTime;
    let slotEnd = endTime;
    let formattedSlot = timeSlot;

    if (timeSlot && (!slotStart || !slotEnd)) {
      const parts = timeSlot.split(" - ");
      slotStart = parts[0]?.trim();
      slotEnd = parts[1]?.trim();
    }
    if (!formattedSlot && slotStart && slotEnd) {
      formattedSlot = `${slotStart} - ${slotEnd}`;
    }

    if (getDbStatus().isConnected) {
      const blockedSlot = await TimeSlot.findOneAndUpdate(
        {
          $or: [{ turf: turf._id }, { turfId: turf.customId || turf._id.toString() }],
          date,
          timeSlot: formattedSlot,
        },
        {
          turf: turf._id,
          turfId: turf.customId || turf._id.toString(),
          date,
          startTime: slotStart,
          endTime: slotEnd,
          timeSlot: formattedSlot,
          status: "Blocked",
          blockReason: reason || "Routine Grounds Care",
          notes: notes || "Maintenance Blocked by Owner",
        },
        { upsert: true, new: true }
      );
      return res.status(201).json({
        success: true,
        message: `Maintenance block successfully applied on ${turf.name} for ${formattedSlot}.`,
        data: blockedSlot,
      });
    }

    const newBlock = {
      turfId: turf.id || turf.customId,
      turfName: turf.name,
      date,
      timeSlot: formattedSlot,
      blockReason: reason || "Routine Grounds Care",
      notes: notes || "Maintenance Blocked by Owner",
    };
    memoryBlockedSlots.push(newBlock);

    res.status(201).json({
      success: true,
      message: `Maintenance block successfully applied on ${turf.name} for ${formattedSlot}.`,
      data: newBlock,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unblock a previously blocked slot
// @route   POST /api/slots/unblock
// @access  Private
export const unblockSlot = async (req, res, next) => {
  try {
    const { turfId, date, timeSlot } = req.body;

    if (getDbStatus().isConnected) {
      const query = { status: "Blocked" };
      if (date) query.date = date;
      if (timeSlot) query.timeSlot = timeSlot;

      if (turfId) {
        const turf = await findTurfByIdOrCustomId(turfId);
        if (turf) {
          query.$or = [{ turf: turf._id }, { turfId: turf.customId || turf._id.toString() }];
        }
      }

      const result = await TimeSlot.deleteMany(query);
      return res.json({
        success: true,
        message: `Maintenance block released (${result.deletedCount} slot(s) reopened).`,
      });
    }

    memoryBlockedSlots = memoryBlockedSlots.filter(
      (b) => !(b.timeSlot === timeSlot && (!date || b.date === date))
    );

    res.json({
      success: true,
      message: `Maintenance block released for ${timeSlot}. The slot is now available for booking.`,
    });
  } catch (error) {
    next(error);
  }
};
