import React from "react";
import { PillVariant } from "./types";

const pillVariants: Record<PillVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  muted: "border-border/80 bg-muted/40 text-muted-foreground",
  danger: "border-destructive/40 bg-destructive/10 text-destructive",
};

export default function StatusPill({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: PillVariant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${pillVariants[variant]}`}
    >
      {children}
    </span>
  );
}
