// ==========================================
// TurfEase API Test Runner
// Verifies All REST Endpoints & Safeguards
// ==========================================

const BASE_URL = "http://localhost:5000/api";

const results = [];

function recordResult(testName, passed, details = "") {
  results.push({ testName, passed, details });
  const statusIcon = passed ? "✓ PASS" : "✗ FAIL";
  console.log(`${statusIcon}: ${testName} ${details ? `(${details})` : ""}`);
}

async function runTests() {
  console.log("\n==========================================");
  console.log("Starting TurfEase Backend Test Suite");
  console.log("Target Base URL:", BASE_URL);
  console.log("==========================================\n");

  let authToken = "";

  // 1. Health Check
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    recordResult(
      "Health Check (GET /api/health)",
      res.status === 200 && data.status === "ok",
      `Status: ${data.status}, DB: ${data.database?.status}`
    );
  } catch (err) {
    recordResult("Health Check (GET /api/health)", false, err.message);
  }

  // 2. Auth Login with Seed Credentials
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "owner@turfease.in",
        password: "owner1234",
      }),
    });
    const data = await res.json();
    if (res.status === 200 && data.token) {
      authToken = data.token;
      recordResult("Owner Login (POST /api/auth/login)", true, "JWT token acquired");
    } else {
      recordResult("Owner Login (POST /api/auth/login)", false, data.message || `HTTP ${res.status}`);
    }
  } catch (err) {
    recordResult("Owner Login (POST /api/auth/login)", false, err.message);
  }

  // 3. Auth Profile Check
  if (authToken) {
    try {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      recordResult(
        "Current Owner Profile (GET /api/auth/me)",
        res.status === 200 && data.owner?.email === "owner@turfease.in",
        `Owner: ${data.owner?.name}`
      );
    } catch (err) {
      recordResult("Current Owner Profile (GET /api/auth/me)", false, err.message);
    }
  }

  // 4. Unauthorized Access Check (Access protected route without token)
  try {
    const res = await fetch(`${BASE_URL}/turfs`);
    const data = await res.json();
    recordResult(
      "Auth Protection Gate (GET /api/turfs without token -> 401)",
      res.status === 401 && !data.success,
      `Rejected with HTTP ${res.status}`
    );
  } catch (err) {
    recordResult("Auth Protection Gate", false, err.message);
  }

  // 5. Dashboard Stats Endpoint
  if (authToken) {
    try {
      const res = await fetch(`${BASE_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      recordResult(
        "Dashboard Statistics (GET /api/dashboard/stats)",
        res.status === 200 && data.success,
        `Active Turfs: ${data.data?.activeTurfs}, Today's Bookings: ${data.data?.todayBookingsCount}`
      );
    } catch (err) {
      recordResult("Dashboard Statistics (GET /api/dashboard/stats)", false, err.message);
    }
  }

  // 6. Reports & Analytics Endpoint
  if (authToken) {
    try {
      const res = await fetch(`${BASE_URL}/reports/analytics?dateRange=This%20Month`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      recordResult(
        "Reports & Analytics (GET /api/reports/analytics)",
        res.status === 200 && data.success,
        `Revenue: $${data.data?.summary?.totalRevenueCollected}, Total Bookings: ${data.data?.summary?.totalBookings}`
      );
    } catch (err) {
      recordResult("Reports & Analytics (GET /api/reports/analytics)", false, err.message);
    }
  }

  // 7. Slots Availability Matrix
  if (authToken) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`${BASE_URL}/slots/availability?date=${today}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      recordResult(
        "Slots Availability Matrix (GET /api/slots/availability)",
        res.status === 200 && Array.isArray(data.matrix),
        `Returned ${data.matrix?.length} slot periods`
      );
    } catch (err) {
      recordResult("Slots Availability Matrix (GET /api/slots/availability)", false, err.message);
    }
  }

  console.log("\n==========================================");
  console.log("Test Summary");
  console.log("==========================================");
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${results.length - passedCount}`);
}

runTests();
