import mongoose from "mongoose";

// Disable command buffering so operations fail fast with clean errors if disconnected
mongoose.set("bufferCommands", false);

let isDbConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    console.warn(
      "[Database Warning] MONGODB_URI is not set in server/.env. Database features will be unavailable until a connection string is configured."
    );
    isDbConnected = false;
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isDbConnected = true;
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isDbConnected = false;
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    return false;
  }
};

export const getDbStatus = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  const state = states[mongoose.connection.readyState] || "unknown";
  return {
    state,
    isConnected: mongoose.connection.readyState === 1,
  };
};
