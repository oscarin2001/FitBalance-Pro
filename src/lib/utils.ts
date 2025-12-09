import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Remove leftover markdown emphasis markers (e.g., trailing **)
 * that come from the AI meal titles before displaying them.
 */
export function stripMarkdownStars(value?: string | null): string {
  if (value == null) return "";
  return value.replace(/\*+/g, "").replace(/\s+/g, " ").trim();
}
