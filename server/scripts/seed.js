import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { Owner } from "../models/Owner.js";
import { Turf } from "../models/Turf.js";
import { Booking } from "../models/Booking.js";
import { Payment } from "../models/Payment.js";
import { TimeSlot } from "../models/TimeSlot.js";
import { INITIAL_TURFS } from "../constants/initialData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function seedDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error(
      "Error: MONGODB_URI is not defined in server/.env.\nPlease add your MongoDB Atlas connection string before running the seed script."
    );
    process.exit(1);
  }

  try {
    console.log("[Seed] Connecting to MongoDB Atlas...");
    await mongoose.connect(uri);
    console.log("[Seed] Connected successfully.");

    // 1. Seed or Verify Owner
    const ownerEmail = (process.env.SEED_OWNER_EMAIL || "owner@turfease.in").toLowerCase();
    const ownerPassword = process.env.SEED_OWNER_PASSWORD || "owner1234";
    const ownerName = process.env.SEED_OWNER_NAME || "Vansh Tiwari";

    let owner = await Owner.findOne({ email: ownerEmail });
    if (!owner) {
      owner = await Owner.create({
        name: ownerName,
        email: ownerEmail,
        password: ownerPassword,
        facility: "Greenfield Sports Complex, Pune",
      });
      console.log(`[Seed] Initial Owner created: ${ownerEmail} (${ownerName})`);
    } else {
      owner.name = ownerName;
      owner.facility = "Greenfield Sports Complex, Pune";
      await owner.save();
      console.log(`[Seed] Owner account verified: ${ownerEmail}`);
    }

    // 2. Seed Turfs if none exist
    const turfCount = await Turf.countDocuments();
    let seededTurfs = [];
    if (turfCount === 0) {
      seededTurfs = await Turf.insertMany(INITIAL_TURFS);
      console.log(`[Seed] Initialized ${seededTurfs.length} Indian turf pitches.`);
    } else {
      seededTurfs = await Turf.find();
      console.log(`[Seed] ${turfCount} turf pitch records already exist.`);
    }

    // 3. Seed Sample Bookings if none exist
    const bookingCount = await Booking.countDocuments();
    if (bookingCount === 0 && seededTurfs.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const sampleBookings = [
        {
          bookingId: "TE-8841",
          customerName: "Aarav Sharma",
          customerPhone: "+91 98201 12044",
          customerInitials: "AS",
          turf: seededTurfs[0]._id,
          turfId: seededTurfs[0].customId,
          turfName: seededTurfs[0].name,
          turfType: seededTurfs[0].surfaceGrade,
          date: today,
          displayDate: `Today, ${today}`,
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
          bookingId: "TE-8840",
          customerName: "Rohan Patel",
          customerPhone: "+91 98334 56789",
          customerInitials: "RP",
          turf: seededTurfs[1]?._id || seededTurfs[0]._id,
          turfId: seededTurfs[1]?.customId || seededTurfs[0].customId,
          turfName: seededTurfs[1]?.name || seededTurfs[0].name,
          turfType: seededTurfs[1]?.surfaceGrade || seededTurfs[0].surfaceGrade,
          date: today,
          displayDate: `Today, ${today}`,
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
        },
      ];

      const createdBookings = await Booking.insertMany(sampleBookings);
      console.log(`[Seed] Seeded ${createdBookings.length} initial Indian bookings.`);

      // Seed matching Payments
      const samplePayments = [
        {
          paymentId: "PAY-2094",
          booking: createdBookings[0]._id,
          bookingId: createdBookings[0].bookingId,
          customerName: createdBookings[0].customerName,
          customerPhone: createdBookings[0].customerPhone,
          customerInitials: createdBookings[0].customerInitials,
          turfName: createdBookings[0].turfName,
          slotTime: `${today}, 18:00 - 20:00`,
          totalAmount: 2800,
          receivedAmount: 2800,
          dueBalance: 0,
          paymentMethod: "UPI (GPay)",
          paymentMethodType: "upi",
          status: "Paid",
          date: `${today} 17:30`,
          ref: "UPI/3928192839/CR",
        },
        {
          paymentId: "PAY-2093",
          booking: createdBookings[1]._id,
          bookingId: createdBookings[1].bookingId,
          customerName: createdBookings[1].customerName,
          customerPhone: createdBookings[1].customerPhone,
          customerInitials: createdBookings[1].customerInitials,
          turfName: createdBookings[1].turfName,
          slotTime: `${today}, 16:00 - 18:00`,
          totalAmount: 2200,
          receivedAmount: 2200,
          dueBalance: 0,
          paymentMethod: "UPI (PhonePe)",
          paymentMethodType: "upi",
          status: "Paid",
          date: `${today} 15:45`,
          ref: "UPI/8849102910/OKBI",
        },
      ];
      await Payment.insertMany(samplePayments);
      console.log(`[Seed] Seeded ${samplePayments.length} initial payments.`);
    }

    console.log("[Seed] Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("[Seed Error]", error.message);
    process.exit(1);
  }
}

seedDatabase();
