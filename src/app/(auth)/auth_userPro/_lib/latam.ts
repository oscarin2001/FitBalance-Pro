"use client";

export type LatamCountry = { code: string; name: string; prefix: string };

export const LATAM_COUNTRIES: LatamCountry[] = [
  { code: "AR", name: "Argentina", prefix: "54" },
  { code: "BO", name: "Bolivia", prefix: "591" },
  { code: "BR", name: "Brasil", prefix: "55" },
  { code: "CL", name: "Chile", prefix: "56" },
  { code: "CO", name: "Colombia", prefix: "57" },
  { code: "CR", name: "Costa Rica", prefix: "506" },
  { code: "CU", name: "Cuba", prefix: "53" },
  { code: "DO", name: "República Dominicana", prefix: "1" },
  { code: "EC", name: "Ecuador", prefix: "593" },
  { code: "SV", name: "El Salvador", prefix: "503" },
  { code: "GT", name: "Guatemala", prefix: "502" },
  { code: "HN", name: "Honduras", prefix: "504" },
  { code: "MX", name: "México", prefix: "52" },
  { code: "NI", name: "Nicaragua", prefix: "505" },
  { code: "PA", name: "Panamá", prefix: "507" },
  { code: "PY", name: "Paraguay", prefix: "595" },
  { code: "PE", name: "Perú", prefix: "51" },
  { code: "PR", name: "Puerto Rico", prefix: "1" },
  { code: "UY", name: "Uruguay", prefix: "598" },
  { code: "VE", name: "Venezuela", prefix: "58" }
];

export const LATAM_BY_CODE: Record<string, LatamCountry> = Object.fromEntries(
  LATAM_COUNTRIES.map((c) => [c.code, c])
);

export function normalizePhone(code: string, raw: string): string {
  const c = LATAM_BY_CODE[code];
  if (!c) return raw;
  const digits = (raw || "").replace(/\D+/g, "");
  if (!digits) return `+${c.prefix}`;
  if (digits.startsWith(c.prefix)) return `+${digits}`;
  return `+${c.prefix}${digits}`;
}
