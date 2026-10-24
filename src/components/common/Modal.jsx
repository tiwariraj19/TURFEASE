import React, { useEffect } from "react";

export function Modal({ isOpen, onClose, title, subtitle, badge, maxWidth = "max-w-2xl", children }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm transition-opacity duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`relative bg-surface-container-lowest rounded-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 flex flex-col justify-between z-10 animate-in fade-in zoom-in-95`}>
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-surface-container/60">
          <div>
            {badge && (
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="font-heading text-xs uppercase tracking-wider text-secondary font-bold">
                  {badge}
                </span>
              </div>
            )}
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-on-surface">
              {title}
            </h2>
            {subtitle && (
              <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
            type="button"
            title="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="my-4">
          {children}
        </div>
      </div>
    </div>
  );
}
