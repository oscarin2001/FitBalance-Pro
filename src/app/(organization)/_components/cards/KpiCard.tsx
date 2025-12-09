import React from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  helper?: string;
  plain?: boolean;
}

export function KpiCard({ label, value, helper, plain }: KpiCardProps) {
  const containerClass = plain
    ? "p-0"
    : "rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3";

  return (
    <div className={containerClass}>
      {label ? (
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
      ) : null}
      {plain ? (
        <p className="mt-2 text-2xl font-semibold text-card-foreground">
          {value}
        </p>
      ) : (
        <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
      )}
      {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </div>
  );
}
