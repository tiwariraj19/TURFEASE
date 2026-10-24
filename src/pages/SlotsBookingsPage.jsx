import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { StatCard } from "../components/common/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import {
  getStoredTurfs,
  getStoredBookings,
  saveStoredBookings,
  INITIAL_SLOTS
} from "../data/mockData";

export function SlotsBookingsPage() {
  const context = useOutletContext() || {};
  const globalSearch = context.globalSearch || "";

  const [turfs] = useState(getStoredTurfs());
  const [bookings, setBookings] = useState(getStoredBookings());
  const [slots, setSlots] = useState(INITIAL_SLOTS);

  // Tab View: 'calendar' | 'ledger'
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedTurfFilter, setSelectedTurfFilter] = useState("all");
  const [currentDate, setCurrentDate] = useState("2026-10-24");

  // Modals
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);
  const [cancelTargetBooking, setCancelTargetBooking] = useState(null);

  // Manual Booking Form State
  const [bookingForm, setBookingForm] = useState({
    customerName: "",
    customerPhone: "",
    turfId: turfs[0]?.id || "pitch-1",
    date: "2026-10-24",
    timeSlot: "18:00 - 20:00",
    bookingType: "Casual Match",
    paymentMethod: "Cash at Desk",
    paymentStatus: "Paid",
  });

  // Maintenance Block Form State
  const [blockForm, setBlockForm] = useState({
    turfId: turfs[0]?.id || "pitch-1",
    timeSlot: "10:00 - 12:00",
    reason: "Routine Sprinklers & Infill",
    notes: "Grounds superintendent scheduled cycle"
  });

  // Conflict Detection: check if chosen turf & timeSlot is already booked or blocked
  const checkConflict = (turfId, timeSlot) => {
    // Check against bookings on that date
    const booked = bookings.find(
      (b) =>
        b.turfId === turfId &&
        b.timeSlot === timeSlot &&
        b.status !== "Cancelled"
    );
    if (booked) {
      return { hasConflict: true, message: `Conflict Warning: ${booked.turfName} is already booked by ${booked.customerName} (#${booked.id}) for ${timeSlot}.` };
    }
    return { hasConflict: false };
  };

  const conflictInfo = checkConflict(bookingForm.turfId, bookingForm.timeSlot);

  const handleCreateBooking = (e) => {
    e.preventDefault();
    if (conflictInfo.hasConflict) {
      alert("Cannot create booking due to a schedule conflict. Please choose another turf or time slot.");
      return;
    }

    const selectedTurf = turfs.find((t) => t.id === bookingForm.turfId) || turfs[0];
    const newBooking = {
      id: `TE-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: bookingForm.customerName || "Walk-in Guest",
      customerPhone: bookingForm.customerPhone || "+1 (555) 000-0000",
      customerInitials: (bookingForm.customerName || "WG")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
      turfId: selectedTurf.id,
      turfName: selectedTurf.name,
      turfType: selectedTurf.surfaceGrade,
      date: bookingForm.date,
      displayDate: "Today, Oct 24",
      timeSlot: bookingForm.timeSlot,
      startTime: bookingForm.timeSlot.split(" - ")[0],
      endTime: bookingForm.timeSlot.split(" - ")[1],
      durationHours: 2,
      bookingType: bookingForm.bookingType,
      amount: selectedTurf.hourlyPrice * 2,
      paidAmount: bookingForm.paymentStatus === "Paid" ? selectedTurf.hourlyPrice * 2 : 0,
      status: "Confirmed",
      paymentStatus: bookingForm.paymentStatus,
      paymentMethod: bookingForm.paymentMethod,
      isFloodlightOn: true,
    };

    const updated = [newBooking, ...bookings];
    setBookings(updated);
    saveStoredBookings(updated);
    setIsManualBookingOpen(false);
    setBookingForm({
      customerName: "",
      customerPhone: "",
      turfId: turfs[0]?.id || "pitch-1",
      date: "2026-10-24",
      timeSlot: "18:00 - 20:00",
      bookingType: "Casual Match",
      paymentMethod: "Cash at Desk",
      paymentStatus: "Paid",
    });
  };

  const handleBlockSlot = (e) => {
    e.preventDefault();
    alert(`Maintenance block applied for ${blockForm.timeSlot} on ${turfs.find(t => t.id === blockForm.turfId)?.name || 'Pitch'}.`);
    setIsMaintenanceOpen(false);
  };

  const handleUnlockSlot = (slotTime, pitchKey) => {
    alert(`Maintenance block released for ${slotTime}. The slot is now available for booking.`);
  };

  const handleCancelBooking = (bookingId) => {
    const updated = bookings.map((b) =>
      b.id === bookingId ? { ...b, status: "Cancelled", paymentStatus: "Refunded" } : b
    );
    setBookings(updated);
    saveStoredBookings(updated);
    setSelectedBookingDetails(null);
    setCancelTargetBooking(null);
  };

  const prefillQuickReserve = (turfName, slotTime) => {
    const turf = turfs.find((t) => t.name.toLowerCase().includes(turfName.toLowerCase())) || turfs[0];
    setBookingForm({
      ...bookingForm,
      turfId: turf.id,
      timeSlot: slotTime,
    });
    setIsManualBookingOpen(true);
  };

  // Filter for Bookings List view
  const filteredBookingsList = bookings.filter((b) => {
    const matchesSearch =
      !globalSearch ||
      b.customerName.toLowerCase().includes(globalSearch.toLowerCase()) ||
      b.id.toLowerCase().includes(globalSearch.toLowerCase()) ||
      b.turfName.toLowerCase().includes(globalSearch.toLowerCase());

    const matchesTurf =
      selectedTurfFilter === "all" ||
      b.turfId === selectedTurfFilter ||
      b.turfName.toLowerCase().includes(selectedTurfFilter.toLowerCase());

    return matchesSearch && matchesTurf;
  });

  return (
    <div className="flex flex-col w-full">
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs font-heading text-xs uppercase tracking-wider text-secondary font-bold mb-1">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span>Turf Scheduling &amp; Reservations</span>
          </div>
          <h1 className="font-heading text-2xl lg:text-3xl text-primary font-bold tracking-tight">
            Slots &amp; Bookings
          </h1>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Manage live turf availability, coordinate agronomy maintenance blocks, and reserve customer pitch sessions.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            onClick={() => setIsMaintenanceOpen(true)}
            className="inline-flex items-center gap-space-xs px-5 py-2.5 rounded-full bg-surface-container-high text-primary hover:bg-surface-container-highest transition-all duration-200 font-heading text-xs sm:text-sm shadow-sm font-semibold"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">build_circle</span>
            <span>Block Slot (Maintenance)</span>
          </button>
          <button
            onClick={() => setIsManualBookingOpen(true)}
            className="inline-flex items-center gap-space-xs px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-secondary text-on-primary hover:opacity-95 transition-all duration-200 shadow-md font-heading text-xs sm:text-sm font-semibold tracking-wide"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>+ Manual Booking</span>
          </button>
        </div>
      </div>

      {/* Telemetry Highlights Strip (4 KPI Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md mb-space-lg">
        <div className="bg-surface-container-low p-space-md rounded-xl flex items-center justify-between shadow-sm border border-surface-container/60">
          <div className="flex flex-col">
            <span className="font-heading text-[10px] sm:text-xs uppercase tracking-wider text-on-surface-variant font-bold">
              Total Daily Bookings
            </span>
            <span className="font-heading text-lg sm:text-2xl text-primary font-bold mt-1">
              18 / 24 <span className="text-xs font-normal text-secondary">Slots</span>
            </span>
            <span className="font-heading text-[11px] text-on-surface-variant mt-0.5">
              75% Pitch Utilization
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-xl">event_available</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-space-md rounded-xl flex items-center justify-between shadow-sm border border-surface-container/60">
          <div className="flex flex-col">
            <span className="font-heading text-[10px] sm:text-xs uppercase tracking-wider text-on-surface-variant font-bold">
              Today's Revenue
            </span>
            <span className="font-heading text-lg sm:text-2xl text-primary font-bold mt-1">
              $2,420.00
            </span>
            <span className="font-heading text-[11px] text-secondary font-semibold mt-0.5">
              +$420 in Advance Held
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-xl">payments</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-space-md rounded-xl flex items-center justify-between shadow-sm border border-surface-container/60">
          <div className="flex flex-col">
            <span className="font-heading text-[10px] sm:text-xs uppercase tracking-wider text-on-surface-variant font-bold">
              Agronomy &amp; Mowing
            </span>
            <span className="font-heading text-lg sm:text-2xl text-primary font-bold mt-1">
              2 Slots
            </span>
            <span className="font-heading text-[11px] text-tertiary-container mt-0.5">
              Pitch 1 &amp; Pitch 4
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-tertiary shrink-0">
            <span className="material-symbols-outlined text-xl">grass</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-space-md rounded-xl flex items-center justify-between shadow-sm border border-surface-container/60">
          <div className="flex flex-col">
            <span className="font-heading text-[10px] sm:text-xs uppercase tracking-wider text-on-surface-variant font-bold">
              Unpaid / Balance Due
            </span>
            <span className="font-heading text-lg sm:text-2xl text-error font-bold mt-1">
              $380.00
            </span>
            <span className="font-heading text-[11px] text-on-surface-variant mt-0.5">
              3 sessions awaiting cash
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center text-error shrink-0">
            <span className="material-symbols-outlined text-xl">pending_actions</span>
          </div>
        </div>
      </div>

      {/* Primary View Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-space-md">
        <div className="inline-flex p-1 bg-surface-container rounded-xl shadow-xs self-start">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`inline-flex items-center gap-space-xs px-4 sm:px-5 py-2 rounded-lg font-heading text-xs sm:text-sm font-bold transition-all ${
              activeTab === "calendar"
                ? "bg-surface-container-lowest text-primary shadow-xs"
                : "text-on-surface-variant hover:text-primary"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-lg">calendar_view_day</span>
            <span>Availability &amp; Calendar</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-[10px] font-bold">
              18 Booked
            </span>
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`inline-flex items-center gap-space-xs px-4 sm:px-5 py-2 rounded-lg font-heading text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "ledger"
                ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                : "text-on-surface-variant hover:text-primary"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-lg">table_rows</span>
            <span>Bookings List</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-semibold">
              {bookings.length} Total
            </span>
          </button>
        </div>

        {/* Quick Legend */}
        <div className="hidden lg:flex items-center gap-space-md bg-surface-container-low px-4 py-2 rounded-xl text-xs font-heading">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
            <span className="text-on-surface font-semibold">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-on-surface font-semibold">Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container" />
            <span className="text-on-surface font-semibold">Maintenance</span>
          </div>
        </div>
      </div>

      {/* TAB VIEW 1: Interactive Matrix Calendar & Grid */}
      {activeTab === "calendar" ? (
        <div className="flex flex-col gap-space-md">
          {/* Filter & Date Navigator Toolbar */}
          <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-space-md border border-surface-container/60">
            {/* Turf Selectors Filter Pills */}
            <div className="flex items-center gap-space-xs overflow-x-auto pb-1 xl:pb-0 no-scrollbar">
              <button
                onClick={() => setSelectedTurfFilter("all")}
                className={`px-3.5 py-1.5 rounded-full font-heading text-xs whitespace-nowrap transition-colors ${
                  selectedTurfFilter === "all"
                    ? "bg-primary text-on-primary shadow-xs font-bold"
                    : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                }`}
                type="button"
              >
                All Turfs (4)
              </button>
              {turfs.slice(0, 4).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTurfFilter(t.id)}
                  className={`px-3.5 py-1.5 rounded-full font-heading text-xs whitespace-nowrap transition-colors ${
                    selectedTurfFilter === t.id
                      ? "bg-primary text-on-primary shadow-xs font-bold"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                  type="button"
                >
                  {t.name}
                </button>
              ))}
            </div>

            {/* Center Date Control */}
            <div className="flex items-center justify-center gap-space-xs bg-surface-container-low px-2 py-1 rounded-xl self-center xl:self-auto border border-surface-container/60">
              <button
                onClick={() => alert("Viewing previous day")}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                title="Previous Day"
                type="button"
              >
                <span className="material-symbols-outlined text-lg leading-none">chevron_left</span>
              </button>
              <div className="flex items-center gap-space-xs px-2 font-heading text-xs sm:text-sm text-primary font-bold">
                <span className="material-symbols-outlined text-secondary text-base">calendar_today</span>
                <span>Today, Oct 24, 2024</span>
              </div>
              <button
                onClick={() => alert("Viewing next day")}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                title="Next Day"
                type="button"
              >
                <span className="material-symbols-outlined text-lg leading-none">chevron_right</span>
              </button>
              <button
                onClick={() => setCurrentDate("2026-10-24")}
                className="ml-1 text-[11px] font-heading uppercase font-semibold text-secondary hover:underline px-2 py-1"
                type="button"
              >
                Today
              </button>
            </div>

            {/* View Matrix density */}
            <div className="flex items-center justify-end gap-space-sm">
              <span className="px-3 py-1 rounded-lg bg-surface-container-high text-primary font-heading text-xs font-bold">
                Day Matrix View
              </span>
            </div>
          </div>

          {/* Time-Slot Grid Matrix (06:00 to 24:00) */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden overflow-x-auto border border-surface-container/60">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="bg-surface-container text-on-surface">
                  <th className="w-28 py-3.5 px-4 font-heading text-xs uppercase tracking-wider font-bold">
                    Time Slot
                  </th>
                  <th className="py-3.5 px-4 font-heading text-xs uppercase tracking-wider font-bold">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-secondary" />
                        Pitch 1 (Wembley 7s)
                      </span>
                      <span className="text-on-surface-variant font-normal lowercase text-[10px]">
                        fifa pro 50mm
                      </span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-heading text-xs uppercase tracking-wider font-bold">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-secondary" />
                        Pitch 2 (Camp Nou 11s)
                      </span>
                      <span className="text-on-surface-variant font-normal lowercase text-[10px]">
                        hybrid turf 4g
                      </span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-heading text-xs uppercase tracking-wider font-bold">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-secondary" />
                        Pitch 3 (San Siro 5s)
                      </span>
                      <span className="text-on-surface-variant font-normal lowercase text-[10px]">
                        indoor cage 35mm
                      </span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-heading text-xs uppercase tracking-wider font-bold">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-secondary" />
                        Pitch 4 (Allianz 5s)
                      </span>
                      <span className="text-on-surface-variant font-normal lowercase text-[10px]">
                        multi-tech 40mm
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low font-body text-xs sm:text-sm">
                {slots.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-container-low/30 transition-colors">
                    {/* Time Label */}
                    <td className="py-3 px-4 font-heading text-xs font-semibold text-on-surface-variant align-top pt-4">
                      {row.time}
                    </td>

                    {/* Column 1: Pitch 1 */}
                    <td className="p-2 align-top">
                      {row.pitch1.type === "blocked" ? (
                        <div className="bg-amber-100 text-amber-900 rounded-xl p-3 flex flex-col justify-between shadow-xs border border-amber-200">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 font-heading text-[10px] font-bold uppercase tracking-wider text-amber-800">
                              <span className="material-symbols-outlined text-[14px]">water_drop</span>
                              Maintenance
                            </span>
                            <button
                              onClick={() => handleUnlockSlot(row.time, "Pitch 1")}
                              className="text-amber-700 hover:text-amber-950 font-heading text-[11px] font-semibold hover:underline"
                              type="button"
                            >
                              Unlock
                            </button>
                          </div>
                          <p className="font-heading text-xs font-semibold mt-1">
                            {row.pitch1.title}
                          </p>
                          <span className="font-heading text-[10px] text-amber-700 mt-1">
                            {row.pitch1.subtitle}
                          </span>
                        </div>
                      ) : row.pitch1.type === "booked" ? (
                        <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-xs border border-secondary/20">
                          <div className="flex items-center justify-between">
                            <span className="font-heading text-xs font-bold text-primary truncate max-w-[130px]">
                              {row.pitch1.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-[10px] font-bold">
                              {row.pitch1.amount}
                            </span>
                          </div>
                          <span className="text-on-surface-variant text-[11px] mt-1">
                            {row.pitch1.customer}
                          </span>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-container-high/60">
                            <span className="text-[10px] text-secondary font-bold">
                              #{row.pitch1.bookingId}
                            </span>
                            <button
                              onClick={() => {
                                const b = bookings.find(item => item.id === row.pitch1.bookingId) || {
                                  id: row.pitch1.bookingId,
                                  customerName: row.pitch1.customer,
                                  turfName: "Pitch 1 (Wembley)",
                                  timeSlot: row.time,
                                  amount: 140,
                                  status: "Confirmed",
                                  paymentStatus: "Paid"
                                };
                                setSelectedBookingDetails(b);
                              }}
                              className="text-primary hover:text-secondary font-heading text-[11px] font-bold"
                              type="button"
                            >
                              Details →
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => prefillQuickReserve("Wembley", row.time)}
                          className="group cursor-pointer bg-surface-container-lowest hover:bg-surface-container-low rounded-xl p-3 flex flex-col justify-between transition-all min-h-[92px] border border-surface-container/60 hover:border-secondary/30"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-secondary font-heading text-xs font-semibold">Available</span>
                            <span className="font-heading text-[11px] text-on-surface-variant">{row.pitch1.price}</span>
                          </div>
                          <div className="flex items-center justify-center py-2 opacity-40 group-hover:opacity-100 transition-opacity">
                            <span className="inline-flex items-center gap-1 font-heading text-xs font-bold text-primary">
                              <span className="material-symbols-outlined text-[15px]">add</span> Quick Reserve
                            </span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Column 2: Pitch 2 */}
                    <td className="p-2 align-top">
                      {row.pitch2.type === "booked" ? (
                        <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-xs border border-secondary/20">
                          <div className="flex items-center justify-between">
                            <span className="font-heading text-xs font-bold text-primary truncate max-w-[130px]">
                              {row.pitch2.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-[10px] font-bold">
                              {row.pitch2.amount}
                            </span>
                          </div>
                          <span className="text-on-surface-variant text-[11px] mt-1">
                            {row.pitch2.customer}
                          </span>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-container-high/60">
                            <span className="text-[10px] text-secondary font-bold">
                              #{row.pitch2.bookingId}
                            </span>
                            <button
                              onClick={() => {
                                const b = bookings.find(item => item.id === row.pitch2.bookingId) || {
                                  id: row.pitch2.bookingId,
                                  customerName: row.pitch2.customer,
                                  turfName: "Pitch 2 (Camp Nou)",
                                  timeSlot: row.time,
                                  amount: 210,
                                  status: "Confirmed",
                                  paymentStatus: "Paid"
                                };
                                setSelectedBookingDetails(b);
                              }}
                              className="text-primary hover:text-secondary font-heading text-[11px] font-bold"
                              type="button"
                            >
                              Details →
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => prefillQuickReserve("Camp Nou", row.time)}
                          className="group cursor-pointer bg-surface-container-lowest hover:bg-surface-container-low rounded-xl p-3 flex flex-col justify-between transition-all min-h-[92px] border border-surface-container/60 hover:border-secondary/30"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-secondary font-heading text-xs font-semibold">Available</span>
                            <span className="font-heading text-[11px] text-on-surface-variant">{row.pitch2.price}</span>
                          </div>
                          <div className="flex items-center justify-center py-2 opacity-40 group-hover:opacity-100 transition-opacity">
                            <span className="inline-flex items-center gap-1 font-heading text-xs font-bold text-primary">
                              <span className="material-symbols-outlined text-[15px]">add</span> Quick Reserve
                            </span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Column 3: Pitch 3 */}
                    <td className="p-2 align-top">
                      {row.pitch3.type === "booked" ? (
                        <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-xs border border-secondary/20">
                          <div className="flex items-center justify-between">
                            <span className="font-heading text-xs font-bold text-primary truncate max-w-[130px]">
                              {row.pitch3.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary text-[10px] font-bold">
                              {row.pitch3.amount}
                            </span>
                          </div>
                          <span className="text-on-surface-variant text-[11px] mt-1">
                            {row.pitch3.customer}
                          </span>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-container-high/60">
                            <span className="text-[10px] text-secondary font-bold">
                              #{row.pitch3.bookingId}
                            </span>
                            <button
                              onClick={() => {
                                const b = bookings.find(item => item.id === row.pitch3.bookingId) || {
                                  id: row.pitch3.bookingId,
                                  customerName: row.pitch3.customer,
                                  turfName: "Pitch 3 (San Siro)",
                                  timeSlot: row.time,
                                  amount: 160,
                                  status: "Confirmed",
                                  paymentStatus: "Partial"
                                };
                                setSelectedBookingDetails(b);
                              }}
                              className="text-primary hover:text-secondary font-heading text-[11px] font-bold"
                              type="button"
                            >
                              Details →
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => prefillQuickReserve("San Siro", row.time)}
                          className="group cursor-pointer bg-surface-container-lowest hover:bg-surface-container-low rounded-xl p-3 flex flex-col justify-between transition-all min-h-[92px] border border-surface-container/60 hover:border-secondary/30"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-secondary font-heading text-xs font-semibold">Available</span>
                            <span className="font-heading text-[11px] text-on-surface-variant">{row.pitch3.price}</span>
                          </div>
                          <div className="flex items-center justify-center py-2 opacity-40 group-hover:opacity-100 transition-opacity">
                            <span className="inline-flex items-center gap-1 font-heading text-xs font-bold text-primary">
                              <span className="material-symbols-outlined text-[15px]">add</span> Quick Reserve
                            </span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Column 4: Pitch 4 */}
                    <td className="p-2 align-top">
                      {row.pitch4.type === "booked" ? (
                        <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-xs border border-secondary/20">
                          <div className="flex items-center justify-between">
                            <span className="font-heading text-xs font-bold text-primary truncate max-w-[130px]">
                              {row.pitch4.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-[10px] font-bold">
                              {row.pitch4.amount}
                            </span>
                          </div>
                          <span className="text-on-surface-variant text-[11px] mt-1">
                            {row.pitch4.customer}
                          </span>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-container-high/60">
                            <span className="text-[10px] text-secondary font-bold">
                              #{row.pitch4.bookingId}
                            </span>
                            <button
                              onClick={() => {
                                const b = bookings.find(item => item.id === row.pitch4.bookingId) || {
                                  id: row.pitch4.bookingId,
                                  customerName: row.pitch4.customer,
                                  turfName: "Pitch 4 (Allianz)",
                                  timeSlot: row.time,
                                  amount: 100,
                                  status: "Confirmed",
                                  paymentStatus: "Paid"
                                };
                                setSelectedBookingDetails(b);
                              }}
                              className="text-primary hover:text-secondary font-heading text-[11px] font-bold"
                              type="button"
                            >
                              Details →
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => prefillQuickReserve("Allianz", row.time)}
                          className="group cursor-pointer bg-surface-container-lowest hover:bg-surface-container-low rounded-xl p-3 flex flex-col justify-between transition-all min-h-[92px] border border-surface-container/60 hover:border-secondary/30"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-secondary font-heading text-xs font-semibold">Available</span>
                            <span className="font-heading text-[11px] text-on-surface-variant">{row.pitch4.price}</span>
                          </div>
                          <div className="flex items-center justify-center py-2 opacity-40 group-hover:opacity-100 transition-opacity">
                            <span className="inline-flex items-center gap-1 font-heading text-xs font-bold text-primary">
                              <span className="material-symbols-outlined text-[15px]">add</span> Quick Reserve
                            </span>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB VIEW 2: Bookings Ledger List */
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-surface-container/60">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant font-heading text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Booking ID</th>
                  <th className="py-3 px-4 font-semibold">Customer / Contact</th>
                  <th className="py-3 px-4 font-semibold">Pitch Name</th>
                  <th className="py-3 px-4 font-semibold">Date &amp; Slot</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Payment</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/40 text-on-surface font-body text-xs sm:text-sm">
                {filteredBookingsList.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-container/40 transition-colors">
                    <td className="py-3.5 px-4 font-heading font-bold text-primary">
                      #{b.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-heading text-xs font-bold">
                          {b.customerInitials || "SK"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface">{b.customerName}</span>
                          <span className="text-[11px] text-on-surface-variant">{b.customerPhone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{b.turfName}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span>{b.displayDate || b.date}</span>
                        <span className="text-[11px] text-secondary font-semibold">{b.timeSlot}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-on-surface-variant">{b.bookingType}</td>
                    <td className="py-3.5 px-4 font-heading font-bold text-on-surface">
                      ${b.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.paymentStatus} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBookingDetails(b)}
                          className="px-2.5 py-1 rounded-lg bg-surface-container text-primary font-heading text-xs font-semibold hover:bg-surface-container-high transition-colors"
                          type="button"
                        >
                          View
                        </button>
                        {b.status !== "Cancelled" && (
                          <button
                            onClick={() => setCancelTargetBooking(b)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container transition-colors"
                            title="Cancel Booking"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-base">cancel</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Booking Modal with Overlapping Slot Conflict Warning */}
      <Modal
        isOpen={isManualBookingOpen}
        onClose={() => setIsManualBookingOpen(false)}
        title="Add Manual Turf Booking"
        subtitle="Schedule customer booking with automatic slot conflict verification."
        badge="Direct Reservation"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4">
          {/* Overlapping Conflict Warning Banner */}
          {conflictInfo.hasConflict && (
            <div className="rounded-xl bg-error-container p-3 text-on-error-container flex items-start gap-2.5 border border-error/20 animate-in fade-in">
              <span className="material-symbols-outlined text-error text-xl shrink-0 mt-0.5">
                warning
              </span>
              <div className="flex-1">
                <h4 className="font-heading text-xs font-bold text-on-error-container">
                  Schedule Conflict Detected!
                </h4>
                <p className="font-body text-xs text-on-error-container leading-tight mt-0.5">
                  {conflictInfo.message} Please pick another time slot or pitch.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={bookingForm.customerName}
                onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                placeholder="e.g. Liam Henderson"
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              />
            </div>
            <div>
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="text"
                value={bookingForm.customerPhone}
                onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                placeholder="+1 (555) 234-8901"
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
                Pitch Facility
              </label>
              <select
                value={bookingForm.turfId}
                onChange={(e) => setBookingForm({ ...bookingForm, turfId: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              >
                {turfs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (${t.hourlyPrice}/hr)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
                Time Slot
              </label>
              <select
                value={bookingForm.timeSlot}
                onChange={(e) => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              >
                <option value="06:00 - 08:00">06:00 - 08:00 (Early Morning)</option>
                <option value="08:00 - 10:00">08:00 - 10:00</option>
                <option value="10:00 - 12:00">10:00 - 12:00</option>
                <option value="12:00 - 14:00">12:00 - 14:00</option>
                <option value="14:00 - 16:00">14:00 - 16:00</option>
                <option value="16:00 - 18:00">16:00 - 18:00</option>
                <option value="18:00 - 20:00">18:00 - 20:00 (Prime Evening)</option>
                <option value="20:00 - 22:00">20:00 - 22:00 (Late Night)</option>
                <option value="22:00 - 24:00">22:00 - 24:00</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
                Booking Category
              </label>
              <select
                value={bookingForm.bookingType}
                onChange={(e) => setBookingForm({ ...bookingForm, bookingType: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              >
                <option value="Casual Match">Casual Match</option>
                <option value="League Match">Night League Match</option>
                <option value="Academy Drill">Academy Drill / Coaching</option>
                <option value="Corporate Event">Corporate Event</option>
              </select>
            </div>
            <div>
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
                Payment Collection
              </label>
              <select
                value={bookingForm.paymentMethod}
                onChange={(e) => setBookingForm({ ...bookingForm, paymentMethod: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              >
                <option value="Cash at Desk">Cash at Desk</option>
                <option value="UPI (PhonePe / GPay)">UPI (PhonePe / GPay)</option>
                <option value="Card Terminal (Stripe)">Card Terminal (Stripe)</option>
                <option value="Bank Wire">Bank Wire</option>
              </select>
            </div>
          </div>

          {/* Price Calculation Box */}
          <div className="p-3.5 rounded-xl bg-surface-container flex items-center justify-between">
            <div>
              <span className="font-heading text-xs text-on-surface-variant font-medium">
                Total Session Price:
              </span>
              <div className="font-heading text-xl font-bold text-primary">
                ${(turfs.find(t => t.id === bookingForm.turfId)?.hourlyPrice || 75) * 2}.00
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-heading text-xs font-bold">
              2 Hours Duration
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container/60">
            <button
              type="button"
              onClick={() => setIsManualBookingOpen(false)}
              className="px-5 py-2.5 rounded-full text-on-surface-variant hover:text-on-surface font-heading text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={conflictInfo.hasConflict}
              className={`px-6 py-2.5 rounded-full font-heading text-xs font-bold shadow-md transition-all ${
                conflictInfo.hasConflict
                  ? "bg-outline text-surface-container cursor-not-allowed opacity-50"
                  : "bg-gradient-to-r from-primary to-secondary text-on-primary hover:opacity-95"
              }`}
            >
              Confirm Reservation
            </button>
          </div>
        </form>
      </Modal>

      {/* Block Slot Modal */}
      <Modal
        isOpen={isMaintenanceOpen}
        onClose={() => setIsMaintenanceOpen(false)}
        title="Block Pitch for Maintenance"
        subtitle="Lock slots from customer reservations for grass aeration, sprinklers, or private club reserve."
        badge="Grounds Crew"
      >
        <form onSubmit={handleBlockSlot} className="space-y-4">
          <div>
            <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
              Select Pitch
            </label>
            <select
              value={blockForm.turfId}
              onChange={(e) => setBlockForm({ ...blockForm, turfId: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
            >
              {turfs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
                Time Window
              </label>
              <select
                value={blockForm.timeSlot}
                onChange={(e) => setBlockForm({ ...blockForm, timeSlot: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              >
                <option value="06:00 - 08:00">06:00 - 08:00</option>
                <option value="10:00 - 12:00">10:00 - 12:00</option>
                <option value="12:00 - 14:00">12:00 - 14:00</option>
                <option value="14:00 - 16:00">14:00 - 16:00</option>
              </select>
            </div>
            <div>
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
                Reason / Action
              </label>
              <select
                value={blockForm.reason}
                onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              >
                <option value="Routine Sprinklers & Infill">Routine Sprinklers &amp; Infill</option>
                <option value="Decompaction & Leveling">Decompaction &amp; Leveling</option>
                <option value="Lighting Repair">Lighting &amp; Sensors Maintenance</option>
                <option value="Private Club / Owner Session">Private Club / Owner Session</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
              Internal Crew Notes
            </label>
            <input
              type="text"
              value={blockForm.notes}
              onChange={(e) => setBlockForm({ ...blockForm, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container/60">
            <button
              type="button"
              onClick={() => setIsMaintenanceOpen(false)}
              className="px-5 py-2.5 rounded-full text-on-surface-variant hover:text-on-surface font-heading text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-tertiary-container text-on-tertiary font-heading text-xs font-bold shadow-sm hover:opacity-95"
            >
              Lock Slot
            </button>
          </div>
        </form>
      </Modal>

      {/* Booking Details Modal */}
      <Modal
        isOpen={Boolean(selectedBookingDetails)}
        onClose={() => setSelectedBookingDetails(null)}
        title={`Booking #${selectedBookingDetails?.id}`}
        subtitle="Manage customer session, payment reconciliation, or cancel booking."
        badge="Session Information"
      >
        {selectedBookingDetails && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-surface-container">
              <div>
                <span className="font-heading text-xs text-on-surface-variant uppercase">Customer</span>
                <div className="font-heading text-sm font-bold text-on-surface mt-0.5">
                  {selectedBookingDetails.customerName}
                </div>
                <div className="text-xs text-on-surface-variant">
                  {selectedBookingDetails.customerPhone || "No phone registered"}
                </div>
              </div>
              <div>
                <span className="font-heading text-xs text-on-surface-variant uppercase">Pitch Facility</span>
                <div className="font-heading text-sm font-bold text-primary mt-0.5">
                  {selectedBookingDetails.turfName}
                </div>
                <div className="text-xs text-secondary font-semibold">
                  {selectedBookingDetails.timeSlot}
                </div>
              </div>
              <div>
                <span className="font-heading text-xs text-on-surface-variant uppercase">Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedBookingDetails.status} />
                </div>
              </div>
              <div>
                <span className="font-heading text-xs text-on-surface-variant uppercase">Total Amount</span>
                <div className="font-heading text-lg font-bold text-on-surface mt-0.5">
                  ${selectedBookingDetails.amount?.toFixed(2)}
                </div>
                <div className="text-xs text-secondary font-semibold">
                  {selectedBookingDetails.paymentStatus || "Paid"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-surface-container/60">
              {selectedBookingDetails.status !== "Cancelled" ? (
                <button
                  type="button"
                  onClick={() => {
                    setCancelTargetBooking(selectedBookingDetails);
                  }}
                  className="px-4 py-2 rounded-full bg-error-container text-on-error-container font-heading text-xs font-bold hover:opacity-90"
                >
                  Cancel Booking
                </button>
              ) : (
                <span className="text-xs text-error font-semibold">Booking is Cancelled</span>
              )}

              <button
                type="button"
                onClick={() => setSelectedBookingDetails(null)}
                className="px-6 py-2 rounded-full bg-surface-container-high text-on-surface font-heading text-xs font-semibold hover:bg-surface-container-highest"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancelTargetBooking)}
        onClose={() => setCancelTargetBooking(null)}
        onConfirm={() => {
          if (cancelTargetBooking) {
            handleCancelBooking(cancelTargetBooking.id);
          }
        }}
        title="Cancel This Booking?"
        message={`Are you sure you want to cancel booking #${cancelTargetBooking?.id} for ${cancelTargetBooking?.customerName}? The reserved slot will be reopened immediately.`}
        confirmText="Confirm Cancellation"
        confirmVariant="danger"
      />
    </div>
  );
}
