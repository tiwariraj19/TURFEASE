import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking reference is required"],
      index: true,
    },
    bookingId: {
      type: String,
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      default: "",
    },
    customerInitials: {
      type: String,
      default: "WG",
    },
    turfName: {
      type: String,
      default: "",
    },
    slotTime: {
      type: String,
      default: "",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },
    receivedAmount: {
      type: Number,
      required: true,
      min: [0, "Received amount cannot be negative"],
    },
    dueBalance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Due balance cannot be negative"],
    },
    paymentMethod: {
      type: String,
      default: "UPI (PhonePe)",
    },
    paymentMethodType: {
      type: String,
      enum: ["upi", "cash", "card", "wire", "other"],
      default: "upi",
    },
    status: {
      type: String,
      enum: ["Paid", "Partial", "Pending", "Refunded"],
      default: "Paid",
      index: true,
    },
    ref: {
      type: String,
      default: "",
      trim: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    date: {
      type: String, // String format for UI convenience: "YYYY-MM-DD HH:mm"
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.virtual("id").get(function () {
  return this.paymentId;
});

paymentSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret.paymentId;
    return ret;
  },
});

export const Payment = mongoose.model("Payment", paymentSchema);
