import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { formatDateReadableIN } from "../../utils/formatters";

export function Header({ onMenuClick, onSearchChange, searchTerm = "" }) {
  const { user } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications = [
    { id: 1, text: "Greenfield Arena (Pitch 1) floodlights scheduled for 18:00", time: "10m ago", icon: "light_mode" },
    { id: 2, text: "Advance UPI payment received for Booking #TE-8841 (₹1,400)", time: "25m ago", icon: "payments" },
    { id: 3, text: "Automated Sprinkler Cycle completed on KickOff Arena", time: "1h ago", icon: "water_drop" },
  ];

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,33,22,0.04)] z-40 px-4 sm:px-space-lg flex items-center justify-between border-b border-surface-container/60">
      {/* Left: Mobile Menu Toggle & Universal Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl bg-surface-container text-primary hover:bg-surface-container-high transition-colors"
          type="button"
          title="Open Menu"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        <div className="w-full sm:w-80 md:w-96 flex items-center bg-surface-container-low rounded-xl px-space-sm py-2 gap-space-xs border border-transparent focus-within:border-secondary/30 transition-all">
          <span className="material-symbols-outlined text-outline text-lg">
            search
          </span>
          <input
            className="bg-transparent border-0 outline-none w-full font-body text-xs sm:text-sm text-on-surface placeholder:text-outline"
            placeholder="Search bookings, turfs, players, invoices..."
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-surface-container font-heading text-[10px] text-outline font-semibold">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Date, Weather, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-4 md:gap-space-lg">
        {/* Date Display */}
        <div className="hidden xl:flex items-center gap-space-xs font-heading text-xs text-on-surface-variant font-medium">
          <span className="material-symbols-outlined text-base text-secondary">
            event
          </span>
          <span>{formatDateReadableIN(new Date())}</span>
        </div>

        {/* Pitch Health / Weather Badge */}
        <div className="hidden md:flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1.5 rounded-full border border-secondary/15">
          <span className="material-symbols-outlined text-secondary text-base">
            wb_sunny
          </span>
          <span className="font-heading text-[11px] font-semibold text-secondary">
            28°C • Optimal Pitch (Pune)
          </span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
            type="button"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-xl">
              notifications
            </span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-surface-container-lowest rounded-2xl shadow-xl p-3 border border-surface-container z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container px-2">
                <span className="font-heading text-xs uppercase font-bold text-primary">
                  Facility Alerts
                </span>
                <span className="text-[10px] font-semibold text-secondary">
                  3 New
                </span>
              </div>
              <div className="flex flex-col gap-1.5 py-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-surface-container-low transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-base text-secondary mt-0.5">
                      {n.icon}
                    </span>
                    <div className="flex flex-col flex-1">
                      <span className="font-body text-xs text-on-surface leading-tight">
                        {n.text}
                      </span>
                      <span className="text-[10px] text-on-surface-variant mt-1">
                        {n.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Owner Profile Chip */}
        <div className="flex items-center gap-space-sm pl-2 border-l border-surface-container">
          <div className="hidden sm:flex flex-col text-right">
            <span className="font-heading text-xs md:text-sm text-on-surface font-semibold leading-tight">
              {user?.name || "Vansh Tiwari"}
            </span>
            <span className="font-heading text-[10px] text-on-surface-variant">
              {user?.role || "Head Turf Operator / Owner"}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-heading font-bold text-xs shadow-sm">
            {user?.avatar || "VT"}
          </div>
        </div>
      </div>
    </header>
  );
}
