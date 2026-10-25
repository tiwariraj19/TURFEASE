import mongoose from "mongoose";

const turfSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Turf name is required"],
      trim: true,
    },
    customId: {
      type: String,
      trim: true,
      index: true,
    },
    zone: {
      type: String,
      default: "Zone A • Pitch 01",
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    sport: {
      type: String,
      required: [true, "Sport type is required"],
      trim: true,
    },
    sportCategory: {
      type: String,
      enum: ["football", "cricket", "multi-sport", "tennis", "other"],
      default: "football",
    },
    description: {
      type: String,
      trim: true,
    },
    hourlyPrice: {
      type: Number,
      required: [true, "Hourly price is required"],
      min: [0, "Hourly price cannot be negative"],
    },
    capacity: {
      type: Number,
      required: [true, "Player capacity is required"],
      min: [1, "Capacity must be at least 1"],
      default: 14,
    },
    openTime: {
      type: String,
      required: [true, "Opening time is required (HH:MM)"],
      default: "06:00",
    },
    closeTime: {
      type: String,
      required: [true, "Closing time is required (HH:MM)"],
      default: "23:00",
    },
    hours: {
      type: String,
      default: "06:00–23:00",
    },
    surfaceGrade: {
      type: String,
      default: "4G Monofilament Dual-Tone",
    },
    dimensions: {
      type: String,
      default: "50m × 30m",
    },
    infill: {
      type: String,
      default: "Organic Cork / EPDM Infill",
    },
    irrigation: {
      type: String,
      default: "Automated Sub-irrigation",
    },
    facilities: {
      type: [String],
      default: [],
    },
    coverImage: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    healthStatus: {
      type: String,
      default: "Optimal",
    },
    moisture: {
      type: String,
      default: "42.0%",
    },
    lightingStatus: {
      type: String,
      default: "Ready",
    },
  },
  {
    timestamps: true,
  }
);

// Helpful virtual id formatting for compatibility with frontend (using id or _id)
turfSchema.virtual("id").get(function () {
  return this.customId || this._id.toHexString();
});

turfSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret.customId || ret._id.toString();
    return ret;
  },
});

export const Turf = mongoose.model("Turf", turfSchema);
