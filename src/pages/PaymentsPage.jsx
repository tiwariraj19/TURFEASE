import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { StatCard } from "../components/common/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { Modal } from "../components/common/Modal";
import {
  getStoredPayments,
  saveStoredPayments,
  getStoredBookings
} from "../data/mockData";

export function PaymentsPage() {
  const context = useOutletContext() || {};
  const globalSearch = context.globalSearch || "";

  const [payments, setPayments] = useState(getStoredPayments());
  const [bookings] = useState(getStoredBookings());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [unsettledFirst, setUnsettledFirst] = useState(true);

  // Record Payment Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [recordForm, setRecordForm] = useState({
    bookingId: "TE-8841",
    amountToCollect: 110,
    paymentMethod: "UPI (PhonePe)",
    refNote: "",
  });

  // KPI Calculations
  const totalCollected = payments.reduce((acc, curr) => acc + curr.receivedAmount, 0);
  const totalPending = payments.reduce((acc, curr) => acc + curr.dueBalance, 0);
  const settledToday = 3140;
  const refunds = 420;

  const handleOpenRecordPayment = (txn = null) => {
    if (txn) {
      setSelectedTxn(txn);
      setRecordForm({
        bookingId: txn.bookingId,
        amountToCollect: txn.dueBalance || txn.totalAmount,
        paymentMethod: txn.paymentMethod || "UPI (PhonePe)",
        refNote: "",
      });
    } else {
      setSelectedTxn(null);
      setRecordForm({
        bookingId: bookings[0]?.id || "TE-8841",
        amountToCollect: 110,
        paymentMethod: "UPI (PhonePe)",
        refNote: "",
      });
    }
    setIsRecordModalOpen(true);
  };

  const handleSavePayment = (e) => {
    e.preventDefault();
    const collectAmt = Number(recordForm.amountToCollect);

    if (selectedTxn) {
      // Reconcile existing transaction
      const updated = payments.map((p) => {
        if (p.id === selectedTxn.id) {
          const newReceived = p.receivedAmount + collectAmt;
          const newDue = Math.max(0, p.totalAmount - newReceived);
          return {
            ...p,
            receivedAmount: newReceived,
            dueBalance: newDue,
            status: newDue === 0 ? "Paid" : "Partial",
            paymentMethod: recordForm.paymentMethod,
          };
        }
        return p;
      });
      setPayments(updated);
      saveStoredPayments(updated);
    } else {
      // Create new transaction record
      const matchedBooking = bookings.find((b) => b.id === recordForm.bookingId) || bookings[0];
      const newTxn = {
        id: `PAY-${Math.floor(2100 + Math.random() * 900)}`,
        bookingId: matchedBooking.id,
        customerName: matchedBooking.customerName,
        customerPhone: matchedBooking.customerPhone,
        customerInitials: matchedBooking.customerInitials || "SK",
        turfName: matchedBooking.turfName,
        slotTime: `${matchedBooking.displayDate}, ${matchedBooking.timeSlot}`,
        totalAmount: matchedBooking.amount,
        receivedAmount: collectAmt,
        dueBalance: Math.max(0, matchedBooking.amount - collectAmt),
        paymentMethod: recordForm.paymentMethod,
        paymentMethodType: recordForm.paymentMethod.toLowerCase().includes("upi")
          ? "upi"
          : recordForm.paymentMethod.toLowerCase().includes("cash")
          ? "cash"
          : "card",
        status: collectAmt >= matchedBooking.amount ? "Paid" : "Partial",
        date: new Date().toISOString().replace("T", " ").slice(0, 16),
        ref: recordForm.refNote || "POS-COUNTER-PAID",
      };
      const updated = [newTxn, ...payments];
      setPayments(updated);
      saveStoredPayments(updated);
    }

    setIsRecordModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ["Payment ID", "Booking ID", "Customer", "Phone", "Turf", "Total", "Received", "Due", "Method", "Status"];
    const rows = payments.map(p => [
      p.id,
      p.bookingId,
      p.customerName,
      p.customerPhone,
      p.turfName,
      p.totalAmount,
      p.receivedAmount,
      p.dueBalance,
      p.paymentMethod,
      p.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `turfease_payments_ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Search Logic
  const query = (searchQuery || globalSearch).toLowerCase();
  let filteredPayments = payments.filter((p) => {
    const matchesSearch =
      !query ||
      p.customerName.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query) ||
      p.bookingId.toLowerCase().includes(query) ||
      p.customerPhone.includes(query);

    const matchesStatus =
      statusFilter === "all" || p.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesMethod =
      methodFilter === "all" ||
      (methodFilter === "upi" && p.paymentMethod.toLowerCase().includes("upi")) ||
      (methodFilter === "cash" && p.paymentMethod.toLowerCase().includes("cash")) ||
      (methodFilter === "card" && (p.paymentMethod.toLowerCase().includes("stripe") || p.paymentMethod.toLowerCase().includes("card"))) ||
      (methodFilter === "wire" && p.paymentMethod.toLowerCase().includes("wire"));

    return matchesSearch && matchesStatus && matchesMethod;
  });

  if (unsettledFirst) {
    filteredPayments = [...filteredPayments].sort((a, b) => b.dueBalance - a.dueBalance);
  }

  return (
    <div className="flex flex-col w-full space-y-space-xl">
      {/* Page Header & Primary Action Controls */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-lg">
        <div className="flex flex-col max-w-3xl">
          <div className="flex items-center gap-space-xs mb-space-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed shadow-[0_0_8px_rgba(190,242,141,0.8)] animate-pulse" />
            <span className="font-heading text-xs uppercase tracking-wider text-secondary font-bold">
              Financial Telemetry &amp; Revenue Ledger
            </span>
          </div>
          <h1 className="font-heading text-2xl lg:text-3xl text-primary tracking-tight font-bold">
            Payments &amp; Invoicing
          </h1>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-1.5 leading-relaxed">
            Track real-time liquidity, reconcile pending pitch slot receivables, collect remaining balances at counter, and manage owner-level adjustments across all facility sectors.
          </p>
        </div>

        {/* Quick Action Cluster */}
        <div className="flex items-center gap-space-sm flex-wrap self-start xl:self-end">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-space-xs px-space-md py-3 rounded-full bg-surface-container-low text-primary hover:bg-surface-container transition-all font-heading text-xs sm:text-sm shadow-sm font-semibold"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            <span>Export CSV / Ledger</span>
          </button>
          <button
            onClick={() => handleOpenRecordPayment(null)}
            className="flex items-center gap-space-xs px-6 py-3 rounded-full bg-gradient-to-r from-primary-container to-secondary text-on-primary hover:from-primary hover:to-primary-container transition-all shadow-[0_4px_16px_rgba(6,78,59,0.18)] font-heading text-xs sm:text-sm font-bold transform hover:-translate-y-0.5 active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">add_circle</span>
            <span>+ Record Payment</span>
          </button>
        </div>
      </div>

      {/* Four Telemetry KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
        <StatCard
          title="Total Collected (MTD)"
          value={`$${totalCollected.toLocaleString()}`}
          subtitle="+16.8% vs last month • 94.2% rate"
          icon="payments"
          badgeText="Yield 94%"
          badgeVariant="positive"
        />
        <StatCard
          title="Pending Receivables"
          value={`$${totalPending.toLocaleString()}`}
          subtitle="Uncollected counter balances"
          icon="pending_actions"
          badgeText="14 Pending"
          badgeVariant="negative"
        />
        <StatCard
          title="Settled Today"
          value={`$${settledToday.toLocaleString()}`}
          subtitle="11 txns • Peak 18:00 - 22:00"
          icon="bolt"
          badgeText="+8.4%"
          badgeVariant="positive"
        />
        <StatCard
          title="Refunds &amp; Adjustments"
          value={`$${refunds.toLocaleString()}`}
          subtitle="2 rainout waivers • 1 credit"
          icon="history"
          badgeText="Audited"
          badgeVariant="neutral"
        />
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-space-md border border-surface-container/60">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl flex items-center bg-surface-container-low rounded-xl px-space-md py-2.5 gap-space-sm border border-transparent focus-within:border-secondary/30">
          <span className="material-symbols-outlined text-outline text-xl">search</span>
          <input
            className="bg-transparent border-0 outline-none w-full font-body text-xs sm:text-sm text-on-surface placeholder:text-outline"
            placeholder="Search by customer name, phone, or Booking ID (e.g. #TE-8841)..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-space-sm">
          {/* Status Tabs */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl">
            {[
              { id: "all", label: `All (${payments.length})` },
              { id: "paid", label: "Paid" },
              { id: "partial", label: "Partial" },
              { id: "pending", label: "Pending" },
              { id: "refunded", label: "Refunded" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-heading text-xs transition-colors ${
                  statusFilter === tab.id
                    ? "bg-surface-container-lowest text-primary font-bold shadow-xs"
                    : "text-on-surface-variant hover:text-primary font-medium"
                }`}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Payment Method Select */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-surface-container-low rounded-xl px-3 py-2 text-on-surface font-heading text-xs font-semibold outline-none cursor-pointer hover:bg-surface-container transition-colors"
          >
            <option value="all">All Methods</option>
            <option value="upi">UPI (PhonePe/GPay)</option>
            <option value="cash">Cash at Counter</option>
            <option value="card">Stripe / Card</option>
            <option value="wire">Bank Wire</option>
          </select>

          {/* Toggle: Unsettled First */}
          <label className="flex items-center gap-2 cursor-pointer pl-space-xs select-none">
            <input
              type="checkbox"
              checked={unsettledFirst}
              onChange={(e) => setUnsettledFirst(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-9 h-5 rounded-full relative transition-colors ${
                unsettledFirst ? "bg-primary" : "bg-surface-container"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                  unsettledFirst ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </div>
            <span className="font-heading text-xs text-on-surface font-semibold">
              Unsettled First
            </span>
          </label>
        </div>
      </div>

      {/* Comprehensive Ledger & Receivables Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden flex flex-col border border-surface-container/60">
        {/* Table Container Header */}
        <div className="px-space-lg py-space-md bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-b border-surface-container/60">
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">receipt_long</span>
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-primary">
                Transaction &amp; Receivables Ledger
              </h2>
              <span className="font-heading text-xs text-on-surface-variant">
                Live audit ledger synced with Counter POS and Automated Gate API
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm text-xs font-heading text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              {payments.filter(p => p.status === "Paid").length} Fully Cleared
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tertiary-container" />
              {payments.filter(p => p.dueBalance > 0).length} Require Counter Balance
            </span>
          </div>
        </div>

        {/* Table Rows */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant font-heading text-[11px] uppercase tracking-wider">
                <th className="py-3 px-space-md font-semibold">ID &amp; Booking</th>
                <th className="py-3 px-space-md font-semibold">Customer / Contact</th>
                <th className="py-3 px-space-md font-semibold">Pitch &amp; Slot</th>
                <th className="py-3 px-space-md font-semibold text-right">Total Slot</th>
                <th className="py-3 px-space-md font-semibold text-right">Received</th>
                <th className="py-3 px-space-md font-semibold text-right">Due Balance</th>
                <th className="py-3 px-space-md font-semibold">Method</th>
                <th className="py-3 px-space-md font-semibold">Status</th>
                <th className="py-3 px-space-md font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-body text-xs sm:text-sm text-on-surface">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-heading font-bold text-primary tracking-tight">
                        {p.id}
                      </span>
                      <span className="font-heading text-xs text-secondary font-semibold hover:underline cursor-pointer">
                        #{p.bookingId}
                      </span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
                        {p.customerInitials || "SK"}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-heading font-bold text-on-surface">
                          {p.customerName}
                        </span>
                        <span className="font-heading text-xs text-on-surface-variant">
                          {p.customerPhone}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-heading font-semibold text-primary">
                        {p.turfName}
                      </span>
                      <span className="font-heading text-xs text-on-surface-variant">
                        {p.slotTime}
                      </span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md text-right font-heading font-semibold">
                    ${p.totalAmount.toFixed(2)}
                  </td>
                  <td className="py-space-md px-space-md text-right font-heading text-primary font-bold">
                    ${p.receivedAmount.toFixed(2)}
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    {p.dueBalance > 0 ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-heading text-xs font-bold">
                        ${p.dueBalance.toFixed(2)} Due
                      </span>
                    ) : (
                      <span className="text-on-surface-variant text-xs">$0.00</span>
                    )}
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1.5 font-heading text-xs text-on-surface-variant font-medium">
                      <span className="material-symbols-outlined text-base text-secondary">
                        {p.paymentMethod.toLowerCase().includes("upi")
                          ? "qr_code_scanner"
                          : p.paymentMethod.toLowerCase().includes("cash")
                          ? "point_of_sale"
                          : p.paymentMethod.toLowerCase().includes("wire")
                          ? "account_balance"
                          : "credit_card"}
                      </span>
                      <span>{p.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {p.dueBalance > 0 && (
                        <button
                          onClick={() => handleOpenRecordPayment(p)}
                          className="px-3 py-1 rounded-full bg-primary text-on-primary font-heading text-xs font-bold shadow-xs hover:bg-secondary transition-all"
                          type="button"
                        >
                          Collect ${p.dueBalance.toFixed(0)}
                        </button>
                      )}
                      <button
                        onClick={() => alert(`Receipt downloaded for ${p.id}`)}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                        title="Download Receipt"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">receipt</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title={selectedTxn ? `Reconcile ${selectedTxn.id}` : "Record Counter / Online Payment"}
        subtitle="Collect remaining dues or enter offline payment confirmation."
        badge="Counter POS"
      >
        <form onSubmit={handleSavePayment} className="space-y-4">
          {!selectedTxn && (
            <div>
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
                Select Booking ID
              </label>
              <select
                value={recordForm.bookingId}
                onChange={(e) => {
                  const b = bookings.find((item) => item.id === e.target.value);
                  setRecordForm({
                    ...recordForm,
                    bookingId: e.target.value,
                    amountToCollect: b ? b.amount : 110,
                  });
                }}
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    #{b.id} — {b.customerName} ({b.turfName} • ${b.amount})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedTxn && (
            <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between">
              <div>
                <span className="font-heading text-xs text-on-surface-variant uppercase">Customer</span>
                <div className="font-heading font-bold text-on-surface">
                  {selectedTxn.customerName} (#{selectedTxn.bookingId})
                </div>
              </div>
              <div className="text-right">
                <span className="font-heading text-xs text-on-surface-variant uppercase">Due Balance</span>
                <div className="font-heading text-lg font-bold text-error">
                  ${selectedTxn.dueBalance.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
                Amount to Collect ($)
              </label>
              <input
                type="number"
                min="1"
                step="5"
                required
                value={recordForm.amountToCollect}
                onChange={(e) =>
                  setRecordForm({ ...recordForm, amountToCollect: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              />
            </div>
            <div>
              <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
                Payment Channel
              </label>
              <select
                value={recordForm.paymentMethod}
                onChange={(e) =>
                  setRecordForm({ ...recordForm, paymentMethod: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              >
                <option value="Cash at Desk">Cash at Desk (POS)</option>
                <option value="UPI (PhonePe)">UPI (PhonePe / GPay)</option>
                <option value="Card Terminal (Stripe)">Card Terminal (Stripe)</option>
                <option value="Bank Wire">Direct Bank Wire</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-heading text-xs uppercase font-semibold text-on-surface mb-1">
              Transaction Ref / Receipt Note (Optional)
            </label>
            <input
              type="text"
              value={recordForm.refNote}
              onChange={(e) => setRecordForm({ ...recordForm, refNote: e.target.value })}
              placeholder="e.g. Counter Cash receipt #4402 or UPI UTR"
              className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body text-sm outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container/60">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-5 py-2.5 rounded-full text-on-surface-variant hover:text-on-surface font-heading text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-secondary text-on-primary font-heading text-xs font-bold shadow-md hover:opacity-95"
            >
              Confirm Collection
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
