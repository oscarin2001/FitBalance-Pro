"use client";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
// Se elimina el modal y gráficas de tendencias; se usa toggle inline
import { Sparkles, Info, MoreHorizontal, ChevronDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar"; // (si luego se vuelve a usar calendario visual)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Objetivos IA
type Objectives = {
  kcal: number | null;
  proteinas: number | null;
  grasas: number | null;
  carbohidratos: number | null;
  agua_litros: number | null;
};

type ProgressForm = {
  fecha: string; // YYYY-MM-DD
  peso_kg?: string;
  grasa_percent?: string;
  musculo_percent?: string;
  agua_percent?: string;
  imc?: string;
  cintura_cm?: string;
  cadera_cm?: string;
  cuello_cm?: string;
  pecho_cm?: string;
  brazo_cm?: string;
  muslo_cm?: string;
  gluteo_cm?: string;
  foto_url?: string;
  notas?: string;
  fuente?: string;
};

type ObjectiveKey = "fat-loss" | "muscle-gain" | "maintenance";

type MeasurementField = keyof Omit<ProgressForm, "fecha" | "notas" | "foto_url" | "fuente" | "imc">;

type FieldMeta = {
  label: string;
  placeholder?: string;
  step?: number;
  help?: string;
  femaleOnly?: boolean;
  maleOnly?: boolean;
};

type MeasurementSection = {
  id: string;
  title: string;
  description?: string;
  fields: MeasurementField[];
  optional?: boolean;
};

const FIELD_META: Record<MeasurementField, FieldMeta> = {
  peso_kg: { label: "Peso (kg)", step: 0.1, placeholder: "Ej. 72.4" },
  grasa_percent: { label: "% Grasa (estimado)", step: 0.1, help: "Se completa al calcular US Navy" },
  musculo_percent: { label: "% Músculo (estimado)", step: 0.1, help: "Se completa al calcular US Navy" },
  agua_percent: { label: "% Agua (estimado)", step: 0.1, help: "Se completa al calcular US Navy" },
  cintura_cm: { label: "Cintura (cm)", step: 0.1, help: "Medido al nivel del ombligo" },
  cadera_cm: { label: "Cadera (cm)", step: 0.1, help: "Punto más amplio de la cadera", femaleOnly: true },
  cuello_cm: { label: "Cuello (cm)", step: 0.1, help: "Justo debajo de la manzana de Adán" },
  pecho_cm: { label: "Pecho (cm)", step: 0.1, help: "Circunferencia pasando por los pectorales" },
  brazo_cm: { label: "Brazo (cm)", step: 0.1, help: "Brazo medio relajado" },
  muslo_cm: { label: "Muslo (cm)", step: 0.1, help: "10 cm por encima de la rodilla" },
  gluteo_cm: { label: "Glúteo (cm)", step: 0.1, help: "Punto más proyectado" },
};

const MEASUREMENT_VALUE_KEYS: MeasurementField[] = [
  "peso_kg",
  "grasa_percent",
  "musculo_percent",
  "agua_percent",
  "cintura_cm",
  "cadera_cm",
  "cuello_cm",
  "pecho_cm",
  "brazo_cm",
  "muslo_cm",
  "gluteo_cm",
];

const OPTIONAL_TEXT_KEYS: Array<keyof ProgressForm> = ["notas", "foto_url", "fuente"];

const ALLOWED_MEASUREMENT_INTERVALS = [1, 2, 3, 4];

const GOAL_SECTIONS: Record<ObjectiveKey, MeasurementSection[]> = {
  "fat-loss": [
    {
      id: "core",
      title: "Indicadores principales",
      description: "Peso y perímetros que usamos para ajustar tu déficit.",
      fields: ["peso_kg", "cintura_cm", "cadera_cm", "cuello_cm"],
    },
    {
      id: "support",
      title: "Medidas de apoyo",
      description: "Opcionales para ver cómo responde tu cuerpo.",
      fields: ["pecho_cm", "muslo_cm", "gluteo_cm"],
      optional: true,
    },
  ],
  "muscle-gain": [
    {
      id: "upper",
      title: "Tren superior",
      description: "Sigue el volumen de pecho, brazo y cuello.",
      fields: ["peso_kg", "pecho_cm", "brazo_cm", "cuello_cm"],
    },
    {
      id: "lower",
      title: "Tren inferior",
      description: "Glúteo y muslo muestran progreso en fuerza.",
      fields: ["cintura_cm", "cadera_cm", "muslo_cm", "gluteo_cm"],
    },
  ],
  maintenance: [
    {
      id: "general",
      title: "Control general",
      description: "Mantén peso y perímetros bajo supervisión ligera.",
      fields: ["peso_kg", "cintura_cm", "cadera_cm", "cuello_cm"],
    },
    {
      id: "opc",
      title: "Circunferencias opcionales",
      description: "Úsalas si quieres más detalle.",
      fields: ["pecho_cm", "brazo_cm", "muslo_cm", "gluteo_cm"],
      optional: true,
    },
  ],
};

const GOAL_COPY: Record<ObjectiveKey, { title: string; bullets: string[] }> = {
  "fat-loss": {
    title: "Enfoque actual: bajar grasa",
    bullets: [
      "Solo peso + cintura + cuello (cadera si aplica) en ayunas.",
      "Apunta breves notas si cambiaste sueño, estrés o sodio.",
    ],
  },
  "muscle-gain": {
    title: "Enfoque actual: ganar músculo",
    bullets: [
      "Mide pecho/brazo tras 48 h sin entrenarlos.",
      "Añade muslo o glúteo cada semana para ver volumen.",
    ],
  },
  maintenance: {
    title: "Enfoque actual: mantenimiento",
    bullets: [
      "Repite peso y cintura cada 2–3 semanas.",
      "Solo agrega notas si ves cambios raros.",
    ],
  },
};

const GOAL_DISPLAY: Record<ObjectiveKey, string> = {
  "fat-loss": "Bajar grasa",
  "muscle-gain": "Ganar músculo",
  maintenance: "Mantenimiento",
};

function formatMeasurementValue(field: MeasurementField, value: string | number | null | undefined) {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  const isNumeric = !Number.isNaN(numeric);
  if (field.endsWith("_percent")) return isNumeric ? `${numeric.toFixed(1)} %` : `${value} %`;
  if (field.endsWith("_kg")) return isNumeric ? `${numeric.toFixed(1)} kg` : `${value}`;
  if (field.endsWith("_cm")) return isNumeric ? `${numeric.toFixed(1)} cm` : `${value}`;
  return String(value);
}

function normalizeObjective(raw?: string | null): ObjectiveKey {
  const value = String(raw || "").toLowerCase();
  if (value.includes("ganar") || value.includes("musculo")) return "muscle-gain";
  if (value.includes("bajar") || value.includes("grasa")) return "fat-loss";
  return "maintenance";
}

type MeasurementGuide = {
  title: string;
  subtitle: string;
  steps: { label: string; detail: string }[];
  reminders: string[];
};

function getMeasurementGuide(goal: ObjectiveKey, isFemale: boolean): MeasurementGuide {
  const commonTools = [
    "Cinta métrica flexible sin resorte",
    "Espejo o cámara frontal para verificar la posición",
    "Mismo punto de apoyo frente a un espejo"
  ];
  if (goal === "muscle-gain") {
    return {
      title: "Cómo medir si estás ganando músculo",
      subtitle: "Realiza las mediciones 48 h después de entrenar el grupo muscular para evitar hinchazón.",
      steps: [
        { label: "Pecho", detail: "Envuelve la cinta a la altura de los pezones, inhalando suavemente." },
        { label: "Brazo", detail: "Brazo relajado, mitad del bícep. Gira la cinta hasta que quede paralela al suelo." },
        { label: "Cuello", detail: "Justo debajo de la manzana de Adán. Mantén la vista al frente." },
        { label: "Muslo", detail: "10 cm por encima de la rodilla. Distribuye el peso por igual." },
        { label: "Glúteo", detail: "Punto más prominente. Mantén pies a la altura de hombros." },
      ],
      reminders: [
        "Usa siempre la misma cinta y registra en el mismo horario.",
        ...(isFemale ? ["Incluye cadera para detectar cambios en tren inferior."] : []),
        ...commonTools,
      ],
    };
  }
  if (goal === "fat-loss") {
    return {
      title: "Cómo medir si estás bajando grasa",
      subtitle: "Registra en ayunas, después de ir al baño y antes de hidratarte para evitar variaciones.",
      steps: [
        { label: "Peso", detail: "Báscula sobre superficie firme, sin ropa ni accesorios." },
        { label: "Cintura", detail: "Cinta al nivel del ombligo, exhala y relaja el abdomen." },
        { label: "Cuello", detail: "Justo debajo de la manzana. Mira al frente." },
        ...(isFemale ? [{ label: "Cadera", detail: "Punto más amplio alrededor de glúteos." }] : []),
      ],
      reminders: [
        "Coloca dos dedos entre la piel y la cinta para evitar comprimir.",
        "Realiza dos lecturas y promedia si hay diferencia.",
        ...commonTools,
      ],
    };
  }
  return {
    title: "Cómo medir para mantenimiento",
    subtitle: "Haz un chequeo completo cada 2–3 semanas para confirmar estabilidad.",
    steps: [
      { label: "Peso", detail: "Mismas condiciones (ayunas, sin ropa)." },
      { label: "Cintura", detail: "Nivel del ombligo, cinta paralela al suelo." },
      ...(isFemale ? [{ label: "Cadera", detail: "Mayor circunferencia de la cadera." }] : []),
      { label: "Cuello", detail: "Justo debajo de la manzana de Adán." },
    ],
    reminders: [
      "Registra notas sobre sueño, estrés y entrenamiento para contextualizar cambios.",
      ...commonTools,
    ],
  };
}

export default function DashboardProgressPage() {
  const [form, setForm] = useState<ProgressForm>(() => ({ fecha: new Date().toISOString().slice(0, 10) }));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastItems, setLastItems] = useState<any[]>([]);
  const [summaryWeek, setSummaryWeek] = useState<any>(null);
  const [summaryMonth, setSummaryMonth] = useState<any>(null);
  const [objectives, setObjectives] = useState<Objectives | null>(null);
  const [measureIntervalWeeks, setMeasureIntervalWeeks] = useState<number>(2);
  const [profile, setProfile] = useState<{ sexo?: string; altura_cm?: number | null; peso_kg?: number | null; objetivo?: string | null; measurement_interval_weeks?: number | null } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [periodWeight, setPeriodWeight] = useState<{ start: number | null; current: number | null; delta: number | null; startDate?: string | null; currentDate?: string | null }>({ start: null, current: null, delta: null, startDate: null, currentDate: null });
  const [nextControl, setNextControl] = useState<{ date: string | null; daysDiff: number | null }>({ date: null, daysDiff: null });
  const [showGuide, setShowGuide] = useState(false);
  const [showDetailedGuide, setShowDetailedGuide] = useState(false);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [pendingIsExisting, setPendingIsExisting] = useState(false);
  const [showDateConfirm, setShowDateConfirm] = useState(false);
  const [historyPdfYear, setHistoryPdfYear] = useState<number | null>(null);
  const [exportingHistoryPdf, setExportingHistoryPdf] = useState(false);
  const [historyYearMenuOpen, setHistoryYearMenuOpen] = useState(false);
  const [historyYearMenuInlineOpen, setHistoryYearMenuInlineOpen] = useState(false);
  const formId = "progress-form";
  const [compositionMode, setCompositionMode] = useState<"navy" | "manual">("manual");
  const [showCalendarHelp, setShowCalendarHelp] = useState(false);
  const [showNavyGuide, setShowNavyGuide] = useState(false);
  const [showCalendarActions, setShowCalendarActions] = useState(false);
  const calendarActionsRef = useRef<HTMLDivElement | null>(null);
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [prefillingForm, setPrefillingForm] = useState(false);
  const [modalSection, setModalSection] = useState<"form" | "history">("form");
  const [activeEntry, setActiveEntry] = useState<any | null>(null);
  const [confirmingDate, setConfirmingDate] = useState(false);
  // Mini calendario
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [calYear, setCalYear] = useState<number>(today.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(today.getMonth() + 1); // 1-12
  const [calData, setCalData] = useState<{ markedDays: string[]; nextControl: string | null; weeks: number }>({ markedDays: [], nextControl: null, weeks: 2 });
  const isFemale = useMemo(() => {
    const sx = (profile?.sexo || "").toLowerCase();
    return sx === "femenino" || sx === "mujer" || sx === "female";
  }, [profile?.sexo]);
  const objectiveKey = useMemo(() => normalizeObjective(profile?.objetivo), [profile?.objetivo]);
  const goalSections = useMemo(() => GOAL_SECTIONS[objectiveKey], [objectiveKey]);
  const goalCopy = GOAL_COPY[objectiveKey];
  const goalLabel = GOAL_DISPLAY[objectiveKey];
  const selectedDateObj = useMemo(() => {
    if (!form.fecha) return null;
    const parsed = new Date(form.fecha + "T00:00:00");
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [form.fecha]);
  const defaultDateForModal = useMemo(() => form.fecha || new Date().toISOString().slice(0, 10), [form.fecha]);
  const formattedDate = useMemo(() => {
    if (!selectedDateObj) return "Selecciona una fecha en el calendario";
    return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "long", year: "numeric" }).format(selectedDateObj);
  }, [selectedDateObj]);
  const measuredDates = useMemo(() => {
    return (calData.markedDays || []).map((d) => {
      const dt = new Date(d + "T00:00:00");
      return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    });
  }, [calData.markedDays]);
  const upcomingSuggestions = useMemo(() => {
    const weeks = Number(calData.weeks || measureIntervalWeeks);
    const anchorStr = calData.nextControl || form.fecha;
    if (!anchorStr || !weeks) return [] as string[];
    const base = new Date(anchorStr + "T00:00:00");
    const list: string[] = [];
    const approxPastDays = 60; // cubrir ~2 meses hacia atrás
    const pastCount = Math.max(2, Math.round(approxPastDays / (weeks * 7)));
    const cappedPastCount = Math.min(pastCount, 6); // evita chips infinitos en intervalos cortos
    for (let i = cappedPastCount; i >= 1; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i * weeks * 7);
      list.push(d.toISOString().slice(0, 10));
    }
    for (let i = 0; i < 4; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i * weeks * 7);
      list.push(d.toISOString().slice(0, 10));
    }
    return list;
  }, [calData.nextControl, calData.weeks, form.fecha, measureIntervalWeeks]);
  const scheduledDates = useMemo(() => {
    return upcomingSuggestions.map((s) => {
      const dt = new Date(s + "T00:00:00");
      return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    });
  }, [upcomingSuggestions]);
  const scheduledIsoSet = useMemo(() => new Set(upcomingSuggestions), [upcomingSuggestions]);
  const calendarMonthDate = useMemo(() => new Date(calYear, calMonth - 1, 1), [calYear, calMonth]);
  const measurementGuide = useMemo(() => getMeasurementGuide(objectiveKey, isFemale), [objectiveKey, isFemale]);
  const quickReminders = useMemo(() => measurementGuide.reminders.slice(0, 2), [measurementGuide.reminders]);
  const extraReminders = useMemo(() => measurementGuide.reminders.slice(2), [measurementGuide.reminders]);
  const nextSuggestedDate = useMemo(() => {
    const upcoming = upcomingSuggestions
      .map((d) => new Date(d + "T00:00:00"))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    return upcoming.find((d) => d.getTime() >= todayDate.getTime()) ?? null;
  }, [upcomingSuggestions, todayDate]);
  const nextSuggestedLabel = useMemo(() => {
    if (!nextSuggestedDate) return null;
    return nextSuggestedDate.toLocaleDateString("es-ES", { day: "2-digit", month: "long" });
  }, [nextSuggestedDate]);
  const compositionFieldHelp = useMemo(() => {
    return compositionMode === "navy"
      ? "Se completa automáticamente cuando usas el cálculo US Navy."
      : "Ingresa aquí el dato que te entrega tu báscula, InBody o DEXA (déjalo en blanco si no lo conoces).";
  }, [compositionMode]);
  const pendingDateLabel = useMemo(() => {
    if (!pendingDate) return null;
    try {
      return new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "2-digit", month: "long" }).format(new Date(pendingDate + "T00:00:00"));
    } catch {
      return pendingDate;
    }
  }, [pendingDate]);
  const pendingDateIsFuture = useMemo(() => {
    if (!pendingDate) return false;
    const candidate = new Date(pendingDate + "T00:00:00");
    return candidate.getTime() > todayDate.getTime();
  }, [pendingDate, todayDate]);
  const historyRows = useMemo(() => {
    if (!Array.isArray(lastItems) || !lastItems.length) return [] as Array<{ entry: any; deltaPeso: number | null }>;
    const ordered = lastItems as Array<any>;
    return ordered.map((entry, idx) => {
      const prev = ordered[idx + 1];
      const peso = entry?.peso_kg != null ? Number(entry.peso_kg) : null;
      const prevPeso = prev?.peso_kg != null ? Number(prev.peso_kg) : null;
      const validPeso = peso != null && !Number.isNaN(peso);
      const validPrev = prevPeso != null && !Number.isNaN(prevPeso);
      const delta = validPeso && validPrev && peso !== null && prevPeso !== null ? Number((peso - prevPeso).toFixed(1)) : null;
      return { entry, deltaPeso: delta };
    });
  }, [lastItems]);

  const selectedHistory = useMemo(() => {
    if (!selectedDateObj) return [] as Array<{ entry: any; deltaPeso: number | null }>;
    const targetYear = selectedDateObj.getFullYear();
    const targetMonth = selectedDateObj.getMonth();
    const targetDay = selectedDateObj.getDate();
    return historyRows.filter(({ entry }) => {
      if (!entry?.fecha) return false;
      const entryDate = new Date(entry.fecha);
      if (Number.isNaN(entryDate.getTime())) return false;
      return (
        entryDate.getFullYear() === targetYear &&
        entryDate.getMonth() === targetMonth &&
        entryDate.getDate() === targetDay
      );
    });
  }, [historyRows, selectedDateObj]);

  const availableHistoryYears = useMemo(() => {
    const years = new Set<number>();
    historyRows.forEach(({ entry }) => {
      if (!entry?.fecha) return;
      const entryDate = new Date(entry.fecha);
      if (Number.isNaN(entryDate.getTime())) return;
      years.add(entryDate.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [historyRows]);

  useEffect(() => {
    if (!availableHistoryYears.length) {
      if (historyPdfYear !== null) setHistoryPdfYear(null);
      return;
    }
    const selectedYear = selectedDateObj?.getFullYear();
    if (selectedYear && availableHistoryYears.includes(selectedYear) && selectedYear !== historyPdfYear) {
      setHistoryPdfYear(selectedYear);
      return;
    }
    if (historyPdfYear == null || !availableHistoryYears.includes(historyPdfYear)) {
      setHistoryPdfYear(availableHistoryYears[0]);
    }
  }, [availableHistoryYears, selectedDateObj, historyPdfYear]);

  useEffect(() => {
    if (!showCalendarActions) return;
    function handleClick(event: MouseEvent) {
      if (!calendarActionsRef.current) return;
      if (calendarActionsRef.current.contains(event.target as Node)) return;
      setShowCalendarActions(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showCalendarActions]);

  const findLocalEntryByDate = useCallback(
    (date: string) => {
      if (!date || !Array.isArray(lastItems)) return null;
      return (
        lastItems.find((entry) => {
          if (!entry?.fecha) return false;
          const iso = new Date(entry.fecha).toISOString().slice(0, 10);
          return iso === date;
        }) ?? null
      );
    },
    [lastItems]
  );

  const fetchEntryByDate = useCallback(async (date: string) => {
    try {
      const res = await fetch(`/api/account/progress?date=${date}`, { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.item) return data.item;
      if (Array.isArray(data?.items) && data.items.length) return data.items[0];
      return null;
    } catch (error) {
      console.error("fetchEntryByDate", error);
      return null;
    }
  }, []);

  const buildFormFromEntry = useCallback((date: string, entry?: any | null) => {
    const next: ProgressForm = { fecha: date };
    if (!entry) return next;
    MEASUREMENT_VALUE_KEYS.forEach((key) => {
      const value = entry?.[key];
      if (value != null && value !== "") {
        next[key] = String(value);
      }
    });
    OPTIONAL_TEXT_KEYS.forEach((key) => {
      if (entry?.[key]) {
        next[key] = entry[key] as string;
      }
    });
    return next;
  }, []);

  const prepareFormForDate = useCallback(
    async (date: string, opts?: { focusSection?: "form" | "history" }) => {
      if (!date) return;
      setPrefillingForm(true);
      setModalSection(opts?.focusSection ?? "form");
      try {
        let entry = findLocalEntryByDate(date);
        if (!entry) entry = await fetchEntryByDate(date);
        const nextForm = buildFormFromEntry(date, entry);
        setForm(nextForm);
        setActiveEntry(entry ?? null);
        setErrors({});
        setShowMeasurementModal(true);
      } catch (error) {
        console.error("prepareFormForDate", error);
        toast.error("No se pudo cargar esa fecha");
      } finally {
        setPrefillingForm(false);
      }
    },
    [buildFormFromEntry, fetchEntryByDate, findLocalEntryByDate]
  );


  const handleGuideOpenChange = (open: boolean) => {
    setShowGuide(open);
    if (!open) setShowDetailedGuide(false);
  };
  const handleDateConfirmChange = (open: boolean) => {
    setShowDateConfirm(open);
    if (!open) setPendingDate(null);
    if (!open) setPendingIsExisting(false);
  };
  const confirmPendingDate = async () => {
    if (!pendingDate) return;
    try {
      setConfirmingDate(true);
      await prepareFormForDate(pendingDate, { focusSection: "form" });
      toast.success(
        pendingIsExisting ? "Listo, puedes editar ese control." : "Fecha asignada, completa tus datos." 
      );
      handleDateConfirmChange(false);
    } finally {
      setConfirmingDate(false);
    }
  };

  const handleCalendarDatePick = (date: Date | undefined) => {
    if (!date) return;
    const iso = date.toISOString().slice(0, 10);
    const alreadyMeasured = (Array.isArray(calData.markedDays) && calData.markedDays.includes(iso)) || form.fecha === iso;
    const isSuggested = scheduledIsoSet.has(iso);
    if (!alreadyMeasured && !isSuggested) {
      toast.error("Esa fecha no coincide con tu frecuencia. Usa una sugerencia o cambia tu plan desde el menú.");
      return;
    }
    setPendingDate(iso);
    setPendingIsExisting(Boolean(alreadyMeasured));
    handleDateConfirmChange(true);
  };

  const ensureJsPdf = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Solo disponible en el navegador"));
        return;
      }
      const w = window as any;
      if (w.jspdf?.jsPDF) {
        resolve();
        return;
      }
      const existing = document.querySelector<HTMLScriptElement>("script[data-fitbalance-jspdf]");
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("No se pudo cargar jsPDF")),
          { once: true }
        );
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
      script.async = true;
      script.dataset.fitbalanceJspdf = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("No se pudo cargar jsPDF"));
      document.head.appendChild(script);
    });
  }, []);

  const renderMeasurementField = (field: MeasurementField, options?: { overrideHelp?: string | null; hideHelp?: boolean }) => {
    const meta = FIELD_META[field];
    if (!meta) return null;
    if (meta.femaleOnly && !isFemale) return null;
    if (meta.maleOnly && isFemale) return null;
    const value = form[field] || "";
    const helpText = options?.hideHelp ? null : options?.overrideHelp ?? meta.help;
    return (
      <div key={field}>
        <Label htmlFor={field}>{meta.label}</Label>
        <Input
          id={field}
          type="number"
          step={meta.step ?? 0.1}
          value={value}
          placeholder={meta.placeholder}
          onChange={(e) => onChange(field, e.target.value)}
          className={errors[field as string] ? "border-red-500 focus-visible:ring-red-500" : undefined}
        />
        {helpText && <p className="text-[11px] text-muted-foreground mt-1">{helpText}</p>}
        {errors[field as string] && <p className="text-xs text-red-500 mt-1">{errors[field as string]}</p>}
      </div>
    );
  };

  function onChange(name: keyof ProgressForm, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  // Cargar datos de calendario del backend
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/account/progress/calendar?year=${calYear}&month=${calMonth}`, { cache: "no-store" });
        if (!res.ok) throw new Error("calendar");
        const j = await res.json();
        setCalData({ markedDays: Array.isArray(j.markedDays) ? j.markedDays : [], nextControl: j.nextControl ?? null, weeks: j.weeks ?? 2 });
      } catch {
        setCalData({ markedDays: [], nextControl: null, weeks: 2 });
      }
    })();
  }, [calYear, calMonth]);

  function deltaClass(delta: number | null): string {
    if (delta == null || !profile) return "";
    const obj = String(profile.objetivo || "");
    const nearZero = Math.abs(delta) < 0.2; // ~200 g margen
    if (nearZero) return "text-amber-600"; // mantenimiento ~ amarillo
    if (obj === "Bajar_grasa") return delta < 0 ? "text-green-600" : "text-red-600";
    if (obj === "Ganar_musculo") return delta > 0 ? "text-green-600" : "text-red-600";
    // Mantenimiento: cerca de 0 es bueno; desvíos grandes en rojo
    if (obj === "Mantenimiento") return Math.abs(delta) <= 0.5 ? "text-green-600" : "text-red-600";
    // Sin objetivo: solo verde si baja algo, rojo si sube
    return delta < 0 ? "text-green-600" : "text-red-600";
  }

  function estimateBodyFat() {
    try {
      const sexo = (profile?.sexo || "").toLowerCase();
      const h_cm = Number(profile?.altura_cm);
      const cuello = Number(form.cuello_cm);
      const cintura = Number(form.cintura_cm);
      const cadera = Number(form.cadera_cm);
      const isFemale = sexo === "femenino" || sexo === "mujer" || sexo === "female";
      const newErrors: Record<string, string> = {};
      if (!h_cm) newErrors["altura_cm"] = "Altura requerida para estimar";
      if (!cuello) newErrors["cuello_cm"] = "Campo requerido";
      if (!cintura) newErrors["cintura_cm"] = "Campo requerido";
      if (isFemale && !cadera) newErrors["cadera_cm"] = "Requerida en mujeres";
      if (Object.keys(newErrors).length) {
        setErrors((prev) => ({ ...prev, ...newErrors }));
        toast.error("Faltan datos para estimar %grasa");
        return;
      }
      const toIn = (cm: number) => cm / 2.54;
      const log10 = (x: number) => Math.log10(x);
      const H = toIn(h_cm);
      const Neck = toIn(cuello);
      const Waist = toIn(cintura);
      const Hip = toIn(cadera || 0);
      let bf: number;
      if (sexo === "femenino" || sexo === "mujer" || sexo === "female") {
        bf = 163.205 * log10(Waist + Hip - Neck) - 97.684 * log10(H) - 78.387;
      } else {
        bf = 86.010 * log10(Waist - Neck) - 70.041 * log10(H) + 36.76;
      }
      const bfClamped = Math.max(3, Math.min(60, Number(bf.toFixed(1))));
      // Derivaciones: FFM, Agua, Músculo (porcentajes)
      const peso = Number((form.peso_kg ?? profile?.peso_kg) || 0);
      let aguaPct: number | undefined;
      let muscPct: number | undefined;
      if (peso > 0) {
        const fatMass = (peso * bfClamped) / 100; // kg
        const ffm = peso - fatMass; // kg
        const waterKg = ffm * 0.73; // kg
        const muscleKg = ffm * 0.52; // kg aprox músculo esquelético
        aguaPct = Number(((waterKg / peso) * 100).toFixed(1));
        muscPct = Number(((muscleKg / peso) * 100).toFixed(1));
      }
      setForm((prev) => ({
        ...prev,
        grasa_percent: String(bfClamped),
        ...(aguaPct !== undefined ? { agua_percent: String(aguaPct) } : {}),
        ...(muscPct !== undefined ? { musculo_percent: String(muscPct) } : {}),
      }));
      toast.success("%Grasa estimado actualizado");
    } catch {
      toast.error("No se pudo estimar %grasa");
    }
  }

  const downloadHistoryPdf = useCallback(async () => {
    if (!historyPdfYear) {
      toast.error("Selecciona un año con registros para exportar");
      return;
    }
    const entriesForYear = historyRows
      .map(({ entry }) => entry)
      .filter((entry) => {
        if (!entry?.fecha) return false;
        const entryDate = new Date(entry.fecha);
        if (Number.isNaN(entryDate.getTime())) return false;
        return entryDate.getFullYear() === historyPdfYear;
      });
    if (!entriesForYear.length) {
      toast.error("No hay mediciones guardadas para ese año");
      return;
    }
    setExportingHistoryPdf(true);
    try {
      await ensureJsPdf();
      const jsPDF = (window as any).jspdf?.jsPDF;
      if (!jsPDF) throw new Error("jsPDF no disponible");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 42;
      const usableWidth = pageWidth - margin * 2;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("FitBalance · Historial de mediciones", margin, margin);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100);
      const now = new Date();
      doc.text(`Generado: ${now.toLocaleString("es-ES")}`, margin, margin + 14);
      const freqLabel = measureIntervalWeeks
        ? `Frecuencia configurada: cada ${measureIntervalWeeks} semanas`
        : "Frecuencia configurada: no disponible";
      doc.text(freqLabel, margin, margin + 28);
      doc.text(`Año: ${historyPdfYear}`, margin, margin + 42);
      if (goalLabel) {
        doc.text(`Objetivo activo: ${goalLabel}`, margin, margin + 56);
      }

      doc.setTextColor(0);
      let cursorY = margin + (goalLabel ? 74 : 60);
      const sortedEntries = entriesForYear
        .slice()
        .sort((a, b) => {
          const aDate = new Date(a.fecha).getTime();
          const bDate = new Date(b.fecha).getTime();
          return aDate - bDate;
        });

      sortedEntries.forEach((entry, idx) => {
        if (cursorY > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }
        const entryDate = entry?.fecha ? new Date(entry.fecha) : null;
        const dateLabel = entryDate
          ? entryDate.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })
          : "Fecha sin definir";
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(dateLabel, margin, cursorY);
        cursorY += 16;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const summaryParts: string[] = [];
        if (entry?.peso_kg != null && !Number.isNaN(Number(entry.peso_kg))) {
          summaryParts.push(`Peso: ${Number(entry.peso_kg).toFixed(1)} kg`);
        }
        if (entry?.imc != null && !Number.isNaN(Number(entry.imc))) {
          summaryParts.push(`IMC: ${Number(entry.imc).toFixed(1)}`);
        }
        if (entry?.grasa_percent != null && !Number.isNaN(Number(entry.grasa_percent))) {
          summaryParts.push(`% grasa: ${Number(entry.grasa_percent).toFixed(1)} %`);
        }
        if (summaryParts.length) {
          const summaryLines = doc.splitTextToSize(summaryParts.join(" • "), usableWidth);
          summaryLines.forEach((line: string) => {
            if (cursorY > pageHeight - margin) {
              doc.addPage();
              cursorY = margin;
            }
            doc.text(line, margin, cursorY);
            cursorY += 12;
          });
          cursorY += 4;
        }

        const measurementDetails = MEASUREMENT_VALUE_KEYS.reduce<Array<{ label: string; value: string }>>((acc, field) => {
          const meta = FIELD_META[field];
          if (meta?.femaleOnly && !isFemale) return acc;
          if (meta?.maleOnly && isFemale) return acc;
          const formatted = formatMeasurementValue(field, entry?.[field]);
          if (!formatted) return acc;
          acc.push({ label: meta?.label ?? field, value: formatted });
          return acc;
        }, []);

        if (measurementDetails.length) {
          const rowHeight = 22;
          const labelX = margin + 12;
          const valueX = margin + usableWidth * 0.55;
          measurementDetails.forEach((detail, rowIndex) => {
            if (cursorY > pageHeight - margin - rowHeight) {
              doc.addPage();
              cursorY = margin;
            }
            if (rowIndex % 2 === 0) {
              doc.setFillColor(248, 249, 252);
              doc.rect(margin, cursorY - 10, usableWidth, rowHeight, "F");
            }
            doc.setFont("helvetica", "bold");
            doc.text(detail.label, labelX, cursorY + 2);
            doc.setFont("helvetica", "normal");
            doc.text(detail.value, valueX, cursorY + 2);
            cursorY += rowHeight;
          });
          doc.setDrawColor(230);
          doc.line(margin, cursorY - 6, pageWidth - margin, cursorY - 6);
          cursorY += 8;
        } else {
          if (cursorY > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
          }
          doc.text("Sin mediciones detalladas para este día.", margin + 16, cursorY);
          cursorY += 12;
        }

        if (entry?.notas || entry?.fuente) {
          const noteLines: string[] = [];
          if (entry?.notas) noteLines.push(`Notas: ${entry.notas}`);
          if (entry?.fuente) noteLines.push(`Fuente: ${entry.fuente}`);
          noteLines.forEach((note) => {
            const wrapped = doc.splitTextToSize(note, usableWidth - 16);
            wrapped.forEach((chunk: string) => {
              if (cursorY > pageHeight - margin) {
                doc.addPage();
                cursorY = margin;
              }
              doc.text(chunk, margin + 16, cursorY);
              cursorY += 12;
            });
          });
          cursorY += 4;
        }

        if (idx < sortedEntries.length - 1) {
          if (cursorY > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
          }
          doc.setDrawColor(220);
          doc.line(margin, cursorY, pageWidth - margin, cursorY);
          cursorY += 16;
        }
      });

      const filename = `Historial-FitBalance-${historyPdfYear}.pdf`;
      doc.save(filename);
      toast.success(`PDF listo para ${historyPdfYear}`);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo generar el PDF");
    } finally {
      setExportingHistoryPdf(false);
    }
  }, [ensureJsPdf, goalLabel, historyPdfYear, historyRows, isFemale, measureIntervalWeeks]);

  // Campo de foto eliminado temporalmente; si se reactiva, restaurar uploadPhoto()

  async function loadData() {
    try {
      setLoading(true);
      const [itemsRes, weekRes, monthRes, objRes, profRes] = await Promise.all([
        fetch(`/api/account/progress?limit=90`),
        fetch(`/api/account/progress/summary?window=week&ending=${form.fecha}`),
        fetch(`/api/account/progress/summary?window=month&ending=${form.fecha}`),
        fetch(`/api/account/dashboard/summary`, { cache: "no-store" }),
        fetch(`/api/account/profile/basic`, { cache: "no-store" }),
      ]);
      const itemsJson = await itemsRes.json();
      const weekJson = await weekRes.json();
      const monthJson = await monthRes.json();
      const objJson = await objRes.json();
      const profJson = await profRes.json();
      setLastItems(itemsJson.items || []);
      setSummaryWeek(weekJson);
      setSummaryMonth(monthJson);
      setObjectives(objJson?.objetivos ?? null);
      let prof = profJson?.profile ?? null;
      // Fallback: si /basic falla o no trae datos, intenta /api/account/profile
      if (!prof) {
        try {
          const profFullRes = await fetch(`/api/account/profile`, { cache: "no-store" });
          if (profFullRes.ok) {
            const full = await profFullRes.json();
            const u = full?.user;
            if (u) {
              prof = {
                sexo: u.sexo,
                altura_cm: u.altura_cm,
                peso_kg: u.peso_kg,
                objetivo: u.objetivo,
                measurement_interval_weeks: u.measurement_interval_weeks ?? null,
              };
            }
          }
        } catch {}
      }
      setProfile(prof);
      let dbWeeks = Number(prof?.measurement_interval_weeks);
      if (!(dbWeeks && ALLOWED_MEASUREMENT_INTERVALS.includes(dbWeeks))) {
        try {
          const mi = await fetch(`/api/account/profile/measurement-interval`, { cache: "no-store" });
          if (mi.ok) {
            const mij = await mi.json();
            const alt = Number(mij?.weeks);
            if (alt && ALLOWED_MEASUREMENT_INTERVALS.includes(alt)) dbWeeks = alt;
          }
        } catch {}
      }
      if (dbWeeks && ALLOWED_MEASUREMENT_INTERVALS.includes(dbWeeks)) setMeasureIntervalWeeks(dbWeeks);

      // Autorrellenar peso desde último registro o perfil
      const last = Array.isArray(itemsJson.items) && itemsJson.items.length ? itemsJson.items[0] : null;
      const peso = last?.peso_kg ?? profJson?.profile?.peso_kg ?? "";
      setForm((prev) => {
        if (prev.peso_kg) return prev;
        return { ...prev, peso_kg: peso ? String(peso) : prev.peso_kg };
      });
    } catch (e) {
      console.error(e);
      toast.error("No se pudo cargar el progreso");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.fecha]);

  // Peso del período desde backend
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/account/progress/period?ending=${form.fecha}`, { cache: "no-store" });
        if (!res.ok) throw new Error("period");
        const j = await res.json();
        setPeriodWeight({
          start: j.start ?? null,
          current: j.current ?? null,
          delta: j.delta ?? null,
          startDate: j.startDate ?? null,
          currentDate: j.currentDate ?? null,
        });
        // si el backend retorna weeks distintos, reflejar en UI
        if (j.weeks && ALLOWED_MEASUREMENT_INTERVALS.includes(Number(j.weeks))) setMeasureIntervalWeeks(Number(j.weeks));
      } catch {
        setPeriodWeight({ start: null, current: null, delta: null, startDate: null, currentDate: null });
      }
    })();
  }, [form.fecha]);

  // Próximo control: derivado de la data del calendario (backend)
  useEffect(() => {
    try {
      if (!calData.nextControl) {
        setNextControl({ date: null, daysDiff: null });
        return;
      }
      const next = new Date(calData.nextControl + "T00:00:00");
      const today = new Date(new Date().toISOString().slice(0,10));
      const days = Math.ceil((next.getTime() - today.getTime()) / (1000*60*60*24));
      setNextControl({ date: calData.nextControl, daysDiff: days });
    } catch {
      setNextControl({ date: null, daysDiff: null });
    }
  }, [calData.nextControl]);

  // Eliminadas series y métricas de tendencias para vista simplificada

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Validar intervalo mínimo entre mediciones (2–4 semanas según preferencia)
      if (Array.isArray(lastItems) && lastItems.length) {
        const lastDate = new Date(lastItems[0].fecha);
        const currentDate = new Date(form.fecha);
        const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        const minDays = measureIntervalWeeks * 7;
        const isForwardMeasurement = !Number.isNaN(diffDays) && diffDays >= 0;
        if (isForwardMeasurement && diffDays < minDays) {
          toast.error(`Debes esperar al menos ${measureIntervalWeeks} semanas entre mediciones.`);
          setSaving(false);
          return;
        }
      }
      // Validaciones US Navy solamente
      const errs: Record<string, string> = {};
      if (!form.fecha) errs["fecha"] = "Fecha obligatoria";
      const peso = Number(form.peso_kg ?? profile?.peso_kg ?? NaN);
      if (!peso || isNaN(peso)) errs["peso_kg"] = "Peso obligatorio";
      else if (peso < 20 || peso > 350) errs["peso_kg"] = "Rango 20–350 kg";

      const s = (profile?.sexo || "").toLowerCase();
      const isFemale = s === "femenino" || s === "mujer" || s === "female";
      const numRange = (val: string | undefined, min: number, max: number) => {
        if (val == null || val === "") return "Campo requerido";
        const n = Number(val);
        if (isNaN(n)) return "Valor inválido";
        if (n < min || n > max) return `Rango ${min}–${max}`;
        return null;
      };
      const cinturaMsg = numRange(form.cintura_cm, 40, 200);
      if (cinturaMsg) errs["cintura_cm"] = cinturaMsg;
      const cuelloMsg = numRange(form.cuello_cm, 25, 60);
      if (cuelloMsg) errs["cuello_cm"] = cuelloMsg;
      if (isFemale) {
        const caderaMsg = numRange(form.cadera_cm, 60, 200);
        if (caderaMsg) errs["cadera_cm"] = caderaMsg;
      }
      if (Object.keys(errs).length) {
        setErrors(errs);
        toast.error("Revisa los campos marcados");
        setSaving(false);
        return;
      }
      // Calcular IMC si hay peso y altura en perfil
      let imcVal: number | undefined = undefined;
      const pesoN = Number(form.peso_kg ?? profile?.peso_kg ?? NaN);
      const altura_m = profile?.altura_cm ? Number(profile.altura_cm) / 100 : undefined;
      if (pesoN && altura_m) {
        imcVal = Number((pesoN / (altura_m * altura_m)).toFixed(1));
      }

      const res = await fetch("/api/account/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imc: imcVal }),
      });
      if (!res.ok) throw new Error("error");
      toast.success("Progreso guardado");
      await loadData();
      setShowMeasurementModal(false);
    } catch (e) {
      toast.error("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Toaster />
      <Dialog open={showGuide} onOpenChange={handleGuideOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4" />
              {measurementGuide.title}
            </DialogTitle>
            <DialogDescription>
              {measurementGuide.subtitle}
              <span className="block text-xs text-muted-foreground mt-1">Objetivo activo: {goalLabel}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm overflow-y-auto pr-1 flex-1">
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Checklist rápido</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                {quickReminders.map((reminder) => (
                  <li key={reminder}>{reminder}</li>
                ))}
              </ul>
            </div>
            {!showDetailedGuide && (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {measurementGuide.steps.map((step) => (
                  <span key={step.label} className="rounded-full border px-3 py-1 bg-background">
                    {step.label}
                  </span>
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-center"
              onClick={() => setShowDetailedGuide((v) => !v)}
            >
              {showDetailedGuide ? "Ocultar pasos específicos" : "Ver pasos específicos"}
            </Button>
            {showDetailedGuide && (
              <div className="space-y-4 animate-in fade-in-0">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Pasos clave</p>
                  <ul className="space-y-2">
                    {measurementGuide.steps.map((step) => (
                      <li key={step.label} className="rounded-lg border bg-muted/40 p-3">
                        <p className="font-medium text-foreground">{step.label}</p>
                        <p className="text-muted-foreground text-sm leading-snug">{step.detail}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                {extraReminders.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Recordatorios extra</p>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      {extraReminders.map((reminder) => (
                        <li key={reminder}>{reminder}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          <Button type="button" onClick={() => handleGuideOpenChange(false)} className="mt-4 w-full" variant="secondary">
            Listo
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={showNavyGuide} onOpenChange={setShowNavyGuide}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4" />
              Cómo calculamos tu composición
            </DialogTitle>
            <DialogDescription>
              Método US Navy con cinta métrica. Ajusta tus datos para mayor precisión.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-sm text-muted-foreground">
            <p>
              Requerimos: hombres (cintura + cuello + altura), mujeres (cintura + cadera + cuello + altura).
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>% grasa corporal estimado por ecuación validada por la Marina de EE.UU.</li>
              <li>Agua y músculo se derivan de la masa libre de grasa: agua ≈ FFM×0.73, músculo ≈ FFM×0.52.</li>
              <li>Precisión típica: ±3–4 pp con medición consistente (hasta ±5–6 si varía la técnica).</li>
              <li>Mide siempre a la misma hora, tras ir al baño, sin bombeo, y repite en el mismo punto.</li>
            </ul>
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
              <p className="font-medium text-foreground">Consejos rápidos</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>La fórmula es sensible a la tensión de la cinta: usa presión ligera y promedia 2–3 lecturas.</li>
                <li>No te obsesiones con un único día; revisa tendencias semanales.</li>
                <li>Si cambias horario o hidratación, la variación aumenta.</li>
                <li>Combina las métricas con fotos y rendimiento para una visión completa.</li>
              </ul>
            </div>
          </div>
          <Button type="button" onClick={() => setShowNavyGuide(false)} className="mt-4 w-full" variant="secondary">
            Entendido
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={showCalendarHelp} onOpenChange={setShowCalendarHelp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Cómo funciona el calendario?</DialogTitle>
            <DialogDescription>
              Frecuencia configurada: cada {measureIntervalWeeks || 2} semanas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              1. Toca cualquier fecha disponible y confirma en el modal para cargarla en el formulario.
            </p>
            <p>
              2. Marcamos en verde tus mediciones registradas y en ámbar las sugerencias según tu intervalo.
            </p>
            <p>
              3. Una vez confirmada la fecha, recalculamos automáticamente la próxima medición estimada.
            </p>
            <p>
              No se permiten fechas futuras; si necesitas modificar un registro previo, selecciona la misma fecha y vuelve a guardar los datos.
            </p>
            <p>
              ¿Quieres otra cadencia? Toca los tres puntos junto al título "Calendario de controles" y cambia el plan de frecuencia desde ahí.
            </p>
          </div>
          <Button type="button" className="mt-4 w-full" variant="secondary" onClick={() => setShowCalendarHelp(false)}>
            Entendido
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={showDateConfirm} onOpenChange={handleDateConfirmChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingIsExisting
                ? "Ya registraste ese día"
                : pendingDateIsFuture
                ? "¿Usar esta fecha para tu control?"
                : "Registrar control en esta fecha"}
            </DialogTitle>
            <DialogDescription>
              {pendingDateLabel
                ? pendingIsExisting
                  ? `El ${pendingDateLabel} ya tiene un control guardado. Puedes editarlo si confirmas.`
                  : pendingDateIsFuture
                  ? `Programaremos el ${pendingDateLabel}.`
                  : `Registraremos el control del ${pendingDateLabel}.`
                : "Selecciona una fecha del calendario."}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {pendingIsExisting
              ? "Al confirmar volveremos a usar esa fecha para que puedas actualizar o corregir el registro existente."
              : pendingDateIsFuture
              ? `Confirmar la fecha la llenará en el formulario y recalculará la próxima sugerencia (${measureIntervalWeeks} semanas después).`
              : "Usaremos esa fecha en el formulario para que cargues o ajustes un control pasado."}
          </p>
          <div className="flex flex-wrap gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => handleDateConfirmChange(false)}>
              Cancelar
            </Button>
            <Button type="button" className="flex-1" onClick={confirmPendingDate} disabled={!pendingDate || confirmingDate}>
              {pendingIsExisting ? "Editar esa fecha" : pendingDateIsFuture ? "Usar esta fecha" : "Registrar en esta fecha"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={showMeasurementModal}
        onOpenChange={(open) => {
          setShowMeasurementModal(open);
          if (!open) {
            setModalSection("form");
            setActiveEntry(null);
            setPrefillingForm(false);
          }
        }}
      >
        <DialogContent
          className="sm:max-w-[1000px] w-full h-[calc(100svh-2rem)] sm:h-auto max-h-[calc(100svh-2rem)] sm:max-h-[90vh] p-0 flex flex-col overflow-hidden rounded-none sm:rounded-xl top-0 translate-y-0 sm:top-1/2 sm:translate-y-[-50%]"
        >
          <div className="relative flex h-full flex-1 flex-col">
            {prefillingForm && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 text-sm font-medium">
                Cargando datos de esa fecha...
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="mx-auto h-1.5 w-16 rounded-full bg-muted" aria-hidden />
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center justify-between gap-2">
                  <span>{activeEntry ? "Editar control corporal" : "Registrar un nuevo control"}</span>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                    Fecha seleccionada · {formattedDate}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  {goalCopy?.title || "Completa tus mediciones para este día."}
                  <span className="block text-xs text-muted-foreground mt-1">
                    Objetivo activo: {goalLabel}. Frecuencia: cada {measureIntervalWeeks || 2} semanas.
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={modalSection === "form" ? "default" : "outline"}
                  onClick={() => setModalSection("form")}
                >
                  Mediciones
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={modalSection === "history" ? "default" : "outline"}
                  onClick={() => setModalSection("history")}
                >
                  Historial
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="inline-flex items-center gap-1"
                  onClick={() => {
                    setShowDetailedGuide(false);
                    setShowGuide(true);
                  }}
                >
                  <Info className="h-4 w-4" /> Guía rápida
                </Button>
              </div>
              <div className="grid h-full min-h-0 overflow-hidden gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className={cn("space-y-4 overflow-y-auto pr-1 min-h-0", modalSection !== "form" ? "hidden md:block" : "") }>
                  <form id={formId} className="space-y-4" onSubmit={onSubmit}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Registrar medición</CardTitle>
                        <CardDescription>Completa tus medidas y notas del día seleccionado.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {goalCopy && (
                          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                            <p className="font-medium text-foreground">{goalCopy.title}</p>
                            <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
                              {goalCopy.bullets.map((tip) => (
                                <li key={tip}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="space-y-4">
                          {goalSections.map((section) => {
                            const fields = section.fields.filter((field) => {
                              const meta = FIELD_META[field];
                              if (!meta) return false;
                              if (meta.femaleOnly && !isFemale) return false;
                              if (meta.maleOnly && isFemale) return false;
                              return true;
                            });
                            if (!fields.length) return null;
                            return (
                              <div key={section.id} className="rounded-lg border p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-medium">{section.title}</p>
                                    {section.description && <p className="text-xs text-muted-foreground mt-1">{section.description}</p>}
                                  </div>
                                  {section.optional && <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Opcional</span>}
                                </div>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {fields.map((field) => renderMeasurementField(field))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div>
                          <Label>Notas</Label>
                          <textarea
                            className="w-full border rounded-md p-2 text-sm"
                            rows={3}
                            value={form.notas || ""}
                            onChange={(e) => onChange("notas", e.target.value)}
                            placeholder="Entrenamiento, energía, lesiones, etc."
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end border-t pt-4">
                        <Button type="submit" disabled={saving} className="font-semibold">
                          {saving ? "Guardando..." : "Guardar"}
                        </Button>
                      </CardFooter>
                    </Card>

                    <Card className="border-dashed">
                      <CardHeader className="space-y-2">
                        <CardTitle className="text-base">Composición corporal</CardTitle>
                        <CardDescription>Elige cómo quieres completar %grasa, %músculo y %agua.</CardDescription>
                        <button
                          type="button"
                          onClick={() => setShowNavyGuide(true)}
                          className={cn(
                            "inline-flex items-center gap-1 text-sm font-medium text-muted-foreground",
                            "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          )}
                        >
                          <Info className="h-4 w-4" />
                          Guía US Navy
                        </button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={compositionMode === "navy" ? "default" : "outline"}
                            onClick={() => setCompositionMode("navy")}
                            className="w-full"
                          >
                            Usar método US Navy
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={compositionMode === "manual" ? "default" : "outline"}
                            onClick={() => setCompositionMode("manual")}
                            className="w-full"
                          >
                            Ingresar manual
                          </Button>
                        </div>

                        {compositionMode === "navy" ? (
                          <>
                            <p className="text-sm text-muted-foreground">
                              Ten a mano cinta métrica para cintura, cuello {isFemale ? "y cadera" : ""}. Al calcular rellenaremos los porcentajes y luego podrás ajustarlos.
                            </p>
                          </>
                        ) : (
                          <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                            <p className="font-medium text-foreground">Modo manual</p>
                            <p>Usa resultados de una báscula inteligente, InBody o DEXA y escríbelos directamente.</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {renderMeasurementField("grasa_percent", { overrideHelp: compositionFieldHelp })}
                          {renderMeasurementField("musculo_percent", { overrideHelp: compositionFieldHelp })}
                          {renderMeasurementField("agua_percent", { overrideHelp: compositionFieldHelp })}
                        </div>

                        {compositionMode === "navy" ? (
                          <div className="space-y-2">
                            <Button size="sm" type="button" variant="secondary" className="w-full md:w-auto" onClick={estimateBodyFat}>
                              Calcular ahora
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              Tip: repite 2 veces las mediciones de cinta y promedia para reducir el error.
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Puedes volver al método US Navy cuando quieras para comparar contra tus valores manuales.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </form>
                </div>
                <div className={cn("space-y-4 overflow-y-auto pr-1 min-h-0", modalSection !== "history" ? "hidden md:block" : "") }>
                  <Card>
                    <CardHeader>
                      <CardTitle>Contexto rápido</CardTitle>
                      <CardDescription>Recordatorios adaptados a tu sexo y objetivo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <p>
                        {isFemale ? "Plan femenino" : "Plan masculino"} enfocado en {goalLabel.toLowerCase()}.
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        {quickReminders.slice(0, 3).map((reminder) => (
                          <li key={reminder}>{reminder}</li>
                        ))}
                      </ul>
                      <p className="text-xs">
                        Selecciona otra fecha desde el calendario para cambiar de día.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle>Historial completo</CardTitle>
                        <CardDescription>Mira cada medición guardada y elige cuál quieres editar.</CardDescription>
                      </div>
                      <div className="flex flex-col items-start gap-1 sm:items-end">
                        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Fecha seleccionada</span>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                          {formattedDate}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {availableHistoryYears.length > 0 && (
                        <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground space-y-2">
                          <div className="flex flex-col gap-1 text-left sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold text-foreground text-sm">Descargar PDF por año</p>
                              <p>Se respeta tu frecuencia configurada.</p>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <Popover open={historyYearMenuOpen} onOpenChange={setHistoryYearMenuOpen}>
                                <PopoverTrigger asChild>
                                  <Button type="button" size="sm" variant="outline" className="w-full justify-between text-xs sm:w-40">
                                    <span>{historyPdfYear ?? availableHistoryYears[0]}</span>
                                    <ChevronDown className="h-4 w-4 opacity-70" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-48 p-1">
                                  <div className="flex flex-col">
                                    {availableHistoryYears.map((year) => {
                                      const isActive = historyPdfYear === year;
                                      return (
                                        <button
                                          key={year}
                                          type="button"
                                          className={cn(
                                            "flex items-center justify-between rounded-md px-3 py-2 text-sm transition",
                                            isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                          )}
                                          onClick={() => {
                                            setHistoryPdfYear(year);
                                            setHistoryYearMenuOpen(false);
                                          }}
                                        >
                                          <span>{year}</span>
                                          {isActive && <span className="text-[11px] uppercase">Activo</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <Button
                                type="button"
                                size="sm"
                                variant="default"
                                onClick={downloadHistoryPdf}
                                disabled={exportingHistoryPdf}
                              >
                                {exportingHistoryPdf ? "Generando…" : "Descargar"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedHistory.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Aún no tienes mediciones guardadas para esta fecha. Guarda el formulario para crear el primer registro.
                        </p>
                      )}
                      {selectedHistory.map(({ entry, deltaPeso }, idx) => {
                        const entryDate = entry?.fecha ? new Date(entry.fecha) : null;
                        const entryDateIso = entryDate ? entryDate.toISOString().slice(0, 10) : null;
                        const dateStr = entryDate
                          ? entryDate.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
                          : "—";
                        const peso = entry?.peso_kg != null && !Number.isNaN(Number(entry.peso_kg)) ? `${Number(entry.peso_kg).toFixed(1)} kg` : "—";
                        const measurementDetails = MEASUREMENT_VALUE_KEYS.reduce<Array<{ label: string; value: string; field: MeasurementField }>>((acc, field) => {
                          const meta = FIELD_META[field];
                          if (meta?.femaleOnly && !isFemale) return acc;
                          if (meta?.maleOnly && isFemale) return acc;
                          const formatted = formatMeasurementValue(field, entry?.[field]);
                          if (!formatted) return acc;
                          acc.push({ label: meta?.label || field, value: formatted, field });
                          return acc;
                        }, []);
                        const compositionFields: MeasurementField[] = ["grasa_percent", "musculo_percent", "agua_percent"];
                        const compositionDetails = measurementDetails.filter((detail) => compositionFields.includes(detail.field));
                        const perimeterDetails = measurementDetails.filter((detail) => !compositionFields.includes(detail.field));
                        return (
                          <div key={entry?.id ?? entry?.fecha ?? idx} className="rounded-lg border p-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold">{dateStr}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-2">
                                  <span>Peso {peso}</span>
                                  {deltaPeso != null && (
                                    <span
                                      className={cn(
                                        "font-semibold",
                                        deltaPeso === 0
                                          ? "text-amber-600"
                                          : deltaPeso < 0
                                          ? "text-emerald-600"
                                          : "text-red-600"
                                      )}
                                    >
                                      {deltaPeso > 0 ? `+${deltaPeso} kg` : `${deltaPeso} kg`}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={!entryDateIso}
                                onClick={() => entryDateIso && prepareFormForDate(entryDateIso, { focusSection: "form" })}
                              >
                                Editar
                              </Button>
                            </div>
                            {perimeterDetails.length > 0 ? (
                              <div className="space-y-2">
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Medidas registradas</p>
                                <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                                  {perimeterDetails.map((detail) => (
                                    <div key={`${entry?.fecha}-${detail.label}`} className="flex items-center justify-between gap-3 rounded-md border px-2 py-1 bg-muted/40">
                                      <span className="font-medium text-foreground">{detail.label}</span>
                                      <span>{detail.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">Sin mediciones detalladas para este día.</p>
                            )}
                            <div className="space-y-2">
                              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Composición (US Navy / manual)</p>
                              {compositionDetails.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                                  {compositionDetails.map((detail) => (
                                    <div key={`${entry?.fecha}-${detail.label}`} className="flex items-center justify-between gap-3 rounded-md border px-2 py-1 bg-primary/5">
                                      <span className="font-medium text-foreground">{detail.label}</span>
                                      <span>{detail.value}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Sin datos de %grasa, %músculo o %agua para este día.
                                </p>
                              )}
                            </div>
                            {(entry?.notas || entry?.fuente) && (
                              <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-1">
                                {entry?.notas && <p><span className="font-semibold text-foreground">Notas:</span> {entry.notas}</p>}
                                {entry?.fuente && <p><span className="font-semibold text-foreground">Fuente:</span> {entry.fuente}</p>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">Progreso corporal</h1>
          <p className="text-muted-foreground mt-1 text-sm">Registra tu peso, %grasa, %músculo y medidas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Registra o edita tus controles</CardTitle>
            <CardDescription>
              Selecciona la fecha desde el calendario o usa los accesos rápidos para mantener tu registro al día.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Elige un día en el calendario y toca <span className="font-semibold text-foreground">Registrar medición</span> para llenarlo o editarlo.
            </p>
            <Button
              type="button"
              onClick={() => prepareFormForDate(defaultDateForModal, { focusSection: "form" })}
              disabled={prefillingForm || saving}
            >
              {activeEntry ? "Seguir editando" : "Registrar medición"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consulta tu historial</CardTitle>
            <CardDescription>Revisa medidas guardadas y abre el modal directamente en la vista de historial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Usa <span className="font-semibold text-foreground">Ver historial</span> para saltar directo a tus registros y elegir cuál abrir.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="default"
                onClick={() => prepareFormForDate(defaultDateForModal, { focusSection: "history" })}
                disabled={prefillingForm}
              >
                Ver historial
              </Button>
              {availableHistoryYears.length > 0 && (
                <div className="flex flex-1 items-center gap-2">
                  <Popover open={historyYearMenuInlineOpen} onOpenChange={setHistoryYearMenuInlineOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 justify-between text-xs"
                      >
                        <span>{historyPdfYear ?? availableHistoryYears[0]}</span>
                        <ChevronDown className="h-4 w-4 opacity-70" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-48 p-1">
                      <div className="flex flex-col">
                        {availableHistoryYears.map((year) => {
                          const isActive = historyPdfYear === year;
                          return (
                            <button
                              key={year}
                              type="button"
                              className={cn(
                                "flex items-center justify-between rounded-md px-3 py-2 text-sm transition",
                                isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                              )}
                              onClick={() => {
                                setHistoryPdfYear(year);
                                setHistoryYearMenuInlineOpen(false);
                              }}
                            >
                              <span>{year}</span>
                              {isActive && <span className="text-[11px] uppercase">Activo</span>}
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadHistoryPdf}
                    disabled={exportingHistoryPdf}
                  >
                    {exportingHistoryPdf ? "Generando…" : "Descargar PDF"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="w-full lg:col-span-2">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Calendario de controles</CardTitle>
                <CardDescription>
                  {measureIntervalWeeks
                    ? `Frecuencia configurada: cada ${measureIntervalWeeks} semanas.`
                    : "Configura tu frecuencia en perfil"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 w-full justify-end sm:w-auto sm:self-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowCalendarHelp(true)}
                  aria-label="Cómo funciona el calendario"
                >
                  <Info className="h-4 w-4" />
                </Button>
                <div ref={calendarActionsRef} className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Accesos rápidos del calendario"
                    aria-expanded={showCalendarActions}
                    onClick={() => setShowCalendarActions((prev) => !prev)}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  {showCalendarActions && (
                    <div
                      className="absolute z-30 bg-popover border rounded-md shadow-lg text-sm right-0 mt-2 md:left-full md:right-auto md:top-0 md:ml-3 md:mt-0"
                    >
                      <Link
                        href="/account/profile/progress"
                        className="block px-3 py-2 text-left text-sm whitespace-nowrap transition hover:bg-muted focus-visible:outline-none"
                        onClick={() => setShowCalendarActions(false)}
                      >
                        Cambiar plan de frecuencia
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-[1fr,320px]">
                <div className="space-y-3 text-sm">
                  {nextSuggestedLabel && (
                    <p className="text-xs text-foreground font-medium">
                      Próximo registro sugerido: <span className="font-semibold">{nextSuggestedLabel}</span>
                    </p>
                  )}
                    <div className="flex flex-wrap gap-2">
                    {upcomingSuggestions.length === 0 ? (
                      <span className="text-xs text-muted-foreground">Sin datos suficientes todavía.</span>
                    ) : (
                      upcomingSuggestions.map((d) => {
                        const date = new Date(d + "T00:00:00");
                        const isPast = date.getTime() < todayDate.getTime();
                        return (
                          <span
                            key={d}
                            className={cn(
                              "px-3 py-1 rounded-full text-xs border",
                              isPast ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-amber-100 text-amber-900 border-amber-200"
                            )}
                          >
                            {date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <Calendar
                    mode="single"
                    month={calendarMonthDate}
                    onMonthChange={(m) => {
                      setCalYear(m.getFullYear());
                      setCalMonth(m.getMonth() + 1);
                    }}
                    selected={selectedDateObj ?? undefined}
                    onSelect={handleCalendarDatePick}
                    onDayClick={handleCalendarDatePick}
                    modifiers={{ measured: measuredDates, scheduled: scheduledDates }}
                    modifiersClassNames={{
                      measured: "bg-emerald-500 text-white hover:bg-emerald-600",
                      scheduled: "bg-amber-500 text-white hover:bg-amber-600",
                    }}
                  />
                  <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground flex-wrap">
                    <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Medición registrada</span>
                    <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Fecha sugerida futura</span>
                    <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-400 inline-block" /> Fecha sugerida pasada</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta informativa: Próximamente */}
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-fuchsia-600 via-violet-600 to-indigo-600 text-white lg:col-span-2">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_60%),radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.25),transparent_60%)] pointer-events-none" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5" />
                Muy pronto
              </CardTitle>
              <CardDescription className="text-violet-100">Subir fotos y registrar peso semanal</CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-violet-50">
              Estamos construyendo una experiencia enfocada en la constancia: sube tus fotos de progreso, registra tu peso semanal y obtén comparativas inteligentes. 
              <span className="font-medium">Esta sección evolucionará</span> para darte feedback visual y métricas de composición corporal simplificadas.
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
