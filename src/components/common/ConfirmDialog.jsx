import React from "react";
import { Modal } from "./Modal";

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  confirmVariant = "danger",
  icon = "warning"
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
    >
      <div className="flex items-start gap-3 my-2">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          confirmVariant === "danger"
            ? "bg-error-container text-on-error-container"
            : "bg-secondary-container text-on-secondary-container"
        }`}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <div className="flex-1">
          <p className="font-body text-sm text-on-surface-variant leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-surface-container/60">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 rounded-full text-on-surface-variant hover:text-on-surface font-heading text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-6 py-2 rounded-full font-heading text-sm font-bold shadow-sm transition-all active:scale-95 ${
            confirmVariant === "danger"
              ? "bg-error text-on-error hover:bg-error/90"
              : "bg-gradient-to-r from-primary to-secondary text-on-primary hover:opacity-95"
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
