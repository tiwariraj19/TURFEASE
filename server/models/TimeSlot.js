import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema(
  {
    turf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Turf",
      required: [true, "Turf reference is required"],
      index: true,
    },
    turfId: {
      type: String,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: [true, "Date is required"],
      index: true,
    },
    startTime: {
      type: String, // HH:MM
      required: [true, "Start time is required"],
    },
    endTime: {
      type: String, // HH:MM
      required: [true, "End time is required"],
    },
    timeSlot: {
      type: String, // "10:00 - 12:00"
      required: true,
    },
    status: {
      type: String,
      enum: ["Available", "Booked", "Blocked"],
      default: "Available",
      index: true,
    },
    blockReason: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying specific turf schedules
timeSlotSchema.index({ turf: 1, date: 1, startTime: 1, endTime: 1 });
timeSlotSchema.index({ date: 1, status: 1 });

export const TimeSlot = mongoose.model("TimeSlot", timeSlotSchema);
