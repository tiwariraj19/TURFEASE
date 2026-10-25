import { Turf } from "../models/Turf.js";
import { Booking } from "../models/Booking.js";
import { getDbStatus } from "../config/db.js";
import { INITIAL_TURFS } from "../constants/initialData.js";

// Active in-memory store for fallback / standalone development mode
let memoryTurfs = [...INITIAL_TURFS];

// Helper to find turf by MongoDB _id, customId, or id
export const findTurfByIdOrCustomId = async (id) => {
  if (!id) return null;

  // 1. If database is connected, search MongoDB
  if (getDbStatus().isConnected) {
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      const turf = await Turf.findById(id);
      if (turf) return turf;
    }
    const turf = await Turf.findOne({ $or: [{ customId: id }, { name: id }] });
    if (turf) return turf;
  }

  // 2. Fallback to memory / standard inventory
  const found = memoryTurfs.find(
    (t) => t.id === id || t.customId === id || t._id === id || t.name === id
  );
  if (found) {
    return {
      ...found,
      _id: found._id || found.id,
      customId: found.customId || found.id,
      save: async function () {
        const idx = memoryTurfs.findIndex((m) => m.id === found.id);
        if (idx !== -1) memoryTurfs[idx] = { ...this };
        return this;
      },
    };
  }

  return null;
};

// @desc    Get all turfs with optional search & filters
// @route   GET /api/turfs
// @access  Private
export const getTurfs = async (req, res, next) => {
  try {
    const { search, sportCategory, status, sort } = req.query;

    if (getDbStatus().isConnected) {
      // Auto-seed initial turfs to MongoDB if collection is currently empty
      const count = await Turf.countDocuments();
      if (count === 0) {
        await Turf.insertMany(INITIAL_TURFS);
        console.log("[Turfs] Auto-seeded initial pitches to MongoDB.");
      }

      const query = {};
      if (status && status !== "all") query.status = status;
      if (sportCategory && sportCategory !== "all") query.sportCategory = sportCategory;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
          { zone: { $regex: search, $options: "i" } },
          { sport: { $regex: search, $options: "i" } },
        ];
      }

      let sortOptions = { createdAt: -1 };
      if (sort === "price-asc") sortOptions = { hourlyPrice: 1 };
      if (sort === "price-desc") sortOptions = { hourlyPrice: -1 };
      if (sort === "capacity-desc") sortOptions = { capacity: -1 };
      if (sort === "name-asc") sortOptions = { name: 1 };

      const turfs = await Turf.find(query).sort(sortOptions);
      return res.json({
        success: true,
        count: turfs.length,
        data: turfs,
      });
    }

    // Fallback mode when MongoDB Atlas connection string is pending
    let list = [...memoryTurfs];
    if (status && status !== "all") {
      list = list.filter((t) => t.status === status);
    }
    if (sportCategory && sportCategory !== "all") {
      list = list.filter((t) => t.sportCategory === sportCategory);
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(s) ||
          t.location.toLowerCase().includes(s) ||
          t.zone.toLowerCase().includes(s) ||
          t.sport.toLowerCase().includes(s)
      );
    }

    res.json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single turf by ID
// @route   GET /api/turfs/:id
// @access  Private
export const getTurfById = async (req, res, next) => {
  try {
    const turf = await findTurfByIdOrCustomId(req.params.id);

    if (!turf) {
      return res.status(404).json({
        success: false,
        message: "Turf facility not found.",
      });
    }

    res.json({
      success: true,
      data: turf,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new turf
// @route   POST /api/turfs
// @access  Private
export const createTurf = async (req, res, next) => {
  try {
    const {
      name,
      location,
      sport,
      sportCategory,
      hourlyPrice,
      capacity,
      openTime,
      closeTime,
      zone,
      surfaceGrade,
      dimensions,
      infill,
      irrigation,
      facilities,
      coverImage,
      status,
    } = req.body;

    if (!name || !location || !sport || hourlyPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide turf name, location, sport type, and hourly price.",
      });
    }

    const totalTurfs = getDbStatus().isConnected
      ? await Turf.countDocuments()
      : memoryTurfs.length;

    const generatedCustomId = `pitch-${Date.now()}`;
    const generatedZone =
      zone || `Zone ${String.fromCharCode(65 + (totalTurfs % 26))} • Pitch 0${totalTurfs + 1}`;

    const newTurfData = {
      name,
      customId: generatedCustomId,
      id: generatedCustomId,
      zone: generatedZone,
      location,
      sport,
      sportCategory: sportCategory || "football",
      hourlyPrice: Number(hourlyPrice),
      capacity: Number(capacity) || 14,
      openTime: openTime || "06:00",
      closeTime: closeTime || "23:00",
      hours: `${openTime || "06:00"}–${closeTime || "23:00"}`,
      surfaceGrade: surfaceGrade || "4G Monofilament Dual-Tone",
      dimensions: dimensions || "50m × 30m",
      infill: infill || "Organic Cork / EPDM Infill",
      irrigation: irrigation || "Automated Sub-irrigation",
      facilities: Array.isArray(facilities) ? facilities : [],
      coverImage: coverImage || "",
      status: status || "active",
      healthStatus: "Optimal",
      moisture: "42.0%",
      lightingStatus: "Ready",
    };

    if (getDbStatus().isConnected) {
      const created = await Turf.create(newTurfData);
      return res.status(201).json({
        success: true,
        message: "Turf pitch created successfully.",
        data: created,
      });
    }

    memoryTurfs.push(newTurfData);
    res.status(201).json({
      success: true,
      message: "Turf pitch created successfully.",
      data: newTurfData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update turf
// @route   PUT /api/turfs/:id
// @access  Private
export const updateTurf = async (req, res, next) => {
  try {
    const turf = await findTurfByIdOrCustomId(req.params.id);

    if (!turf) {
      return res.status(404).json({
        success: false,
        message: "Turf pitch not found.",
      });
    }

    const {
      name,
      zone,
      location,
      sport,
      sportCategory,
      hourlyPrice,
      capacity,
      openTime,
      closeTime,
      surfaceGrade,
      dimensions,
      infill,
      irrigation,
      facilities,
      coverImage,
      status,
      healthStatus,
      moisture,
      lightingStatus,
    } = req.body;

    if (name) turf.name = name;
    if (zone) turf.zone = zone;
    if (location) turf.location = location;
    if (sport) turf.sport = sport;
    if (sportCategory) turf.sportCategory = sportCategory;
    if (hourlyPrice !== undefined) turf.hourlyPrice = Number(hourlyPrice);
    if (capacity !== undefined) turf.capacity = Number(capacity);
    if (openTime) turf.openTime = openTime;
    if (closeTime) turf.closeTime = closeTime;
    if (openTime || closeTime) {
      turf.hours = `${turf.openTime}–${turf.closeTime}`;
    }
    if (surfaceGrade) turf.surfaceGrade = surfaceGrade;
    if (dimensions) turf.dimensions = dimensions;
    if (infill) turf.infill = infill;
    if (irrigation) turf.irrigation = irrigation;
    if (facilities !== undefined) turf.facilities = facilities;
    if (coverImage !== undefined) turf.coverImage = coverImage;
    if (status) turf.status = status;
    if (healthStatus) turf.healthStatus = healthStatus;
    if (moisture) turf.moisture = moisture;
    if (lightingStatus) turf.lightingStatus = lightingStatus;

    await turf.save();

    res.json({
      success: true,
      message: "Turf pitch updated successfully.",
      data: turf,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle turf active / inactive status
// @route   PATCH /api/turfs/:id/status
// @access  Private
export const toggleTurfStatus = async (req, res, next) => {
  try {
    const turf = await findTurfByIdOrCustomId(req.params.id);

    if (!turf) {
      return res.status(404).json({
        success: false,
        message: "Turf pitch not found.",
      });
    }

    turf.status = turf.status === "active" ? "inactive" : "active";
    await turf.save();

    res.json({
      success: true,
      message: `Turf status changed to ${turf.status}.`,
      data: turf,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete turf safely
// @route   DELETE /api/turfs/:id
// @access  Private
export const deleteTurf = async (req, res, next) => {
  try {
    const turf = await findTurfByIdOrCustomId(req.params.id);

    if (!turf) {
      return res.status(404).json({
        success: false,
        message: "Turf pitch not found.",
      });
    }

    if (getDbStatus().isConnected) {
      const bookingCount = await Booking.countDocuments({
        $or: [{ turf: turf._id }, { turfId: turf.customId }],
      });

      if (bookingCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete turf "${turf.name}" because it has ${bookingCount} existing booking record(s). To preserve historical audit integrity, please deactivate the turf instead.`,
        });
      }

      await Turf.findByIdAndDelete(turf._id);
    } else {
      memoryTurfs = memoryTurfs.filter((t) => t.id !== turf.id);
    }

    res.json({
      success: true,
      message: `Turf "${turf.name}" has been permanently removed.`,
    });
  } catch (error) {
    next(error);
  }
};
