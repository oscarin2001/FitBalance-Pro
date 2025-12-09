"use client";
import React from "react";

type Props = {
  name?: string | null;
  size?: number;
};

export default function Avatar({ name, size = 32 }: Props) {
  // derive initials from full name or from email local-part
  let initials = "?";
  if (name) {
    const bySpace = name.trim().split(/\s+/);
    if (bySpace.length === 1) {
      initials = bySpace[0].slice(0, 2);
    } else {
      initials = (bySpace[0][0] || "") + (bySpace[1][0] || "");
    }
  }

  initials = initials.slice(0, 2).toUpperCase();

  const numericSize = Number(size) || 32;
  const fontSize = numericSize > 40 ? "text-base" : "text-sm";

  return (
    <div
      style={{ width: numericSize, height: numericSize }}
      className={`inline-flex items-center justify-center rounded-full bg-black text-white ${fontSize} font-semibold`}
      aria-hidden
    >
      {initials}
    </div>
  );
}
