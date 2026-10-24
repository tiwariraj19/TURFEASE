import React, { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { StatCard } from "../components/common/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { getStoredTurfs, saveStoredTurfs } from "../data/mockData";

export function ManageTurfsPage() {
  const navigate = useNavigate();
  const context = useOutletContext() || {};
  const globalSearch = context.globalSearch || "";

  const [turfs, setTurfs] = useState(getStoredTurfs());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTurf, setCurrentTurf] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  // Form State
  const initialForm = {
    name: "",
    zone: "",
    location: "",
    sport: "11-a-side",
    sportCategory: "football",
    hourlyPrice: 80,
    capacity: 16,
    openTime: "06:00",
    closeTime: "23:00",
    surfaceGrade: "4G Monofilament Dual-Tone",
    dimensions: "50m × 30m",
    infill: "Organic Cork / EPDM Infill",
    irrigation: "Automated Sub-irrigation",
    facilities: ["LED Floodlights", "Dressing Rooms", "Smart Scoreboard"],
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAvZRrrUnauAkNHN8hNsaQKmNE3EW_Syu158UscupFE92xl1VpbIr23TLC2n9d2QYUz6Ol2KQi9l9OH2uCDZGxKHy0nu74NyZ38tY23AbEYlgcCnT8PFlgFVM9S2XnztIpCxT6WjyjNUzotFQ8db6YSAX98k6zvXvKZriOgiQN67P94OuCEiTHDEl8vwBz1C4jNm_A2flG_jEXGq8amQARxyy0E-fF_ygdDCrtfe05kITnSH-WbKBqyBw",
    status: "active"
  };

  const [formData, setFormData] = useState(initialForm);

  const availableFacilities = [
    "LED Floodlights",
    "Dressing Rooms",
    "Smart Scoreboard",
    "Turf Sprinklers",
    "4K Replay Cams",
    "Spectator Canopy",
    "Sound System",
    "Team Dugouts",
    "Bowling Machine Ready"
  ];

  const handleFacilityToggle = (facility) => {
    if (formData.facilities.includes(facility)) {
      setFormData({
        ...formData,
        facilities: formData.facilities.filter((f) => f !== facility),
      });
    } else {
      setFormData({
        ...formData,
        facilities: [...formData.facilities, facility],
      });
    }
  };

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (turf) => {
    setCurrentTurf(turf);
    setFormData({
      ...turf,
      sportCategory: turf.sportCategory || "football"
    });
    setIsEditModalOpen(true);
  };

  const handleSaveTurf = (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Please provide a turf name");
      return;
    }

    if (isEditModalOpen && currentTurf) {
      const updated = turfs.map((t) =>
        t.id === currentTurf.id
          ? {
              ...t,
              ...formData,
              hourlyPrice: Number(formData.hourlyPrice),
              capacity: Number(formData.capacity),
            }
          : t
      );
      setTurfs(updated);
      saveStoredTurfs(updated);
      setIsEditModalOpen(false);
    } else {
      const newTurf = {
        ...formData,
        id: `pitch-${Date.now()}`,
        zone: formData.zone || `Zone ${String.fromCharCode(65 + turfs.length)} • Pitch 0${turfs.length + 1}`,
        hourlyPrice: Number(formData.hourlyPrice),
        capacity: Number(formData.capacity),
        hours: `${formData.openTime}–${formData.closeTime}`,
        healthStatus: "Optimal",
        moisture: "42.0%",
        lightingStatus: "Ready",
      };
      const updated = [...turfs, newTurf];
      setTurfs(updated);
      saveStoredTurfs(updated);
      setIsAddModalOpen(false);
    }
  };

  const handleToggleStatus = (turf) => {
    const nextStatus = turf.status === "active" ? "inactive" : "active";
    const updated = turfs.map((t) =>
      t.id === turf.id ? { ...t, status: nextStatus } : t
    );
    setTurfs(updated);
    saveStoredTurfs(updated);
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Name", "Zone", "Sport", "Hourly Price", "Capacity", "Operating Hours", "Status"];
    const rows = turfs.map(t => [t.id, t.name, t.zone, t.sport, t.hourlyPrice, t.capacity, t.hours, t.status]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `turfease_facilities_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Search Logic
  const query = (searchQuery || globalSearch).toLowerCase();
  let filteredTurfs = turfs.filter((t) => {
    const matchesSearch =
      !query ||
      t.name.toLowerCase().includes(query) ||
      t.zone.toLowerCase().includes(query) ||
      t.location.toLowerCase().includes(query) ||
      t.surfaceGrade.toLowerCase().includes(query) ||
      t.sport.toLowerCase().includes(query);

    const matchesSport =
      selectedSport === "all" ||
      (selectedSport === "football" && t.sportCategory === "football") ||
      (selectedSport === "cricket" && t.sportCategory === "cricket") ||
      (selectedSport === "other" && t.sportCategory !== "football" && t.sportCategory !== "cricket");

    const matchesStatus =
      statusFilter === "all" ||
      t.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesSport && matchesStatus;
  });

  // Sorting
  if (sortBy === "price-high") {
    filteredTurfs = [...filteredTurfs].sort((a, b) => b.hourlyPrice - a.hourlyPrice);
  } else if (sortBy === "price-low") {
    filteredTurfs = [...filteredTurfs].sort((a, b) => a.hourlyPrice - b.hourlyPrice);
  } else if (sortBy === "capacity") {
    filteredTurfs = [...filteredTurfs].sort((a, b) => b.capacity - a.capacity);
  }

  return (
    <div className="flex flex-col w-full">
      {/* Top Level Header & Executive Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg mb-space-xl">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs mb-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span className="font-heading text-xs uppercase tracking-widest text-secondary font-bold">
              Facility &amp; Ground Assets
            </span>
          </div>
          <h1 className="font-heading text-2xl lg:text-3xl text-on-surface tracking-tight font-bold">
            Manage Turfs
          </h1>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant max-w-2xl mt-1">
            Add, calibrate, and oversee high-yield turf pitches, synthetic surface grades, and technical zone telemetry across the facility grounds.
          </p>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-space-xs px-space-md py-2.5 rounded-full bg-surface-container-high text-on-surface font-heading text-xs sm:text-sm hover:bg-surface-container-highest transition-all shadow-sm font-semibold"
            type="button"
          >
            <span className="material-symbols-outlined text-lg text-secondary">
              file_download
            </span>
            <span>Export Facilities CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-space-xs px-space-lg py-2.5 rounded-full bg-gradient-to-r from-primary to-secondary text-on-primary font-heading text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-95 font-semibold"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">add_circle</span>
            <span>+ Add New Turf</span>
          </button>
        </div>
      </div>

      {/* Telemetry & Ground Capacity Strip (4 Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-xl">
        <StatCard
          title="Total Pitches"
          value={`${turfs.length} Grounds`}
          subtitle="4 • 5/7-a-side | 2 • 11-a-side Full"
          icon="stadium"
          badgeText="Active & Live"
          badgeVariant="positive"
        />
        <StatCard
          title="Active Occupancy"
          value="84%"
          subtitle="Peak twilight booking velocity"
          icon="pie_chart"
          badgeText="+6.2% wk"
          badgeVariant="positive"
        />
        <StatCard
          title="Avg. Hourly Yield"
          value="$68/hr"
          subtitle="Dynamic tier active ($55 - $110/hr)"
          icon="payments"
          badgeText="Blended"
          badgeVariant="neutral"
        />
        <StatCard
          title="Facility Health"
          value="100%"
          subtitle="0 offline • Maint cycle Tue 04:00 AM"
          icon="verified"
          badgeText="Pitch Ready"
          badgeVariant="positive"
        />
      </div>

      {/* Filter & Sub-Navigation Bar */}
      <div className="bg-surface-container-low rounded-2xl p-space-md mb-space-xl flex flex-col xl:flex-row xl:items-center justify-between gap-space-md shadow-sm border border-surface-container/60">
        {/* Search Bar */}
        <div className="flex items-center bg-surface-container-lowest rounded-xl px-space-md py-2.5 gap-space-xs w-full xl:w-80 shadow-xs border border-transparent focus-within:border-secondary/40">
          <span className="material-symbols-outlined text-outline text-xl">
            search
          </span>
          <input
            className="bg-transparent border-0 outline-none w-full font-body text-xs sm:text-sm text-on-surface placeholder:text-outline"
            placeholder="Search turfs by name, zone, or infill..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sport Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 no-scrollbar">
          {[
            { id: "all", label: `All Sports (${turfs.length})` },
            { id: "football", label: `Football (${turfs.filter(t => t.sportCategory === "football").length})` },
            { id: "cricket", label: `Cricket Box (${turfs.filter(t => t.sportCategory === "cricket").length})` },
            { id: "other", label: `Multi-Sport (${turfs.filter(t => t.sportCategory !== "football" && t.sportCategory !== "cricket").length})` }
          ].map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              className={`px-space-md py-2 rounded-xl font-heading text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedSport === sport.id
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              }`}
              type="button"
            >
              {sport.label}
            </button>
          ))}
        </div>

        {/* Dropdown Filters & Layout Toggle */}
        <div className="flex items-center gap-space-sm flex-wrap xl:flex-nowrap justify-end">
          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-container rounded-xl px-3 py-2 text-on-surface font-heading text-xs font-semibold outline-none cursor-pointer hover:bg-surface-container-high transition-colors"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Sort Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-surface-container rounded-xl px-3 py-2 text-on-surface font-heading text-xs font-semibold outline-none cursor-pointer hover:bg-surface-container-high transition-colors"
          >
            <option value="default">Sort: Default</option>
            <option value="capacity">Highest Capacity</option>
            <option value="price-high">Price: High to Low</option>
            <option value="price-low">Price: Low to High</option>
          </select>

          {/* Grid / List View Toggle */}
          <div className="flex items-center bg-surface-container-high rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Grid View"
              type="button"
            >
              <span className="material-symbols-outlined text-lg leading-none">
                grid_view
              </span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "table"
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="List Table View"
              type="button"
            >
              <span className="material-symbols-outlined text-lg leading-none">
                view_agenda
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Turf Asset Grid / Table View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter mb-space-xl">
          {filteredTurfs.map((turf) => (
            <div
              key={turf.id}
              className={`bg-surface-container rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group hover:-translate-y-1 transition-all duration-200 border border-surface-container/60 ${
                turf.status === "inactive" ? "opacity-75" : ""
              }`}
            >
              <div>
                {/* Card Media Header */}
                <div className="relative h-48 w-full overflow-hidden bg-primary-container">
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${turf.coverImage}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />

                  {/* Badges on image */}
                  <div className="absolute top-space-sm left-space-sm right-space-sm flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-primary font-heading text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${turf.status === 'active' ? 'bg-tertiary-fixed animate-ping' : 'bg-outline'}`} />
                      {turf.status === "active" ? "Active • Live" : "Deactivated"}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-primary-container/85 backdrop-blur-md text-tertiary-fixed font-heading text-xs font-semibold">
                      {turf.surfaceGrade}
                    </span>
                  </div>

                  <div className="absolute bottom-space-sm left-space-md right-space-md flex items-end justify-between text-on-primary">
                    <div>
                      <span className="font-heading text-xs uppercase tracking-wider text-secondary-container font-semibold">
                        {turf.zone}
                      </span>
                      <h2 className="font-heading text-lg sm:text-xl font-bold text-on-primary tracking-tight">
                        {turf.name}
                      </h2>
                    </div>
                    <div className="text-right">
                      <span className="font-heading text-2xl font-bold text-tertiary-fixed leading-none">
                        ${turf.hourlyPrice}
                      </span>
                      <span className="font-heading text-[10px] text-on-primary-container block">
                        per hour
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-space-lg flex flex-col gap-space-md">
                  <div className="flex items-center gap-space-xs text-on-surface-variant font-heading text-xs">
                    <span className="material-symbols-outlined text-base text-secondary">
                      location_on
                    </span>
                    <span>{turf.location}</span>
                  </div>

                  {/* Grid Specs */}
                  <div className="grid grid-cols-3 gap-2 py-space-sm bg-surface-container-low rounded-xl px-space-sm text-center">
                    <div>
                      <span className="font-heading text-[10px] uppercase text-outline block">
                        Sport
                      </span>
                      <span className="font-heading text-xs font-bold text-on-surface">
                        {turf.sport}
                      </span>
                    </div>
                    <div>
                      <span className="font-heading text-[10px] uppercase text-outline block">
                        Capacity
                      </span>
                      <span className="font-heading text-xs font-bold text-on-surface">
                        {turf.capacity} Players
                      </span>
                    </div>
                    <div>
                      <span className="font-heading text-[10px] uppercase text-outline block">
                        Hours
                      </span>
                      <span className="font-heading text-xs font-bold text-on-surface">
                        {turf.hours}
                      </span>
                    </div>
                  </div>

                  {/* Pitch Specifications & Infill */}
                  <div className="flex items-center justify-between font-body text-xs text-on-surface-variant px-1 flex-wrap gap-1">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-secondary">
                        straighten
                      </span>
                      {turf.dimensions}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-secondary">
                        grain
                      </span>
                      {turf.infill}
                    </span>
                    <span className="flex items-center gap-1 text-secondary font-semibold">
                      <span className="material-symbols-outlined text-xs">
                        water_drop
                      </span>
                      {turf.irrigation}
                    </span>
                  </div>

                  {/* Facilities Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {turf.facilities.map((fac, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface font-heading text-[11px]"
                      >
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Management Action Footer */}
              <div className="p-space-lg pt-0 flex items-center justify-between gap-space-sm">
                <button
                  onClick={() => navigate("/bookings")}
                  className="flex-1 py-2 rounded-xl bg-surface-container-lowest text-on-surface font-heading text-xs font-semibold hover:bg-surface-container-high transition-colors shadow-xs text-center cursor-pointer"
                  type="button"
                >
                  Schedule &amp; Slots
                </button>
                <button
                  onClick={() => handleOpenEdit(turf)}
                  className="p-2 rounded-xl bg-surface-container-low text-secondary hover:bg-surface-container-highest transition-colors cursor-pointer"
                  title="Edit Turf Properties"
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <button
                  onClick={() => setDeactivateTarget(turf)}
                  className={`p-2 rounded-xl bg-surface-container-low transition-colors cursor-pointer ${
                    turf.status === "active"
                      ? "text-on-surface-variant hover:text-error hover:bg-error-container"
                      : "text-secondary hover:bg-surface-container-highest"
                  }`}
                  title={turf.status === "active" ? "Deactivate Turf" : "Reactivate Turf"}
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">
                    power_settings_new
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden mb-space-xl border border-surface-container/60">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant font-heading text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Turf Name &amp; Zone</th>
                  <th className="py-3 px-4 font-semibold">Sport</th>
                  <th className="py-3 px-4 font-semibold">Hourly Price</th>
                  <th className="py-3 px-4 font-semibold">Capacity</th>
                  <th className="py-3 px-4 font-semibold">Operating Hours</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/40 text-on-surface font-body text-xs sm:text-sm">
                {filteredTurfs.map((turf) => (
                  <tr key={turf.id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={turf.coverImage}
                          alt={turf.name}
                          className="w-12 h-10 rounded-lg object-cover"
                        />
                        <div className="flex flex-col">
                          <span className="font-heading font-bold text-on-surface">
                            {turf.name}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {turf.zone} • {turf.surfaceGrade}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{turf.sport}</td>
                    <td className="py-3.5 px-4 font-heading font-bold text-primary">
                      ${turf.hourlyPrice}/hr
                    </td>
                    <td className="py-3.5 px-4 font-medium">{turf.capacity} Players</td>
                    <td className="py-3.5 px-4 text-xs text-on-surface-variant">{turf.hours}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={turf.status === "active" ? "Active" : "Inactive"} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(turf)}
                          className="p-1.5 rounded-lg text-secondary hover:bg-surface-container transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => setDeactivateTarget(turf)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container transition-colors"
                          title="Deactivate"
                        >
                          <span className="material-symbols-outlined text-base">power_settings_new</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Operational Zone & Agronomic Telemetry Banner */}
      <div className="bg-gradient-to-r from-primary-container via-primary to-secondary rounded-2xl p-space-lg sm:p-space-xl text-on-primary mb-space-xl relative overflow-hidden shadow-md">
        <div className="absolute -right-8 -bottom-8 w-64 h-64 rounded-full bg-tertiary-fixed/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-space-xs mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed animate-pulse" />
              <span className="font-heading text-xs uppercase tracking-widest text-tertiary-fixed font-bold">
                Turf Maintenance Core • Sensors Active
              </span>
            </div>
            <h3 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-on-primary">
              All 6 pitch surfaces meet certified safety &amp; elasticity standards.
            </h3>
            <p className="font-body text-xs sm:text-sm text-on-primary-container mt-2 leading-relaxed">
              Automated soil moisture sensors indicate optimal infill dampness across Pitches 1, 2, and 5. Scheduled brush decompaction cycle is queued for Tuesday at 04:00 AM with zero booking disruptions.
            </p>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="bg-surface-container-lowest/10 backdrop-blur-md rounded-xl p-space-md text-center min-w-32 border border-white/10">
              <span className="font-heading text-[10px] text-on-primary-container uppercase block font-semibold">
                Moisture Index
              </span>
              <span className="font-heading text-xl sm:text-2xl font-bold text-tertiary-fixed">
                42.4%
              </span>
              <span className="font-heading text-[10px] text-surface-container-low block">
                Optimal Range
              </span>
            </div>
            <div className="bg-surface-container-lowest/10 backdrop-blur-md rounded-xl p-space-md text-center min-w-32 border border-white/10">
              <span className="font-heading text-[10px] text-on-primary-container uppercase block font-semibold">
                Shock Absorbency
              </span>
              <span className="font-heading text-xl sm:text-2xl font-bold text-on-primary">
                64.8 G
              </span>
              <span className="font-heading text-[10px] text-surface-container-low block">
                FIFA Class 1
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Turf Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? `Edit ${currentTurf?.name}` : "Add New Turf Facility"}
        subtitle="Configure turf properties, capacities, hourly pricing tiers, and amenities."
        badge={isEditModalOpen ? "Turf Calibration" : "New Pitch Commissioning"}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveTurf} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Turf Name */}
            <div>
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
                Turf / Pitch Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Pitch 7 — Maracanã Arena"
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent shadow-inner"
              />
            </div>

            {/* Location / Zone */}
            <div>
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
                Location &amp; Zone
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. West Annex • Court 2"
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent shadow-inner"
              />
            </div>

            {/* Sport Discipline */}
            <div>
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
                Sport Discipline
              </label>
              <select
                value={formData.sport}
                onChange={(e) => {
                  const val = e.target.value;
                  const cat = val.includes("Cricket") ? "cricket" : val.includes("Multi") ? "other" : "football";
                  setFormData({ ...formData, sport: val, sportCategory: cat });
                }}
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent shadow-inner"
              >
                <option value="11-a-side">Football (11-a-side Full Pitch)</option>
                <option value="7-a-side">Football (7-a-side / 8-a-side)</option>
                <option value="5-a-side">Football Cage (5-a-side)</option>
                <option value="Box Cricket">Cricket Box / Net Practice</option>
                <option value="Multi-Sport">Multi-Sport Synthetic Court</option>
              </select>
            </div>

            {/* Hourly Price */}
            <div>
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
                Standard Hourly Price ($ USD)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-secondary font-bold text-sm">$</span>
                <input
                  type="number"
                  min="10"
                  step="5"
                  required
                  value={formData.hourlyPrice}
                  onChange={(e) => setFormData({ ...formData, hourlyPrice: e.target.value })}
                  className="w-full pl-8 pr-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent shadow-inner"
                />
              </div>
            </div>

            {/* Capacity */}
            <div>
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
                Capacity (Max Players)
              </label>
              <input
                type="number"
                min="2"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent shadow-inner"
              />
            </div>

            {/* Operating Hours Window */}
            <div>
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
                Operating Window (Open - Close)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.openTime}
                  onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                  placeholder="06:00"
                  className="px-3 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm text-center outline-none focus:ring-2 focus:ring-secondary/40"
                />
                <input
                  type="text"
                  value={formData.closeTime}
                  onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                  placeholder="23:30"
                  className="px-3 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm text-center outline-none focus:ring-2 focus:ring-secondary/40"
                />
              </div>
            </div>

            {/* Surface Grade & Dimensions */}
            <div className="md:col-span-2">
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
                Surface Grade &amp; Pitch Dimensions
              </label>
              <input
                type="text"
                value={formData.surfaceGrade}
                onChange={(e) => setFormData({ ...formData, surfaceGrade: e.target.value })}
                placeholder="e.g. FIFA Quality Pro 50mm • 100m × 64m"
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent shadow-inner"
              />
            </div>

            {/* Facilities Checkboxes */}
            <div className="md:col-span-2">
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-2">
                Active Facilities &amp; Equipment Included
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableFacilities.map((fac) => (
                  <label
                    key={fac}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low text-on-surface font-body text-xs cursor-pointer hover:bg-surface-container transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.facilities.includes(fac)}
                      onChange={() => handleFacilityToggle(fac)}
                      className="w-4 h-4 accent-secondary rounded"
                    />
                    <span>{fac}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Active Status Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-surface-container rounded-xl md:col-span-2">
              <div className="flex flex-col">
                <span className="font-heading text-xs sm:text-sm font-bold text-on-surface">
                  Facility Active &amp; Bookable
                </span>
                <span className="font-body text-xs text-on-surface-variant">
                  Immediately open slot reservations to online bookers and admin console
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.status === "active"}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.checked ? "active" : "inactive" })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary" />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container/60">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="px-5 py-2.5 rounded-full text-on-surface-variant hover:text-on-surface font-heading text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-secondary text-on-primary font-heading text-xs font-bold shadow-md hover:opacity-95"
            >
              {isEditModalOpen ? "Save Changes" : "Save & Commission Turf"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Turf Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (deactivateTarget) {
            handleToggleStatus(deactivateTarget);
            setDeactivateTarget(null);
          }
        }}
        title={deactivateTarget?.status === "active" ? "Deactivate Turf Pitch?" : "Reactivate Turf Pitch?"}
        message={
          deactivateTarget?.status === "active"
            ? `Are you sure you want to deactivate ${deactivateTarget?.name}? It will be hidden from new customer bookings until reactivated.`
            : `Reactivate ${deactivateTarget?.name} to immediately open schedule and reservations?`
        }
        confirmText={deactivateTarget?.status === "active" ? "Deactivate" : "Reactivate"}
        confirmVariant={deactivateTarget?.status === "active" ? "danger" : "primary"}
      />
    </div>
  );
}
