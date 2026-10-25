import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
      default: "",
    },
    customerInitials: {
      type: String,
      default: "WG",
    },
    turf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Turf",
      required: [true, "Turf reference is required"],
      index: true,
    },
    turfId: {
      type: String, // String representation or customId for frontend compatibility
      index: true,
    },
    turfName: {
      type: String,
      default: "",
    },
    turfType: {
      type: String,
      default: "",
    },
    date: {
      type: String, // Formatted as YYYY-MM-DD
      required: [true, "Booking date is required"],
      index: true,
    },
    displayDate: {
      type: String,
      default: "",
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
      type: String, // "18:00 - 20:00"
      required: true,
    },
    durationHours: {
      type: Number,
      required: true,
      min: [0.5, "Duration must be at least 30 minutes"],
      default: 1,
    },
    bookingType: {
      type: String,
      default: "Casual Match",
    },
    amount: {
      type: Number,
      required: [true, "Booking amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    status: {
      type: String,
      enum: ["Confirmed", "Completed", "Cancelled", "Pending"],
      default: "Confirmed",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Partial", "Refunded"],
      default: "Pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      default: "Cash at Desk",
    },
    isFloodlightOn: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Virtual id mapping for frontend compatibility
bookingSchema.virtual("id").get(function () {
  return this.bookingId;
});

bookingSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret.bookingId;
    return ret;
  },
});

export const Booking = mongoose.model("Booking", bookingSchema);
