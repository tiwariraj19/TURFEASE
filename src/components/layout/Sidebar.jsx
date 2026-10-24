import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function Sidebar({ mobileOpen, setMobileOpen }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "dashboard" },
    { name: "Manage Turfs", path: "/turfs", icon: "stadium" },
    { name: "Slots & Bookings", path: "/bookings", icon: "calendar_month" },
    { name: "Payments", path: "/payments", icon: "payments" },
    { name: "Reports & Analytics", path: "/reports", icon: "monitoring" },
  ];

  const handleSignOut = (e) => {
    e.preventDefault();
    logout();
    navigate("/login");
  };

  const closeMobile = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-primary/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-primary-container to-secondary z-50 flex flex-col justify-between py-space-lg shadow-[0_4px_24px_rgba(0,33,22,0.16)] transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col px-space-md">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-space-sm mb-space-xl">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-primary flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-2xl font-bold">
                  sports_soccer
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-xl text-on-primary tracking-tight font-bold leading-none">
                  TurfEase
                </span>
                <span className="font-heading text-[10px] text-tertiary-fixed-dim uppercase tracking-wider font-semibold mt-1">
                  Facility Core
                </span>
              </div>
            </div>
            <span className="px-space-xs py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-heading text-[10px] uppercase font-bold tracking-wider">
              HQ
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `flex items-center gap-space-sm px-space-md py-space-sm rounded-xl transition-all font-heading text-sm ${
                    isActive
                      ? "bg-secondary-container text-on-secondary-fixed font-bold shadow-sm"
                      : "text-on-primary-container hover:bg-secondary-container/20 hover:text-on-primary"
                  }`
                }
              >
                <span className="material-symbols-outlined text-xl">
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer info & Sign Out */}
        <div className="px-space-md flex flex-col gap-space-md">
          {/* System Telemetry Status Pill */}
          <div className="bg-primary/40 backdrop-blur-md rounded-xl p-space-sm flex items-center justify-between border border-secondary/20">
            <div className="flex items-center gap-space-xs">
              <div className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse" />
              <div className="flex flex-col">
                <span className="font-heading text-[11px] text-on-primary font-medium">
                  Turf Engine v2.4
                </span>
                <span className="font-heading text-[10px] text-tertiary-fixed-dim">
                  99.8% Online
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-tertiary-fixed text-lg">
              dns
            </span>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-space-sm px-space-md py-space-sm rounded-xl text-on-primary-container hover:bg-surface-container-high/20 hover:text-on-primary transition-colors font-heading text-sm text-left w-full"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
