import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen antialiased flex flex-col">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="lg:pl-72 min-h-screen flex flex-col flex-1">
        {/* Header */}
        <Header
          onMenuClick={() => setMobileOpen(true)}
          searchTerm={globalSearch}
          onSearchChange={setGlobalSearch}
        />

        {/* Page View Container */}
        <main className="w-full pt-20 flex-1 bg-surface px-4 sm:px-space-md lg:px-space-lg py-6 sm:py-space-xl">
          <Outlet context={{ globalSearch }} />
        </main>
      </div>
    </div>
  );
}
