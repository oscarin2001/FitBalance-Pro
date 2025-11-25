"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronDown, ChevronUp } from "lucide-react";

const monthsES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function clampDay(year: number, month: number, day: number) {
  const last = new Date(year, month + 1, 0).getDate();
  return Math.min(day, last);
}

type WheelValue = string | number;

function WheelColumn<T extends WheelValue>({
  values,
  selected,
  onSelect,
  ariaLabel,
}: {
  values: T[];
  selected: T;
  onSelect: (next: T) => void;
  ariaLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemHeight = 44; // px
  const index = values.findIndex((v) => v === selected);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const idx = values.findIndex((v) => v === selected);
    if (idx < 0) return;
    const target = Math.max(0, idx * itemHeight - itemHeight);
    node.scrollTo({ top: target, behavior: "smooth" });
  }, [selected, values, itemHeight]);

  const selectRelative = (delta: number) => {
    const nextIdx = Math.min(Math.max(index + delta, 0), values.length - 1);
    const next = values[nextIdx];
    if (next != null) onSelect(next);
  };

  return (
    <div className="relative flex-1">
      <span className="block text-center text-[11px] uppercase tracking-wide text-muted-foreground mb-1 select-none">
        {ariaLabel}
      </span>
      <button
        type="button"
        aria-label={`Subir ${ariaLabel}`}
        className="absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-full bg-background/90 shadow p-1 border text-muted-foreground hover:text-primary"
        onClick={() => selectRelative(-1)}
        disabled={index <= 0}
      >
        <ChevronUp className="size-4" />
      </button>
      <div className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 rounded-md border border-primary/40 bg-primary/5 h-10" />
      <div
        ref={containerRef}
        className="h-48 overflow-y-auto snap-y snap-mandatory scroll-smooth px-2 pb-4 pt-6"
        aria-label={ariaLabel}
        role="listbox"
      >
        <div className="absolute inset-x-0 top-8 h-8 bg-gradient-to-b from-background via-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-8 h-8 bg-gradient-to-t from-background via-transparent pointer-events-none" />
        {values.map((value) => {
          const isActive = value === selected;
          return (
            <button
              key={String(value)}
              type="button"
              role="option"
              aria-selected={isActive}
              className={`snap-center w-full py-2 rounded-md text-sm transition font-medium ${
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
              onClick={() => onSelect(value)}
            >
              {value}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-label={`Bajar ${ariaLabel}`}
        className="absolute left-1/2 bottom-3 z-10 -translate-x-1/2 rounded-full bg-background/90 shadow p-1 border text-muted-foreground hover:text-primary"
        onClick={() => selectRelative(1)}
        disabled={index >= values.length - 1}
      >
        <ChevronDown className="size-4" />
      </button>
    </div>
  );
}

export function BirthdateWheelPicker({
  value,
  onChange,
  minYear = 1950,
}: {
  value?: Date | null;
  onChange: (next: Date) => void;
  minYear?: number;
}) {
  const today = useMemo(() => new Date(), []);
  const maxYear = today.getFullYear();
  const fallbackYear = Math.max(minYear, maxYear - 20);
  const selectedYear = value?.getFullYear() ?? fallbackYear;
  const selectedMonth = value?.getMonth() ?? 0;
  const selectedDay = value?.getDate() ?? 1;
  const [open, setOpen] = useState(false);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) list.push(y);
    return list;
  }, [minYear, maxYear]);

  const days = useMemo(() => {
    const count = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [selectedMonth, selectedYear]);

  function handleSelect(part: "day" | "month" | "year", raw: WheelValue) {
    let nextYear = selectedYear;
    let nextMonth = selectedMonth;
    let nextDay = selectedDay;
    if (part === "day" && typeof raw === "number") nextDay = raw;
    if (part === "month" && typeof raw === "string") nextMonth = monthsES.indexOf(raw);
    if (part === "year" && typeof raw === "number") nextYear = raw;
    if (nextMonth < 0) nextMonth = 0;
    nextDay = clampDay(nextYear, nextMonth, nextDay);
    const next = new Date(nextYear, nextMonth, nextDay);
    onChange(next);
  }

  const label = value
    ? value.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
    : "Selecciona tu fecha";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-between text-base">
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Selecciona tu fecha</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground mb-3">
          Toca cualquier valor, usa las flechas flotantes o desliza las columnas para ajustar día, mes y año.
        </p>
        <div className="flex gap-3 mt-2">
          <WheelColumn
            ariaLabel="Día"
            values={days}
            selected={Math.min(selectedDay, days[days.length - 1])}
            onSelect={(val) => handleSelect("day", val)}
          />
          <WheelColumn
            ariaLabel="Mes"
            values={monthsES}
            selected={monthsES[selectedMonth]}
            onSelect={(val) => handleSelect("month", val)}
          />
          <WheelColumn
            ariaLabel="Año"
            values={years}
            selected={selectedYear}
            onSelect={(val) => handleSelect("year", val)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BirthdateWheelPicker;
