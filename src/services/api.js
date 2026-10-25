// ==========================================
// TurfEase Centralized API Client Layer
// Connects Frontend to Express/MongoDB Backend
// ==========================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Helper for making authenticated requests
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem("turfease_jwt_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        data?.message || `Server responded with HTTP ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // If backend is offline or network error
    if (!error.status) {
      error.isNetworkError = true;
      error.message =
        "Cannot reach TurfEase Backend. Ensure the Node server is running on port 5000.";
    }
    throw error;
  }
}

// ------------------------------------------
// System Health Check
// ------------------------------------------
export const healthAPI = {
  check: () => request("/health", { method: "GET" }),
};

// ------------------------------------------
// Owner Authentication
// ------------------------------------------
export const authAPI = {
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request("/auth/me", { method: "GET" }),
};

// ------------------------------------------
// Turfs Management
// ------------------------------------------
export const turfAPI = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set("search", params.search);
    if (params.sportCategory && params.sportCategory !== "all")
      searchParams.set("sportCategory", params.sportCategory);
    if (params.status && params.status !== "all")
      searchParams.set("status", params.status);
    if (params.sort) searchParams.set("sort", params.sort);
    const qs = searchParams.toString();
    return request(`/turfs${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => request(`/turfs/${id}`),
  create: (turfData) =>
    request("/turfs", {
      method: "POST",
      body: JSON.stringify(turfData),
    }),
  update: (id, turfData) =>
    request(`/turfs/${id}`, {
      method: "PUT",
      body: JSON.stringify(turfData),
    }),
  toggleStatus: (id) =>
    request(`/turfs/${id}/status`, {
      method: "PATCH",
    }),
  delete: (id) =>
    request(`/turfs/${id}`, {
      method: "DELETE",
    }),
};

// ------------------------------------------
// Slots & Bookings
// ------------------------------------------
export const bookingAPI = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.date) searchParams.set("date", params.date);
    if (params.turfId && params.turfId !== "all")
      searchParams.set("turfId", params.turfId);
    if (params.status && params.status !== "all")
      searchParams.set("status", params.status);
    if (params.search) searchParams.set("search", params.search);
    if (params.limit) searchParams.set("limit", params.limit);
    const qs = searchParams.toString();
    return request(`/bookings${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => request(`/bookings/${id}`),
  create: (bookingData) =>
    request("/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData),
    }),
  update: (id, bookingData) =>
    request(`/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(bookingData),
    }),
  cancel: (id) =>
    request(`/bookings/${id}/cancel`, {
      method: "PATCH",
    }),
};

// ------------------------------------------
// Slots Availability Matrix & Blocking
// ------------------------------------------
export const slotAPI = {
  getAvailability: (date) =>
    request(`/slots/availability${date ? `?date=${date}` : ""}`),
  block: (blockData) =>
    request("/slots/block", {
      method: "POST",
      body: JSON.stringify(blockData),
    }),
  unblock: (unblockData) =>
    request("/slots/unblock", {
      method: "POST",
      body: JSON.stringify(unblockData),
    }),
};

// ------------------------------------------
// Payments & Ledger
// ------------------------------------------
export const paymentAPI = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== "all")
      searchParams.set("status", params.status);
    if (params.method && params.method !== "all")
      searchParams.set("method", params.method);
    if (params.search) searchParams.set("search", params.search);
    if (params.limit) searchParams.set("limit", params.limit);
    const qs = searchParams.toString();
    return request(`/payments${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => request(`/payments/${id}`),
  record: (paymentData) =>
    request("/payments", {
      method: "POST",
      body: JSON.stringify(paymentData),
    }),
  update: (id, data) =>
    request(`/payments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ------------------------------------------
// Dashboard & Analytics Reports
// ------------------------------------------
export const reportAPI = {
  getDashboardStats: () => request("/dashboard/stats"),
  getAnalytics: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.dateRange) searchParams.set("dateRange", params.dateRange);
    if (params.turfId && params.turfId !== "all")
      searchParams.set("turfId", params.turfId);
    const qs = searchParams.toString();
    return request(`/reports/analytics${qs ? `?${qs}` : ""}`);
  },
};
