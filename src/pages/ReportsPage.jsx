import React, { useState, useEffect } from "react";
import { StatCard } from "../components/common/StatCard";
import { getStoredTurfs } from "../data/mockData";
import { reportAPI, turfAPI } from "../services/api";
import { formatINR } from "../utils/formatters";

export function ReportsPage() {
  const [turfs, setTurfs] = useState(getStoredTurfs());
  const [dateRange, setDateRange] = useState("This Month (Oct 1 - Oct 31, 2024)");
  const [selectedTurf, setSelectedTurf] = useState("all");
  const [metricTab, setMetricTab] = useState("revenue"); // 'revenue' | 'bookings' | 'occupancy'
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await reportAPI.getAnalytics({
        dateRange,
        turfId: selectedTurf,
      });
      if (res?.success && res.data) {
        setAnalyticsData(res.data);
      }

      const turfRes = await turfAPI.getAll();
      if (turfRes?.success && turfRes.data?.length > 0) {
        setTurfs(turfRes.data);
      }
    } catch (err) {
      console.warn("[Reports] Analytics sync error, keeping local mock state:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedTurf]);

  const handleExportCSV = () => {
    const headers = ["Facility / Pitch", "Gross Revenue", "Revenue Share", "Capacity Occupancy", "Status"];
    const rows = [
      ["Greenfield Sports Arena (Pune)", "₹1,24,500", "32.4%", "92%", "Optimal"],
      ["KickOff Football Arena (Mumbai)", "₹98,700", "25.7%", "88%", "Optimal"],
      ["Champion Cricket Ground (Thane)", "₹62,400", "16.2%", "84%", "Optimal"],
      ["Urban Sports Turf (Pune)", "₹43,200", "11.2%", "86%", "Optimal"],
      ["Elite Play Arena (Mumbai)", "₹31,800", "8.3%", "79%", "Optimal"],
      ["Nashik Premier Cricket Box (Nashik)", "₹23,600", "6.1%", "74%", "Optimal"]
    ];
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `turfease_financial_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGeneratePDF = () => {
    alert("Financial and agronomy performance executive summary report ready for download (PDF).");
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Command & Filter Deck */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-lg mb-space-xl">
        <div className="flex flex-col max-w-2xl">
          <div className="flex items-center gap-space-xs mb-space-xs">
            <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed-variant font-heading text-xs uppercase tracking-wider font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Performance &amp; Financial Telemetry
            </span>
            <span className="text-outline-variant text-xs">•</span>
            <span className="font-heading text-xs text-on-surface-variant font-medium">
              Synced 3m ago
            </span>
          </div>
          <h1 className="font-heading text-2xl lg:text-3xl text-on-surface tracking-tight font-bold">
            Reports &amp; Analytics
          </h1>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-1">
            Understand your turf business performance, booking velocity, and yield across synthetic and hybrid grounds.
          </p>
        </div>

        {/* Filter & Action Controls */}
        <div className="flex flex-wrap items-center gap-space-sm">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-surface-container-low hover:bg-surface-container-high transition-colors px-space-md py-2.5 rounded-xl shadow-xs text-on-surface font-heading text-xs font-semibold outline-none cursor-pointer"
          >
            <option value="This Month (Oct 1 - Oct 31, 2024)">This Month (Oct 1 - Oct 31)</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last Month">Last Month</option>
            <option value="Quarter to Date">Quarter to Date</option>
          </select>

          {/* Turf Selector */}
          <select
            value={selectedTurf}
            onChange={(e) => setSelectedTurf(e.target.value)}
            className="bg-surface-container-low hover:bg-surface-container-high transition-colors px-space-md py-2.5 rounded-xl shadow-xs text-on-surface font-heading text-xs font-semibold outline-none cursor-pointer"
          >
            <option value="all">All Pitches (Consolidated)</option>
            {turfs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Export Buttons */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-space-xs bg-secondary-container hover:bg-surface-container-highest text-on-secondary-fixed-variant transition-colors px-space-md py-2.5 rounded-full font-heading text-xs font-bold shadow-xs"
            type="button"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleGeneratePDF}
            className="flex items-center gap-space-xs bg-primary hover:bg-secondary text-on-primary transition-all px-space-md py-2.5 rounded-full font-heading text-xs font-bold shadow-sm"
            type="button"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            <span>Generate PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Telemetry Metric Cards (4 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-xl">
        <StatCard
          title="Total Revenue"
          value={formatINR(analyticsData?.summary?.totalRevenueCollected ?? 384200)}
          subtitle="Net revenue collected across grounds"
          icon="payments"
          badgeText="+16.4%"
          badgeVariant="positive"
        />
        <StatCard
          title="Total Bookings"
          value={`${analyticsData?.summary?.totalBookings ?? 412} Slots`}
          subtitle="All scheduled reservations"
          icon="calendar_month"
          badgeText="+8.2% vs last mo"
          badgeVariant="positive"
        />
        <StatCard
          title="Completed Bookings"
          value={`${analyticsData?.summary?.statusCounts?.Completed ?? 386} Slots`}
          subtitle="Fulfilled match hours"
          icon="verified"
          badgeText="Completed"
          badgeVariant="positive"
        />
        <StatCard
          title="Cancelled & No-Show"
          value={`${analyticsData?.summary?.statusCounts?.Cancelled ?? 26} Slots`}
          subtitle="Protected schedule history"
          icon="event_busy"
          badgeText="Cancelled"
          badgeVariant="negative"
        />
      </div>

      {/* Middle Visual Analytics Deck (8 cols / 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
        {/* Left Column (8 Columns): Area Trend & Bar distribution */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          {/* 1. Monthly Revenue & Booking Velocity Area Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg shadow-sm flex flex-col border border-surface-container/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
              <div className="flex flex-col">
                <span className="font-heading text-xs text-outline uppercase tracking-wider font-semibold">
                  Yield Timeline
                </span>
                <h2 className="font-heading text-xl text-primary font-bold">
                  Monthly Revenue &amp; Booking Trend
                </h2>
              </div>
              <div className="flex items-center gap-space-xs bg-surface-container-low p-1 rounded-xl self-start sm:self-auto">
                <button
                  onClick={() => setMetricTab("revenue")}
                  className={`px-3 py-1 rounded-lg font-heading text-xs font-bold transition-all ${
                    metricTab === "revenue"
                      ? "bg-surface-container-lowest text-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Revenue (₹)
                </button>
                <button
                  onClick={() => setMetricTab("bookings")}
                  className={`px-3 py-1 rounded-lg font-heading text-xs font-bold transition-all ${
                    metricTab === "bookings"
                      ? "bg-surface-container-lowest text-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Bookings (Count)
                </button>
                <button
                  onClick={() => setMetricTab("occupancy")}
                  className={`px-3 py-1 rounded-lg font-heading text-xs font-bold transition-all ${
                    metricTab === "occupancy"
                      ? "bg-surface-container-lowest text-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Occupancy (%)
                </button>
              </div>
            </div>

            {/* SVG Line/Area Chart Container */}
            <div className="relative w-full h-72 bg-gradient-to-b from-surface-container-low/40 to-transparent rounded-xl p-space-sm flex flex-col justify-end overflow-hidden">
              {/* Interactive Floating Peak Pill Indicator */}
              <div className="absolute top-6 left-[62%] -translate-x-1/2 z-10 bg-primary text-on-primary px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-space-xs font-heading text-xs border border-tertiary-fixed/30">
                <div className="w-2 h-2 rounded-full bg-tertiary-fixed animate-ping" />
                <span className="font-bold text-tertiary-fixed">Peak Sat Oct 18:</span>
                <span>₹24,200.00 • 28 Slots</span>
              </div>

              {/* SVG Chart Visual */}
              <svg
                className="w-full h-56 overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 600 200"
              >
                <defs>
                  <linearGradient id="reportsGreenGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#064E3B" stopOpacity="0.28" />
                    <stop offset="65%" stopColor="#1E6B4F" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="#A7D977" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="reportsLineGrad" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#1E6B4F" />
                    <stop offset="65%" stopColor="#003527" />
                    <stop offset="100%" stopColor="#1E6B4F" />
                  </linearGradient>
                </defs>
                {/* Horizontal Gridlines */}
                <line x1="0" x2="600" y1="20" y2="20" stroke="#bfc9c3" strokeDasharray="4 4" strokeOpacity="0.4" strokeWidth="1" />
                <line x1="0" x2="600" y1="70" y2="70" stroke="#bfc9c3" strokeDasharray="4 4" strokeOpacity="0.4" strokeWidth="1" />
                <line x1="0" x2="600" y1="120" y2="120" stroke="#bfc9c3" strokeDasharray="4 4" strokeOpacity="0.4" strokeWidth="1" />
                <line x1="0" x2="600" y1="170" y2="170" stroke="#bfc9c3" strokeDasharray="4 4" strokeOpacity="0.4" strokeWidth="1" />
                <line x1="375" x2="375" y1="10" y2="190" stroke="#064E3B" strokeDasharray="2 2" strokeOpacity="0.5" strokeWidth="1.5" />

                {/* Revenue Area Polygon */}
                <polygon
                  points="20,150 110,135 200,98 290,68 375,32 460,82 550,58 590,52 590,195 20,195"
                  fill="url(#reportsGreenGrad)"
                />
                {/* Smooth Curve */}
                <path
                  d="M 20 150 C 70 145, 80 140, 110 135 C 150 130, 170 105, 200 98 C 240 90, 260 72, 290 68 C 330 62, 350 35, 375 32 C 410 28, 435 85, 460 82 C 495 78, 520 62, 550 58 L 590 52"
                  fill="none"
                  stroke="url(#reportsLineGrad)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                />
                {/* Nodes */}
                <circle cx="20" cy="150" r="4" fill="#ffffff" stroke="#1E6B4F" strokeWidth="2.5" />
                <circle cx="110" cy="135" r="4" fill="#ffffff" stroke="#1E6B4F" strokeWidth="2.5" />
                <circle cx="200" cy="98" r="4" fill="#ffffff" stroke="#1E6B4F" strokeWidth="2.5" />
                <circle cx="290" cy="68" r="4" fill="#ffffff" stroke="#1E6B4F" strokeWidth="2.5" />
                <circle cx="375" cy="32" r="6" fill="#bef28d" stroke="#003527" strokeWidth="3" className="animate-pulse" />
                <circle cx="460" cy="82" r="4" fill="#ffffff" stroke="#1E6B4F" strokeWidth="2.5" />
                <circle cx="550" cy="58" r="4" fill="#ffffff" stroke="#1E6B4F" strokeWidth="2.5" />
                <circle cx="590" cy="52" r="4" fill="#ffffff" stroke="#1E6B4F" strokeWidth="2.5" />
              </svg>

              {/* Chart X-Axis Labels */}
              <div className="flex items-center justify-between text-outline font-heading text-xs px-2 pt-2">
                <span>Week 1: ₹82k</span>
                <span>Week 2: ₹96k</span>
                <span className="text-primary font-bold">Week 3: ₹1.11L 🔥</span>
                <span>Week 4: ₹95k</span>
              </div>
            </div>

            {/* Mini Stats Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm pt-space-md mt-space-md bg-surface-container-low/40 rounded-xl p-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-lg">calendar_view_week</span>
                <div className="flex flex-col">
                  <span className="font-heading text-[11px] text-outline">Peak Revenue Day</span>
                  <span className="font-heading text-sm text-primary font-bold">Saturday (₹24,200 avg)</span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-lg">stars</span>
                <div className="flex flex-col">
                  <span className="font-heading text-[11px] text-outline">Highest Yield Turf</span>
                  <span className="font-heading text-sm text-primary font-bold">Greenfield Arena (₹1,400/hr)</span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-lg">timer</span>
                <div className="flex flex-col">
                  <span className="font-heading text-[11px] text-outline">Avg Duration</span>
                  <span className="font-heading text-sm text-primary font-bold">1.85 Hours / Slot</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Bookings by Day of Week Bar Chart Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg shadow-sm flex flex-col border border-surface-container/60">
            <div className="flex items-center justify-between mb-space-md">
              <div className="flex flex-col">
                <span className="font-heading text-xs text-outline uppercase tracking-wider font-semibold">
                  Weekly Load Distribution
                </span>
                <h3 className="font-heading text-lg font-bold text-primary">
                  Bookings by Day of Week
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-fixed-variant font-heading text-xs font-semibold">
                ⚡ Weekend Surge: +46%
              </span>
            </div>

            {/* Custom Tailwind Bar Graph */}
            <div className="grid grid-cols-7 gap-2 sm:gap-space-sm items-end h-48 pt-4 pb-2 px-space-xs">
              {[
                { day: "Mon", count: 42, pct: "42%", isPeak: false },
                { day: "Tue", count: 48, pct: "48%", isPeak: false },
                { day: "Wed", count: 56, pct: "56%", isPeak: false },
                { day: "Thu", count: 62, pct: "62%", isPeak: false },
                { day: "Fri", count: 78, pct: "78%", isPeak: false },
                { day: "Sat", count: 94, pct: "94%", isPeak: true },
                { day: "Sun", count: 82, pct: "82%", isPeak: false },
              ].map((item) => (
                <div key={item.day} className="flex flex-col items-center gap-1.5 h-full justify-end group relative">
                  {item.isPeak && (
                    <span className="absolute -top-3 px-1 rounded bg-tertiary-fixed text-tertiary font-heading text-[10px] font-bold">
                      MAX
                    </span>
                  )}
                  <span className={`font-heading text-xs font-bold ${item.isPeak ? 'text-primary' : 'text-outline group-hover:text-primary'}`}>
                    {item.count}
                  </span>
                  <div
                    className={`w-full max-w-[42px] rounded-t-lg transition-all ${
                      item.isPeak
                        ? "bg-primary shadow-md group-hover:bg-primary-container"
                        : "bg-surface-container group-hover:bg-secondary"
                    }`}
                    style={{ height: item.pct }}
                  />
                  <span className={`font-heading text-xs ${item.isPeak ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-on-surface-variant font-body text-xs pt-space-xs mt-space-xs border-t border-surface-container/60">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-primary" />
                <span>Peak Weekend (Fri-Sun: 254 slots • 61.6%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-surface-container" />
                <span>Weekday Core (Mon-Thu: 208 slots)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 Columns): Turf Earnings Breakdown & Payments Segment */}
        <div className="lg:col-span-4 flex flex-col gap-space-lg">
          {/* 1. Turf-wise Earnings */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg shadow-sm flex flex-col border border-surface-container/60">
            <div className="flex items-center justify-between mb-space-md">
              <div className="flex flex-col">
                <span className="font-heading text-xs text-outline uppercase tracking-wider font-semibold">
                  Field Inventory
                </span>
                <h3 className="font-heading text-lg font-bold text-primary">
                  Turf-wise Earnings
                </h3>
              </div>
              <span className="material-symbols-outlined text-outline">pie_chart</span>
            </div>

            <div className="flex flex-col gap-space-md">
              {(analyticsData?.turfBreakdown?.length > 0
                ? analyticsData.turfBreakdown.map((t, idx) => ({
                    name: t.name,
                    amount: formatINR(t.grossRevenue || 0),
                    share: t.revenueShare || "0%",
                    occ: t.occupancy || "85%",
                    color: ["bg-primary", "bg-secondary", "bg-surface-tint", "bg-tertiary-fixed-dim", "bg-outline", "bg-secondary-fixed-dim"][idx % 6],
                  }))
                : [
                    { name: "Greenfield Sports Arena (Pune)", amount: "₹1,24,500", share: "32.4%", occ: "92%", color: "bg-primary" },
                    { name: "KickOff Football Arena (Mumbai)", amount: "₹98,700", share: "25.7%", occ: "88%", color: "bg-secondary" },
                    { name: "Champion Cricket Ground (Thane)", amount: "₹62,400", share: "16.2%", occ: "84%", color: "bg-surface-tint" },
                    { name: "Urban Sports Turf (Pune)", amount: "₹43,200", share: "11.2%", occ: "86%", color: "bg-tertiary-fixed-dim" },
                    { name: "Elite Play Arena (Mumbai)", amount: "₹31,800", share: "8.3%", occ: "79%", color: "bg-outline" },
                    { name: "Nashik Premier Cricket Box", amount: "₹23,600", share: "6.1%", occ: "74%", color: "bg-secondary-fixed-dim" }
                  ]
              ).map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between font-heading text-xs">
                    <span className="font-bold text-on-surface truncate pr-2">{item.name}</span>
                    <span className="font-bold text-primary shrink-0">{item.amount}</span>
                  </div>
                  <div className="flex items-center justify-between font-body text-[11px] text-on-surface-variant">
                    <span>{item.share} revenue share</span>
                    <span className="font-semibold text-secondary">{item.occ} Occ</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: item.occ }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Booking Status & Payments Summary Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg shadow-sm flex flex-col justify-between border border-surface-container/60">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <div className="flex flex-col">
                  <span className="font-heading text-xs text-outline uppercase tracking-wider font-semibold">
                    Ledger Settlement
                  </span>
                  <h3 className="font-heading text-lg font-bold text-primary">
                    Payments Summary
                  </h3>
                </div>
                <span className="material-symbols-outlined text-secondary">
                  account_balance_wallet
                </span>
              </div>

              {/* Segmented Progress Bar */}
              <div className="w-full h-3 rounded-full bg-surface-container flex overflow-hidden my-space-md shadow-inner">
                <div className="h-full bg-primary" style={{ width: "90.7%" }} title="Paid in Full: 90.7%" />
                <div className="h-full bg-tertiary-fixed" style={{ width: "7.4%" }} title="Pending: 7.4%" />
                <div className="h-full bg-secondary-fixed-dim" style={{ width: "1.9%" }} title="Partially Paid: 1.9%" />
              </div>

              {/* Itemized Breakdown */}
              <div className="flex flex-col gap-space-xs mt-space-sm font-heading text-xs">
                <div className="flex items-center justify-between py-1 border-b border-surface-container-low">
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span>Paid in Full</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-primary">₹3,48,600.00</span>
                    <span className="text-outline text-[11px]">(90.7%)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-surface-container-low">
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed" />
                    <span>Pending Invoices</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-on-surface">₹28,500.00</span>
                    <span className="text-outline text-[11px]">(7.4%)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-surface-container-low">
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim" />
                    <span>Partial Balances</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-on-surface">₹7,100.00</span>
                    <span className="text-outline text-[11px]">(1.9%)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="w-2.5 h-2.5 rounded-full bg-error" />
                    <span>Refunded / Waivers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-error">₹4,200.00</span>
                    <span className="text-outline text-[11px]">(1.1%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
