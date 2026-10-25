// ==========================================
// Indian Standard Currency and Date Formatters
// ==========================================

/**
 * Format a numeric amount as Indian Rupees (₹)
 * Example: 12500 -> "₹12,500"
 */
export const formatINR = (amount, decimals = 0) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "₹0";
  }
  const numericAmount = Number(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numericAmount);
};

/**
 * Format amount with decimal cents if any
 */
export const formatINRPrecise = (amount) => formatINR(amount, 2);

/**
 * Format date in Indian locale (DD/MM/YYYY)
 * Example: "2026-10-25" -> "25/10/2026"
 */
export const formatDateIN = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(d);
};

/**
 * Format date in readable Indian format
 * Example: "2026-10-25" -> "25 Oct 2026"
 */
export const formatDateReadableIN = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(d);
};

/**
 * Format date and time in IST
 * Example: "25 Oct 2026, 06:30 PM"
 */
export const formatDateTimeIN = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(d);
};
