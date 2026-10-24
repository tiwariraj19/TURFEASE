import React from "react";

export function StatusBadge({ status, type = "default" }) {
  const norm = (status || "").toLowerCase();

  // Booking & General Statuses
  if (norm === "confirmed" || norm === "active" || norm === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-highest text-secondary text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
        {status}
      </span>
    );
  }

  if (norm === "completed" || norm === "optimal") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        {status}
      </span>
    );
  }

  if (norm === "pending" || norm === "partial" || norm === "unpaid") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-secondary text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
        {status}
      </span>
    );
  }

  if (norm === "cancelled" || norm === "inactive" || norm === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-error" />
        {status}
      </span>
    );
  }

  // Payment Statuses
  if (norm === "paid" || norm === "fully paid") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-container text-on-primary text-xs font-semibold">
        <span className="material-symbols-outlined text-[14px]">check_circle</span>
        Paid
      </span>
    );
  }

  if (norm === "refunded") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-semibold">
        <span className="material-symbols-outlined text-[14px]">undo</span>
        Refunded
      </span>
    );
  }

  // Slots availability
  if (norm === "available") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
        Available
      </span>
    );
  }

  if (norm === "booked") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-on-secondary text-xs font-semibold">
        Booked
      </span>
    );
  }

  if (norm === "blocked" || norm === "maintenance") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-highest text-tertiary text-xs font-semibold">
        <span className="material-symbols-outlined text-[13px]">build</span>
        Maintenance
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold">
      {status}
    </span>
  );
}
