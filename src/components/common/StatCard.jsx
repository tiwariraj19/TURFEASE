import React from "react";

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  badgeText,
  badgeIcon = "trending_up",
  badgeVariant = "positive",
  footer,
  progress,
  className = ""
}) {
  return (
    <div className={`relative overflow-hidden bg-surface-container-low rounded-2xl p-space-lg shadow-sm flex flex-col justify-between hover:-translate-y-0.5 transition-transform duration-200 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="font-heading text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
            {title}
          </span>
          <span className="font-heading text-2xl lg:text-3xl text-on-surface font-bold mt-1">
            {value}
          </span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary shrink-0 shadow-xs">
          {typeof icon === "string" ? (
            <span className="material-symbols-outlined text-2xl">{icon}</span>
          ) : (
            icon
          )}
        </div>
      </div>

      <div className="mt-space-md pt-space-xs flex flex-col gap-1.5">
        {progress !== undefined && (
          <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden my-1">
            <div
              className="bg-primary-container h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-1">
          {subtitle && (
            <span className="font-body text-xs text-on-surface-variant">
              {subtitle}
            </span>
          )}

          {badgeText && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-0.5 ${
                  badgeVariant === "negative"
                    ? "bg-error-container text-on-error-container"
                    : badgeVariant === "neutral"
                    ? "bg-surface-container-high text-on-surface-variant"
                    : "bg-tertiary-fixed text-on-tertiary-fixed"
                }`}
              >
                {badgeIcon && (
                  <span className="material-symbols-outlined text-xs">
                    {badgeIcon}
                  </span>
                )}
                {badgeText}
              </span>
            </div>
          )}
        </div>

        {footer}
      </div>

      {/* Subtle organic ambient glow shape */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-secondary-container/20 pointer-events-none" />
    </div>
  );
}
