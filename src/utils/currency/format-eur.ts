const BASE_OPTIONS: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
};

const EURO_FORMATTER = new Intl.NumberFormat("es-ES", BASE_OPTIONS);

export function formatEuroFromCents(
  valueInCents: number | null | undefined,
  options?: Intl.NumberFormatOptions
) {
  const normalizedValue =
    typeof valueInCents === "number" && !Number.isNaN(valueInCents)
      ? valueInCents
      : 0;

  if (options) {
    const formatter = new Intl.NumberFormat("es-ES", {
      ...BASE_OPTIONS,
      ...options,
    });
    return formatter.format(normalizedValue / 100);
  }

  return EURO_FORMATTER.format(normalizedValue / 100);
}
