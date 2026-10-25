import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { StatCard } from "../components/common/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { Modal } from "../components/common/Modal";
import {
  getStoredTurfs,
  getStoredBookings,
  saveStoredBookings,
  INITIAL_SLOTS
} from "../data/mockData";
import { reportAPI, bookingAPI, turfAPI, slotAPI } from "../services/api";
import { formatINR } from "../utils/formatters";

export function DashboardPage() {
  const navigate = useNavigate();
  const context = useOutletContext() || {};
  const globalSearch = context.globalSearch || "";

  const [turfs, setTurfs] = useState(getStoredTurfs());
  const [bookings, setBookings] = useState(getStoredBookings());
  const [tableFilter, setTableFilter] = useState("All");
  const [pitchFilter, setPitchFilter] = useState("All");
  const [period, setPeriod] = useState("Monthly");
  const [dashboardStats, setDashboardStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modals for Quick Actions
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isQuickBlockOpen, setIsQuickBlockOpen] = useState(false);

  // Fetch Dashboard Stats and Data from Backend
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const statsRes = await reportAPI.getDashboardStats();
      if (statsRes?.success && statsRes.data) {
        setDashboardStats(statsRes.data);
        if (statsRes.data.recentBookings?.length > 0) {
          setBookings(statsRes.data.recentBookings);
        }
      }

      const turfsRes = await turfAPI.getAll({ status: "active" });
      if (turfsRes?.success && turfsRes.data?.length > 0) {
        setTurfs(turfsRes.data);
      }
    } catch (err) {
      console.warn("[Dashboard] Backend sync error, falling back to local mock data:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const today = new Date().toISOString().split("T")[0];

  // Quick Manual Booking Form State
  const [newBookingData, setNewBookingData] = useState({
    customerName: "",
    customerPhone: "",
    turfId: turfs[0]?.id || turfs[0]?._id || "pitch-1",
    date: today,
    timeSlot: "18:00 - 20:00",
    bookingType: "Casual Match",
    paymentMethod: "Cash at Desk",
    paymentStatus: "Paid",
  });

  // Quick Slot Block Form State
  const [blockData, setBlockData] = useState({
    turfId: turfs[0]?.id || turfs[0]?._id || "pitch-1",
    date: today,
    timeSlot: "10:00 - 12:00",
    reason: "Sprinklers & Edge Trim",
    notes: "Grounds crew routine maintenance"
  });

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    const selectedTurf = turfs.find((t) => t.id === newBookingData.turfId || t._id === newBookingData.turfId) || turfs[0];

    try {
      const res = await bookingAPI.create({
        ...newBookingData,
        turfId: selectedTurf.id || selectedTurf._id,
      });

      if (res?.data) {
        setIsNewBookingOpen(false);
        fetchDashboardData();
        return;
      }
    } catch (err) {
      alert(`Booking Failed: ${err.message}`);
      return;
    }

    // Local fallback
    const duration = 2;
    const amount = selectedTurf.hourlyPrice * duration;

    const newBooking = {
      id: `TE-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: newBookingData.customerName || "Walk-in Guest",
      customerPhone: newBookingData.customerPhone || "+1 (555) 000-0000",
      customerInitials: (newBookingData.customerName || "WG")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
      turfId: selectedTurf.id || selectedTurf._id,
      turfName: selectedTurf.name,
      turfType: selectedTurf.surfaceGrade,
      date: newBookingData.date,
      displayDate: "Today",
      timeSlot: newBookingData.timeSlot,
      startTime: newBookingData.timeSlot.split(" - ")[0],
      endTime: newBookingData.timeSlot.split(" - ")[1],
      durationHours: duration,
      bookingType: newBookingData.bookingType,
      amount: amount,
      paidAmount: newBookingData.paymentStatus === "Paid" ? amount : 0,
      status: "Confirmed",
      paymentStatus: newBookingData.paymentStatus,
      paymentMethod: newBookingData.paymentMethod,
      isFloodlightOn: true,
    };

    const updated = [newBooking, ...bookings];
    setBookings(updated);
    saveStoredBookings(updated);
    setIsNewBookingOpen(false);
  };

  const handleBlockSlot = async (e) => {
    e.preventDefault();
    try {
      await slotAPI.block(blockData);
      fetchDashboardData();
    } catch (err) {
      console.warn("Backend block error:", err.message);
    }
    alert(`Slot blocked successfully on ${turfs.find(t => t.id === blockData.turfId || t._id === blockData.turfId)?.name || 'Pitch'} for ${blockData.reason}`);
    setIsQuickBlockOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ["Booking ID", "Customer", "Phone", "Turf", "Date", "Slot", "Amount", "Status", "Payment"];
    const rows = bookings.map(b => [
      b.id,
      b.customerName,
      b.customerPhone,
      b.turfName,
      b.date,
      b.timeSlot,
      b.amount,
      b.status,
      b.paymentStatus
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `turfease_bookings_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter bookings for table
  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = tableFilter === "All" || b.status.toLowerCase() === tableFilter.toLowerCase();
    const matchesSearch =
      !globalSearch ||
      b.customerName.toLowerCase().includes(globalSearch.toLowerCase()) ||
      b.id.toLowerCase().includes(globalSearch.toLowerCase()) ||
      b.turfName.toLowerCase().includes(globalSearch.toLowerCase()) ||
      b.customerPhone.includes(globalSearch);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full gap-space-lg lg:gap-space-xl">
      {/* Top Header & Executive Action Bar */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-xs">
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-tertiary-fixed" />
            <span className="font-heading text-xs text-secondary uppercase tracking-widest font-bold">
              Turf Facility Operations
            </span>
          </div>
          <h1 className="font-heading text-2xl lg:text-3xl text-on-surface font-bold tracking-tight">
            Welcome back, Vansh! 👋
          </h1>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant">
            Here’s an overview of your turf business, field telemetries, and bookings today.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            onClick={() => setIsQuickBlockOpen(true)}
            className="flex items-center gap-space-xs px-space-md py-2.5 rounded-full bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all shadow-sm font-heading text-xs sm:text-sm font-semibold"
            type="button"
          >
            <span className="material-symbols-outlined text-lg text-secondary">
              block
            </span>
            <span>Quick Slot Block</span>
          </button>
          <button
            onClick={() => setIsNewBookingOpen(true)}
            className="flex items-center gap-space-xs px-space-lg py-2.5 rounded-full bg-gradient-to-r from-primary-container via-secondary to-primary text-on-primary hover:opacity-95 transition-all shadow-md hover:shadow-lg font-heading text-xs sm:text-sm font-semibold tracking-wide"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">
              add_circle
            </span>
            <span>+ New Manual Booking</span>
          </button>
        </div>
      </section>

      {/* KPI Summary Metrics (4 Grid Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        <StatCard
          title="Pitch Inventory"
          value={`${dashboardStats?.activeTurfs ?? turfs.length} Pitches`}
          subtitle="Full facility grounds active & operational"
          icon="stadium"
          badgeText="Active Pitches"
          badgeIcon="check_circle"
          badgeVariant="positive"
        />
        <StatCard
          title="Today’s Bookings"
          value={`${dashboardStats?.todayBookingsCount ?? 18} Slots`}
          subtitle="Live daily reservation count"
          icon="event_available"
          badgeText="Scheduled"
          badgeIcon="trending_up"
          badgeVariant="positive"
        />
        <StatCard
          title="Monthly Gross"
          value={formatINR(dashboardStats?.monthlyRevenue ?? 214500)}
          subtitle="Net revenue collected this cycle"
          icon="account_balance_wallet"
          progress={dashboardStats ? 92 : 88.75}
          badgeText="Settled Funds"
          badgeIcon="north_east"
          badgeVariant="positive"
        />
        <StatCard
          title="Slots Remaining"
          value={`${dashboardStats?.slotsRemainingToday ?? 6} Remaining`}
          subtitle="Unbooked 2-hour capacity slots today"
          icon="timelapse"
          badgeText="Available"
          badgeIcon="stars"
          badgeVariant="neutral"
        />
      </section>

      {/* Middle Section: Financial Chart (7 cols) & Schedule Matrix (5 cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Column 1: Revenue Trends SVG Area Chart */}
        <div className="lg:col-span-7 bg-surface-container-low rounded-2xl p- space-md sm:p-space-lg shadow-sm flex flex-col justify-between border border-surface-container/60">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
              <div className="flex flex-col">
                <span className="font-heading text-xs text-secondary uppercase font-semibold tracking-wider">
                  Financial Telemetry
                </span>
                <h2 className="font-heading text-xl text-on-surface font-bold tracking-tight">
                  Revenue &amp; Booking Trends
                </h2>
              </div>

              {/* Period Selector Pills */}
              <div className="flex items-center bg-surface-container p-1 rounded-xl self-start sm:self-auto">
                {["Weekly", "Monthly", "Quarterly", "Yearly"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 rounded-lg font-heading text-xs transition-colors ${
                      period === p
                        ? "bg-primary-container text-on-primary font-semibold shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                    type="button"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-baseline gap-space-xs mb-space-md">
              <span className="font-heading text-3xl sm:text-4xl font-bold text-primary-container leading-none">
                {formatINR(dashboardStats?.monthlyRevenue ?? 214500)}
              </span>
              <span className="font-body text-xs text-on-surface-variant">
                gross earned this month across all 6 turfs
              </span>
            </div>

            {/* Interactive SVG Area Chart */}
            <div className="relative w-full h-64 my-2">
              <svg
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 650 200"
              >
                <defs>
                  <linearGradient id="dashboardTurfGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#1d6b4f" stopOpacity="0.35" />
                    <stop offset="70%" stopColor="#bef28d" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#e7fff2" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Horizontal Grid lines */}
                <line x1="0" x2="650" y1="40" y2="40" stroke="#bfc9c3" strokeDasharray="4 4" strokeOpacity="0.4" strokeWidth="1" />
                <line x1="0" x2="650" y1="90" y2="90" stroke="#bfc9c3" strokeDasharray="4 4" strokeOpacity="0.4" strokeWidth="1" />
                <line x1="0" x2="650" y1="140" y2="140" stroke="#bfc9c3" strokeDasharray="4 4" strokeOpacity="0.4" strokeWidth="1" />
                <line x1="0" x2="650" y1="190" y2="190" stroke="#bfc9c3" strokeOpacity="0.7" strokeWidth="1" />

                {/* Area Fill */}
                <path
                  d="M 0,165 C 60,150 90,130 140,110 C 190,90 230,120 280,95 C 330,70 380,85 430,45 C 490,10 540,65 600,30 L 650,25 L 650,190 L 0,190 Z"
                  fill="url(#dashboardTurfGrad)"
                />
                {/* Curve Stroke */}
                <path
                  d="M 0,165 C 60,150 90,130 140,110 C 190,90 230,120 280,95 C 330,70 380,85 430,45 C 490,10 540,65 600,30 L 650,25"
                  fill="none"
                  stroke="#1d6b4f"
                  strokeLinecap="round"
                  strokeWidth="3"
                />

                {/* Data Points */}
                <circle cx="140" cy="110" r="4.5" fill="#003527" stroke="#bef28d" strokeWidth="2.5" />
                <circle cx="280" cy="95" r="4.5" fill="#003527" stroke="#bef28d" strokeWidth="2.5" />
                <circle cx="430" cy="45" r="6" fill="#064e3b" stroke="#bef28d" strokeWidth="3" className="animate-pulse" />
                <circle cx="600" cy="30" r="4.5" fill="#003527" stroke="#bef28d" strokeWidth="2.5" />
              </svg>

              {/* Floating Tooltip Indicator */}
              <div className="absolute left-[62%] top-2 -translate-x-1/2 bg-primary-container text-on-primary px-3 py-1.5 rounded-xl shadow-lg pointer-events-none flex flex-col items-center border border-tertiary-fixed/30">
                <span className="font-heading text-[11px] text-tertiary-fixed font-bold leading-none">
                  Oct 18 • Peak Slot
                </span>
                <span className="font-body text-xs font-semibold mt-0.5">
                  ₹14,500 • 12 bookings
                </span>
                <div className="w-2 h-2 bg-primary-container rotate-45 -mb-1 mt-1" />
              </div>
            </div>

            {/* X-Axis Labels */}
            <div className="flex items-center justify-between text-on-surface-variant font-heading text-xs pt-2">
              <span>Week 1 (Oct 1-7)</span>
              <span>Week 2 (Oct 8-14)</span>
              <span>Week 3 (Oct 15-21)</span>
              <span>Week 4 (Oct 22-28)</span>
              <span>Forecast</span>
            </div>
          </div>

          {/* Mini Stat Breakdown Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm pt-space-md mt-space-md bg-surface-container/60 rounded-xl p-space-sm">
            <div className="flex flex-col px-space-xs">
              <span className="font-heading text-xs text-on-surface-variant font-medium">
                Avg. Booking Value
              </span>
              <span className="font-heading text-lg text-on-surface font-bold mt-0.5">
                ₹950<span className="text-xs font-normal text-on-surface-variant">/hr</span>
              </span>
              <span className="font-heading text-xs text-secondary font-semibold mt-0.5">
                +4.2% optimized
              </span>
            </div>
            <div className="flex flex-col px-space-xs">
              <span className="font-heading text-xs text-on-surface-variant font-medium">
                Peak High Day
              </span>
              <span className="font-heading text-lg text-on-surface font-bold mt-0.5">
                Saturday
              </span>
              <span className="font-heading text-xs text-primary font-semibold mt-0.5">
                ₹18,500 avg / day
              </span>
            </div>
            <div className="flex flex-col px-space-xs">
              <span className="font-heading text-xs text-on-surface-variant font-medium">
                Digital Collection
              </span>
              <span className="font-heading text-lg text-on-surface font-bold mt-0.5">
                92%
              </span>
              <span className="font-heading text-xs text-secondary font-semibold mt-0.5">
                UPI / Online
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Today's Schedule & Live Ground Matrix */}
        <div className="lg:col-span-5 bg-surface-container-low rounded-2xl p-space-md sm:p-space-lg shadow-sm flex flex-col justify-between border border-surface-container/60">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex flex-col">
                <span className="font-heading text-xs text-secondary uppercase font-semibold tracking-wider">
                  Live Ground Matrix
                </span>
                <h2 className="font-heading text-xl text-on-surface font-bold tracking-tight">
                  Today’s Schedule
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-heading text-xs font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                Live View
              </span>
            </div>

            {/* Pitch Filter Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 mb-space-md no-scrollbar">
              {["All", "Pitch 1 (Greenfield)", "Pitch 2 (KickOff)", "Pitch 3 (Champion)"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPitchFilter(p)}
                  className={`px-3 py-1.5 rounded-lg font-heading text-xs shrink-0 transition-colors ${
                    pitchFilter === p
                      ? "bg-primary-container text-on-primary font-semibold"
                      : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Time Slot List Schedule */}
            <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {/* Slot 1 */}
              <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between hover:bg-surface-container-high transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex flex-col items-center justify-center font-heading text-xs leading-none font-bold">
                    <span>08:00</span>
                    <span className="text-[9px] opacity-75">AM</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-heading text-sm text-on-surface font-semibold truncate">
                      Morning Academy Drill
                    </span>
                    <span className="font-body text-xs text-on-surface-variant">
                      Pitch 1 &amp; 2 • 08:00 - 10:00
                    </span>
                  </div>
                </div>
                <StatusBadge status="Booked" />
              </div>

              {/* Slot 2: Maintenance */}
              <div className="p-3 rounded-xl bg-surface-container/70 flex items-center justify-between hover:bg-surface-container-high transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-tertiary-container text-on-tertiary-container flex flex-col items-center justify-center font-heading text-xs leading-none font-bold">
                    <span>10:00</span>
                    <span className="text-[9px] opacity-75">AM</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-heading text-sm text-on-surface font-semibold truncate">
                      Maintenance &amp; Sprinklers
                    </span>
                    <span className="font-body text-xs text-on-surface-variant">
                      Pitch 1 • 10:00 - 12:00
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-tertiary font-heading text-xs font-semibold flex items-center gap-1 shrink-0">
                  <span className="material-symbols-outlined text-xs">tune</span>
                  Routine Care
                </span>
              </div>

              {/* Slot 3: Available */}
              <div className="p-3 rounded-xl bg-surface-container-lowest flex items-center justify-between shadow-xs hover:bg-surface-container-high transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high text-secondary flex flex-col items-center justify-center font-heading text-xs leading-none font-bold">
                    <span>14:00</span>
                    <span className="text-[9px] opacity-75">PM</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-heading text-sm text-on-surface font-semibold truncate">
                      Open Match Slot
                    </span>
                    <span className="font-body text-xs text-on-surface-variant">
                      Pitch 2 &amp; 3 • 14:00 - 16:00
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/bookings")}
                  className="px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-heading text-xs font-bold hover:bg-tertiary-fixed-dim transition-colors shrink-0"
                  type="button"
                >
                  Book Now
                </button>
              </div>

              {/* Slot 4 */}
              <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between hover:bg-surface-container-high transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex flex-col items-center justify-center font-heading text-xs leading-none font-bold">
                    <span>16:00</span>
                    <span className="text-[9px] opacity-75">PM</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-heading text-sm text-on-surface font-semibold truncate">
                      Red Devils FC Training
                    </span>
                    <span className="font-body text-xs text-on-surface-variant">
                      Pitch 1 • 16:00 - 18:00
                    </span>
                  </div>
                </div>
                <StatusBadge status="Booked" />
              </div>

              {/* Slot 5: Prime Tier */}
              <div className="p-3 rounded-xl bg-primary-container text-on-primary flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-primary-container flex flex-col items-center justify-center font-heading text-xs leading-none font-bold">
                    <span>18:00</span>
                    <span className="text-[9px] opacity-75">PM</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-heading text-sm font-bold truncate">
                        Corporate League
                      </span>
                      <span className="material-symbols-outlined text-xs text-tertiary-fixed" title="Floodlights Scheduled">
                        light_mode
                      </span>
                    </div>
                    <span className="font-body text-xs text-on-primary-container">
                      Pitch 1, 2, 3 • 18:00 - 20:00
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-heading text-xs font-bold shrink-0">
                  Prime Tier
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <button
            onClick={() => navigate("/bookings")}
            className="mt-space-md pt-space-xs flex items-center justify-between text-secondary hover:text-primary transition-colors group w-full text-left"
            type="button"
          >
            <span className="font-heading text-sm font-bold">
              View Full Facility Slot Matrix
            </span>
            <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>
      </section>

      {/* Bottom Section: Recent Bookings & Transactions Table */}
      <section className="bg-surface-container-low rounded-2xl p-space-md sm:p-space-lg shadow-sm flex flex-col gap-space-md border border-surface-container/60">
        {/* Table Controls Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex flex-col">
            <span className="font-heading text-xs text-secondary uppercase font-semibold tracking-wider">
              Live Ledger
            </span>
            <h2 className="font-heading text-xl text-on-surface font-bold tracking-tight">
              Recent Bookings &amp; Transactions
            </h2>
          </div>
          <div className="flex items-center gap-space-sm flex-wrap">
            {/* Status Filter Tabs */}
            <div className="flex items-center bg-surface-container p-1 rounded-xl">
              {["All", "Confirmed", "Pending", "Cancelled"].map((f) => (
                <button
                  key={f}
                  onClick={() => setTableFilter(f)}
                  className={`px-3 py-1 rounded-lg font-heading text-xs transition-colors ${
                    tableFilter === f
                      ? "bg-surface-container-lowest text-on-surface font-bold shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface font-medium"
                  }`}
                  type="button"
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-space-md py-2 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors font-heading text-xs font-semibold shadow-xs"
              type="button"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="w-full overflow-x-auto rounded-xl">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant font-heading text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold rounded-l-xl">Booking ID</th>
                <th className="py-3 px-4 font-semibold">Customer / Team</th>
                <th className="py-3 px-4 font-semibold">Pitch Name</th>
                <th className="py-3 px-4 font-semibold">Date &amp; Time</th>
                <th className="py-3 px-4 font-semibold">Duration / Type</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Payment</th>
                <th className="py-3 px-4 font-semibold text-right rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container/40 text-on-surface font-body text-xs sm:text-sm">
              {filteredBookings.slice(0, 6).map((booking) => (
                <tr
                  key={booking.id}
                  className="hover:bg-surface-container/50 transition-colors"
                >
                  <td className="py-3.5 px-4 font-heading font-bold text-primary-container">
                    #{booking.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-heading text-xs font-bold">
                        {booking.customerInitials || "SK"}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-on-surface truncate">
                          {booking.customerName}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          {booking.customerPhone}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-on-surface">
                        {booking.turfName}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        {booking.turfType}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-on-surface">
                        {booking.displayDate}
                      </span>
                      <span className="text-[11px] text-secondary font-semibold">
                        {booking.timeSlot}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium">{booking.durationHours} hrs</span>{" "}
                    • <span className="text-[11px] text-on-surface-variant">{booking.bookingType}</span>
                  </td>
                  <td className="py-3.5 px-4 font-heading font-bold text-on-surface">
                    {formatINR(booking.amount)}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={booking.paymentStatus} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => navigate("/bookings")}
                      className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                      type="button"
                      title="Manage Booking"
                    >
                      <span className="material-symbols-outlined text-base">
                        arrow_forward
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick Manual Booking Modal */}
      <Modal
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        title="Create Manual Slot Booking"
        subtitle="Book a pitch session immediately for offline, club, or phone customers."
        badge="Direct Reservation"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-heading text-xs font-semibold uppercase text-on-surface mb-1">
                Customer / Team Name
              </label>
              <input
                type="text"
                required
                value={newBookingData.customerName}
                onChange={(e) =>
                  setNewBookingData({ ...newBookingData, customerName: e.target.value })
                }
                placeholder="e.g. Liam Henderson"
                className="w-full bg-surface-container-low text-on-surface font-body text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              />
            </div>
            <div>
              <label className="block font-heading text-xs font-semibold uppercase text-on-surface mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="text"
                value={newBookingData.customerPhone}
                onChange={(e) =>
                  setNewBookingData({ ...newBookingData, customerPhone: e.target.value })
                }
                placeholder="+91 98XXX 12XXX"
                className="w-full bg-surface-container-low text-on-surface font-body text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-heading text-xs font-semibold uppercase text-on-surface mb-1">
                Select Turf Pitch
              </label>
              <select
                value={newBookingData.turfId}
                onChange={(e) =>
                  setNewBookingData({ ...newBookingData, turfId: e.target.value })
                }
                className="w-full bg-surface-container-low text-on-surface font-body text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              >
                {turfs.map((t) => (
                  <option key={t.id || t._id} value={t.id || t._id}>
                    {t.name} (₹{t.hourlyPrice}/hr)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-heading text-xs font-semibold uppercase text-on-surface mb-1">
                Time Window (2 Hours)
              </label>
              <select
                value={newBookingData.timeSlot}
                onChange={(e) =>
                  setNewBookingData({ ...newBookingData, timeSlot: e.target.value })
                }
                className="w-full bg-surface-container-low text-on-surface font-body text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              >
                <option value="06:00 - 08:00">06:00 - 08:00 (Early Morning)</option>
                <option value="08:00 - 10:00">08:00 - 10:00</option>
                <option value="14:00 - 16:00">14:00 - 16:00 (Afternoon)</option>
                <option value="16:00 - 18:00">16:00 - 18:00</option>
                <option value="18:00 - 20:00">18:00 - 20:00 (Prime Evening)</option>
                <option value="20:00 - 22:00">20:00 - 22:00 (Late Prime)</option>
                <option value="22:00 - 24:00">22:00 - 24:00 (Night Owl)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-heading text-xs font-semibold uppercase text-on-surface mb-1">
                Payment Collection Method
              </label>
              <select
                value={newBookingData.paymentMethod}
                onChange={(e) =>
                  setNewBookingData({ ...newBookingData, paymentMethod: e.target.value })
                }
                className="w-full bg-surface-container-low text-on-surface font-body text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              >
                <option value="Cash at Desk">Cash at Desk</option>
                <option value="UPI (GPay / PhonePe / Paytm)">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Bank Transfer (IMPS)">Bank Transfer (IMPS)</option>
              </select>
            </div>
            <div>
              <label className="block font-heading text-xs font-semibold uppercase text-on-surface mb-1">
                Payment Settlement Status
              </label>
              <select
                value={newBookingData.paymentStatus}
                onChange={(e) =>
                  setNewBookingData({ ...newBookingData, paymentStatus: e.target.value })
                }
                className="w-full bg-surface-container-low text-on-surface font-body text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              >
                <option value="Paid">Paid in Full</option>
                <option value="Partial">Partial Deposit (50%)</option>
                <option value="Pending">Pending (Pay upon arrival)</option>
              </select>
            </div>
          </div>

          {/* Calculated Cost Preview */}
          <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between">
            <div>
              <span className="font-heading text-xs text-on-surface-variant font-medium">
                Total Session Price:
              </span>
              <div className="font-heading text-lg font-bold text-primary">
                {formatINR(((turfs.find(t => t.id === newBookingData.turfId || t._id === newBookingData.turfId)?.hourlyPrice || 1200) * 2))}
              </div>
            </div>
            <span className="px-2 py-1 rounded bg-secondary-container text-secondary font-heading text-xs font-bold">
              Floodlights Included
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsNewBookingOpen(false)}
              className="px-5 py-2.5 rounded-full text-on-surface-variant hover:text-on-surface font-heading text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-secondary text-on-primary font-heading text-xs font-bold shadow-md hover:opacity-95"
            >
              Confirm Reservation
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Slot Block (Maintenance) Modal */}
      <Modal
        isOpen={isQuickBlockOpen}
        onClose={() => setIsQuickBlockOpen(false)}
        title="Block Pitch Slot for Maintenance"
        subtitle="Lock turf availability for agronomy care, sprinkler hydration, or private club training."
        badge="Grounds Management"
      >
        <form onSubmit={handleBlockSlot} className="space-y-4">
          <div>
            <label className="block font-heading text-xs font-semibold uppercase text-on-surface mb-1">
              Select Pitch
            </label>
            <select
              value={blockData.turfId}
              onChange={(e) => setBlockData({ ...blockData, turfId: e.target.value })}
              className="w-full bg-surface-container-low text-on-surface font-body text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
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
              <label className="block font-heading text-xs font-semibold uppercase text-on-surface mb-1">
                Time Window
              </label>
              <select
                value={blockData.timeSlot}
                onChange={(e) => setBlockData({ ...blockData, timeSlot: e.target.value })}
                className="w-full bg-surface-container-low text-on-surface font-body text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              >
                <option value="06:00 - 08:00">06:00 - 08:00</option>
                <option value="10:00 - 12:00">10:00 - 12:00</option>
                <option value="12:00 - 14:00">12:00 - 14:00</option>
                <option value="14:00 - 16:00">14:00 - 16:00</option>
              </select>
            </div>
            <div>
              <label className="block font-heading text-xs font-semibold uppercase text-on-surface mb-1">
                Block Category / Reason
              </label>
              <select
                value={blockData.reason}
                onChange={(e) => setBlockData({ ...blockData, reason: e.target.value })}
                className="w-full bg-surface-container-low text-on-surface font-body text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              >
                <option value="Sprinklers & Edge Trim">Sprinklers & Edge Trim</option>
                <option value="Decompaction & Infill Roll">Decompaction & Infill Roll</option>
                <option value="Floodlight Sensor Calibration">Floodlight Sensor Calibration</option>
                <option value="Private Club / Owner Use">Private Club / Owner Reserved</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-heading text-xs font-semibold uppercase text-on-surface mb-1">
              Internal Crew Notes
            </label>
            <input
              type="text"
              value={blockData.notes}
              onChange={(e) => setBlockData({ ...blockData, notes: e.target.value })}
              placeholder="e.g. Sub-irrigation cycle with grounds superintendent"
              className="w-full bg-surface-container-low text-on-surface font-body text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsQuickBlockOpen(false)}
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
    </div>
  );
}
