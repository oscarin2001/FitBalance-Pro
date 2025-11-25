"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplet, Flame, Egg, Wheat } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
 

type Summary = {
  objetivos: { kcal: number | null; proteinas: number | null; grasas: number | null; carbohidratos: number | null; agua_litros: number | null };
  consumidos: { calorias: number; proteinas: number; grasas: number; carbohidratos: number };
  kcal_restantes: number | null;
  macros_restantes: { proteinas: number | null; grasas: number | null; carbohidratos: number | null };
  hidratacion: { hoy_litros: number; objetivo_litros: number | null; completado: boolean };
  projection: { delta_kg: number | null; ritmo_kg_sem: number | null; eta_weeks: number | null; eta_date_iso: string | null };
};

const COLORS = ["#4F46E5", "#16A34A", "#F59E0B"]; // Prote, Grasas, Carbs

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Summary | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [adherenceMode, setAdherenceMode] = useState<"weeks" | "months" | "weekdays">("weeks");
  const [adherenceSeries, setAdherenceSeries] = useState<Array<{ period: string; pct: number }>>([]);
  const [last7Avg, setLast7Avg] = useState<number | null>(null);
  const [prev7Avg, setPrev7Avg] = useState<number | null>(null);
  const [pieOverride, setPieOverride] = useState<"consumidos" | "objetivos" | null>(null);
  const [weekdayCompare, setWeekdayCompare] = useState<{ current: Array<{ label: string; pct: number }>; prev: Array<{ label: string; pct: number }>; } | null>(null);
  const [progressStats, setProgressStats] = useState<{
    lastEntry: any | null;
    previousEntry: any | null;
    entries: any[];
    deltaKg: number | null;
    startWeight: number | null;
    startDate: string | null;
    currentWeight: number | null;
    currentDate: string | null;
    intervalWeeks: number | null;
  } | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);

  // YYYY-MM-DD en zona horaria local (no UTC) para matchear el backend
  function todayIso() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const safeNumber = (value: any): number | null => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const formatDateShort = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  const formatDateLong = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  function sumCompletedFromPlan(planItems: any[], complianceMap: Record<string, boolean>) {
    const canonical = (raw: string) => {
      const t = (raw || '').toString().toLowerCase();
      if (t.startsWith('snack')) return 'Snack';
      if (t === 'desayuno') return 'Desayuno';
      if (t === 'almuerzo') return 'Almuerzo';
      if (t === 'cena') return 'Cena';
      return raw;
    };
    const totals = { kcal: 0, proteinas: 0, grasas: 0, carbohidratos: 0 };
    for (const it of planItems || []) {
      const tipo = canonical(it?.tipo);
      if (!complianceMap[tipo]) continue; // solo las comidas marcadas como cumplidas
      const m = it?.receta?.macros;
      const por = Number(it?.porciones) || 1;
      if (m) {
        totals.kcal += Math.max(0, Number(m.kcal) || 0) * por;
        totals.proteinas += Math.max(0, Number(m.proteinas) || 0) * por;
        totals.grasas += Math.max(0, Number(m.grasas) || 0) * por;
        totals.carbohidratos += Math.max(0, Number(m.carbohidratos) || 0) * por;
      }
    }
    // redondeos suaves
    totals.kcal = Math.round(totals.kcal);
    totals.proteinas = Math.round(totals.proteinas * 10) / 10;
    totals.grasas = Math.round(totals.grasas * 10) / 10;
    totals.carbohidratos = Math.round(totals.carbohidratos * 10) / 10;
    return totals;
  }

  async function load() {
    try {
      const today = todayIso();
      const [res, prof, planRes, compRes] = await Promise.all([
        fetch("/api/account/dashboard/summary", { cache: "no-store" }),
        fetch("/api/account/profile", { cache: "no-store" }),
        fetch(`/api/account/meal-plan?date=${today}`, { cache: "no-store" }),
        fetch(`/api/account/meal-plan/compliance?date=${today}`, { cache: "no-store" }),
      ]);
      if (!res.ok) throw new Error();
      const json = await res.json();
      let merged: Summary = json;
      // Integrar consumo real desde plan cumplido de hoy
      if (planRes.ok) {
        const planJson = await planRes.json().catch(() => ({}));
        // Compliance: API o fallback localStorage
        let compJson: any = {};
        if (compRes.ok) {
          compJson = await compRes.json().catch(() => ({}));
        } else {
          try {
            const key = `plan_compliance_${today}`;
            const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
            if (raw) {
              const map = JSON.parse(raw);
              compJson = { items: Object.keys(map).map(k => ({ comida_tipo: k, cumplido: !!map[k] })) };
            } else {
              const lastRaw = typeof window !== 'undefined' ? localStorage.getItem('plan_compliance_last') : null;
              if (lastRaw) {
                const last = JSON.parse(lastRaw);
                if (last?.date === today && last?.map) {
                  const map = last.map;
                  compJson = { items: Object.keys(map).map(k => ({ comida_tipo: k, cumplido: !!map[k] })) };
                }
              }
            }
          } catch {}
        }
        const items = Array.isArray(planJson?.items) ? planJson.items : [];
        // Normalizar claves de cumplimiento a un mapa canónico (Snack, Desayuno, Almuerzo, Cena)
        const compRaw: Record<string, boolean> = {};
        (Array.isArray(compJson?.items) ? compJson.items : []).forEach((r: any) => { compRaw[r.comida_tipo] = !!r.cumplido; });
        const compMap: Record<string, boolean> = {};
        const setTrue = (k: string) => { compMap[k] = compMap[k] || true; };
        for (const [k, v] of Object.entries(compRaw)) {
          if (!v) continue;
          const t = (k || '').toLowerCase();
          if (t.startsWith('snack')) setTrue('Snack');
          else if (t === 'desayuno') setTrue('Desayuno');
          else if (t === 'almuerzo') setTrue('Almuerzo');
          else if (t === 'cena') setTrue('Cena');
          else compMap[k] = true;
        }
        const totals = sumCompletedFromPlan(items, compMap);
        // Solo sobreescribir si hay al menos una comida cumplida
        const anyDone = Object.values(compMap).some(Boolean);
        if (anyDone) {
          const objetivoKcal = merged?.objetivos?.kcal ?? null;
          merged = {
            ...merged,
            consumidos: {
              calorias: totals.kcal,
              proteinas: totals.proteinas,
              grasas: totals.grasas,
              carbohidratos: totals.carbohidratos,
            },
            kcal_restantes: objetivoKcal != null ? Math.max(0, Math.round(objetivoKcal - totals.kcal)) : merged.kcal_restantes,
            macros_restantes: {
              proteinas: merged?.objetivos?.proteinas != null ? Math.max(0, Math.round((merged.objetivos.proteinas as any) - totals.proteinas)) : merged?.macros_restantes?.proteinas ?? null,
              grasas: merged?.objetivos?.grasas != null ? Math.max(0, Math.round((merged.objetivos.grasas as any) - totals.grasas)) : merged?.macros_restantes?.grasas ?? null,
              carbohidratos: merged?.objetivos?.carbohidratos != null ? Math.max(0, Math.round((merged.objetivos.carbohidratos as any) - totals.carbohidratos)) : merged?.macros_restantes?.carbohidratos ?? null,
            },
          } as Summary;
          // Mostrar por defecto la pesta f1a de Consumidos cuando ya hay comidas marcadas
          setPieOverride('consumidos');
        }
      }
      setData(merged);
      if (prof.ok) {
        const pj = await prof.json();
        setProfile(pj?.user || null);
      }
    } catch (e) {
      toast.error("No se pudo cargar el resumen");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    (async () => {
      try {
        setProgressLoading(true);
        const today = todayIso();
        const [entriesRes, periodRes] = await Promise.all([
          fetch(`/api/account/progress?limit=4`, { cache: "no-store" }),
          fetch(`/api/account/progress/period?ending=${today}`, { cache: "no-store" }),
        ]);
        let entries: any[] = [];
        if (entriesRes.ok) {
          const entriesJson = await entriesRes.json();
          entries = Array.isArray(entriesJson?.items) ? entriesJson.items : [];
        }
        let periodJson: any = null;
        if (periodRes.ok) {
          periodJson = await periodRes.json();
        }
        const lastEntry = entries[0] ?? null;
        const previousEntry = entries[1] ?? null;
        const lastWeight = safeNumber(lastEntry?.peso_kg);
        const prevWeight = safeNumber(previousEntry?.peso_kg);
        const deltaFromEntries = lastWeight != null && prevWeight != null ? lastWeight - prevWeight : null;
        const delta = deltaFromEntries ?? safeNumber(periodJson?.delta);
        setProgressStats({
          lastEntry,
          previousEntry,
          entries,
          deltaKg: delta,
          startWeight: safeNumber(periodJson?.start),
          startDate: periodJson?.startDate ?? null,
          currentWeight: safeNumber(periodJson?.current),
          currentDate: periodJson?.currentDate ?? null,
          intervalWeeks: periodJson?.weeks ?? null,
        });
      } catch (error) {
        setProgressStats(null);
      } finally {
        setProgressLoading(false);
      }
    })();
  }, []);

  // Refrescar resumen cuando la pestaña vuelve a foco o cuando otra vista emite un evento de actualización de comida
  useEffect(() => {
    const onFocus = () => load();
    const onMealUpdated = () => load();
    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus);
      window.addEventListener("meal:updated", onMealUpdated as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", onFocus);
        window.removeEventListener("meal:updated", onMealUpdated as EventListener);
      }
    };
  }, []);

  // Cargar historial para adherencia agregada (semanas/meses/días de la semana)
  useEffect(() => {
    (async () => {
      try {
        const days = adherenceMode === "weeks" ? 56 : adherenceMode === "months" ? 180 : 14; // 2 semanas para comparar días
        const res = await fetch(`/api/account/meal-plan/history?days=${days}`, { cache: "no-store" });
        const j = await res.json();
        const items: Array<{ date: string; adherence: number }> = Array.isArray(j?.items) ? j.items : [];

        // Calcular promedios últimos 7 días y los 7 anteriores
        const daily = items
          .map((it) => ({ date: new Date(it.date), pct: Math.max(0, Math.min(1, Number(it.adherence) || 0)) }))
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        if (daily.length >= 7) {
          const last7 = daily.slice(-7);
          const prev7 = daily.slice(-14, -7);
          const avg = (arr: typeof daily) => (arr.length ? arr.reduce((s, d) => s + d.pct, 0) / arr.length : null);
          setLast7Avg(avg(last7));
          setPrev7Avg(avg(prev7));
        } else {
          setLast7Avg(null);
          setPrev7Avg(null);
        }

        // Si se solicita comparación por días de la semana (semana actual vs. anterior)
        if (adherenceMode === "weekdays") {
          const today = new Date();
          const startOfWeek = new Date(today); // Lunes como inicio aproximado (ISO)
          const dayNum = (startOfWeek.getDay() || 7); // 1..7 donde 1=Lunes
          startOfWeek.setDate(startOfWeek.getDate() - (dayNum - 1));
          const prevWeekStart = new Date(startOfWeek); prevWeekStart.setDate(prevWeekStart.getDate() - 7);
          const prevWeekEnd = new Date(startOfWeek); prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);

          const inRange = (d: Date, a: Date, b: Date) => d.getTime() >= a.getTime() && d.getTime() <= b.getTime();
          const thisWeek: Array<{ label: string; pct: number }> = [];
          const prevWeek: Array<{ label: string; pct: number }> = [];
          const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

          for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek); d.setDate(d.getDate() + i);
            const match = daily.find(x => x.date.getFullYear() === d.getFullYear() && x.date.getMonth() === d.getMonth() && x.date.getDate() === d.getDate());
            thisWeek.push({ label: dayLabels[i], pct: match ? match.pct : 0 });
          }
          for (let i = 0; i < 7; i++) {
            const d = new Date(prevWeekStart); d.setDate(d.getDate() + i);
            const match = daily.find(x => x.date.getFullYear() === d.getFullYear() && x.date.getMonth() === d.getMonth() && x.date.getDate() === d.getDate());
            prevWeek.push({ label: dayLabels[i], pct: match ? match.pct : 0 });
          }
          setWeekdayCompare({ current: thisWeek, prev: prevWeek });
        } else {
          setWeekdayCompare(null);
        }

        // Agrupar por semana (YYYY-WW) o por mes (YYYY-MM)
        const fmt = (d: Date) => {
          if (adherenceMode === "months") {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          }
          // Semanas: ISO week approximation
          const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
          const dayNum = tmp.getUTCDay() || 7; // 1..7
          tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
          const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
          return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
        };

        const map = new Map<string, { sum: number; count: number }>();
        for (const it of items) {
          const d = new Date(it.date);
          const key = fmt(d);
          const cur = map.get(key) || { sum: 0, count: 0 };
          map.set(key, { sum: cur.sum + (Number(it.adherence) || 0), count: cur.count + 1 });
        }
        const series = Array.from(map.entries())
          .map(([k, v]) => {
            const raw = v.count ? v.sum / v.count : 0;
            const pct = Math.max(0, Math.min(1, raw)); // clamp 0..1
            return { period: k, pct };
          })
          .sort((a, b) => a.period.localeCompare(b.period));
        setAdherenceSeries(series);
      } catch {
        setAdherenceSeries([]);
      }
    })();
  }, [adherenceMode]);

  const toNum = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const pieState = useMemo(() => {
    if (!data) return { data: [] as any[], mode: "consumidos" as "consumidos" | "objetivos" };
    const consumidos = [
      { name: "Proteínas", value: Math.max(0, Math.round(toNum(data.consumidos.proteinas))) },
      { name: "Grasas", value: Math.max(0, Math.round(toNum(data.consumidos.grasas))) },
      { name: "Carbohidratos", value: Math.max(0, Math.round(toNum(data.consumidos.carbohidratos))) },
    ];
    const totalConsumidos = consumidos.reduce((a, b) => a + (b.value || 0), 0);

    const objetivos = [
      { name: "Proteínas", value: Math.max(0, Math.round(toNum(data.objetivos.proteinas))) },
      { name: "Grasas", value: Math.max(0, Math.round(toNum(data.objetivos.grasas))) },
      { name: "Carbohidratos", value: Math.max(0, Math.round(toNum(data.objetivos.carbohidratos))) },
    ];
    const totalObjetivos = objetivos.reduce((a, b) => a + (b.value || 0), 0);

    if (totalConsumidos === 0 && totalObjetivos > 0) {
      return { data: objetivos, mode: "objetivos" as const };
    }
    return { data: consumidos, mode: "consumidos" as const };
  }, [data]);

  const noMacroData = useMemo(() => pieState.data.reduce((a, b) => a + (b.value || 0), 0) === 0, [pieState]);
  const etaInfo = useMemo(() => {
    const proj = data?.projection;
    const etaWeeks = typeof proj?.eta_weeks === "number" ? proj.eta_weeks : null;
    const etaLabel = etaWeeks != null ? `${etaWeeks.toFixed(1)} sem` : "—";
    const etaMonths = etaWeeks != null ? `${(etaWeeks / 4.345).toFixed(1)} meses` : null;
    const etaDate = proj?.eta_date_iso ? formatDateLong(proj.eta_date_iso) : "—";
    const delta = typeof proj?.delta_kg === "number" ? `${proj.delta_kg.toFixed(1)} kg pendientes` : null;
    const ritmo = typeof proj?.ritmo_kg_sem === "number" ? `${proj.ritmo_kg_sem >= 0 ? '+' : ''}${proj.ritmo_kg_sem.toFixed(2)} kg/sem` : null;
    return { etaLabel, etaMonths, etaDate, delta, ritmo };
  }, [data?.projection]);

  const progressTrend = useMemo(() => {
    const delta = progressStats?.deltaKg;
    const objetivo = (profile?.objetivo || "").toLowerCase();
    if (delta == null || Number.isNaN(delta)) {
      return {
        label: "Sin datos",
        badgeClass: "border border-dashed bg-muted/50 text-muted-foreground",
        message: "Registra al menos dos mediciones para ver tendencias.",
      };
    }
    const wantsLoss = objetivo.includes("bajar");
    const wantsGain = objetivo.includes("ganar");
    const absDelta = Math.abs(delta);
    const formatted = `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`;
    if (wantsLoss) {
      if (delta <= -0.2) {
        return {
          label: `${formatted} • En descenso`,
          badgeClass: "border border-emerald-200 bg-emerald-50 text-emerald-800",
          message: "Estás perdiendo peso acorde al plan de bajar grasa.",
        };
      }
      if (delta >= 0.2) {
        return {
          label: `${formatted} • En alza`,
          badgeClass: "border border-rose-200 bg-rose-50 text-rose-800",
          message: "Tu peso subió en el último control. Revisa adherencia y sodio.",
        };
      }
      return {
        label: `${formatted} • Estable`,
        badgeClass: "border border-amber-200 bg-amber-50 text-amber-900",
        message: "Variación mínima, mantén constancia para ver tendencia.",
      };
    }
    if (wantsGain) {
      if (delta >= 0.2) {
        return {
          label: `${formatted} • Ganando`,
          badgeClass: "border border-emerald-200 bg-emerald-50 text-emerald-800",
          message: "Estás subiendo peso como se espera en fase de músculo.",
        };
      }
      if (delta <= -0.2) {
        return {
          label: `${formatted} • Bajando`,
          badgeClass: "border border-rose-200 bg-rose-50 text-rose-800",
          message: "Perdiste peso cuando buscamos subir. Ajusta calorías.",
        };
      }
      return {
        label: `${formatted} • Estable`,
        badgeClass: "border border-amber-200 bg-amber-50 text-amber-900",
        message: "Peso estable; recuerda sumar calorías en días fuertes.",
      };
    }
    if (absDelta <= 0.5) {
      return {
        label: `${formatted} • Dentro de rango`,
        badgeClass: "border border-emerald-200 bg-emerald-50 text-emerald-800",
        message: "Mantienes tu peso en el rango típico de mantenimiento.",
      };
    }
    return {
      label: `${formatted} • Fuera de rango`,
      badgeClass: "border border-rose-200 bg-rose-50 text-rose-800",
      message: delta > 0 ? "Subiste más de lo esperado para mantenimiento." : "Bajaste más de lo esperado para mantenimiento.",
    };
  }, [progressStats?.deltaKg, profile?.objetivo]);

  const progressTimeline = useMemo(() => {
    if (!progressStats?.entries?.length) return [] as Array<{ id: string | number; date: string | null; weight: number | null; delta: number | null }>;
    return progressStats.entries.slice(0, 3).map((entry, idx) => {
      const prev = progressStats.entries[idx + 1];
      const weight = safeNumber(entry?.peso_kg);
      const prevWeight = safeNumber(prev?.peso_kg);
      const delta = weight != null && prevWeight != null ? weight - prevWeight : null;
      return {
        id: entry?.id ?? entry?.fecha ?? idx,
        date: entry?.fecha ?? null,
        weight,
        delta,
      };
    });
  }, [progressStats?.entries]);

  return (
    <div className="p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="space-y-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold">Tu día</h1>
              <p className="text-muted-foreground mt-1">Calorías, macros y agua de hoy</p>
            </div>
          </div>

      {/* Estado corporal y objetivo */}
      {!loading && profile && (
        <Card>
          <CardHeader>
            <CardTitle>Estado y objetivo</CardTitle>
            <CardDescription>Resumen basado en tus datos actuales</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const hM = Number(profile.altura_cm || 0) / 100;
              const w = Number(profile.peso_kg || 0);
              const bmi = hM > 0 ? w / (hM * hM) : null;
              function bmiCat(b: number | null): string {
                if (b == null) return "Sin datos";
                if (b < 18.5) return "Bajo peso";
                if (b < 25) return "Peso saludable";
                if (b < 30) return "Sobrepeso";
                if (b < 35) return "Obesidad grado I";
                if (b < 40) return "Obesidad grado II";
                return "Obesidad mórbida (grado III)";
              }

              const objetivo = profile.objetivo as string | null;
              const pesoObj = profile.peso_objetivo_kg as number | null;
              let objetivoTxt = "Sin objetivo definido";
              if (objetivo) {
                if (objetivo === "Bajar_grasa" && pesoObj && w) {
                  const delta = (w - pesoObj).toFixed(1);
                  objetivoTxt = Number(delta) > 0 ? `Bajar ${delta} kg` : `Mantener`; 
                } else if (objetivo === "Ganar_musculo" && pesoObj && w) {
                  const delta = (pesoObj - w).toFixed(1);
                  objetivoTxt = Number(delta) > 0 ? `Aumentar ${delta} kg` : `Mantener`;
                } else if (objetivo === "Mantenimiento") {
                  objetivoTxt = "Mantener peso y composición actual";
                }
              }

              const extra = bmi != null && bmi < 18.5
                ? "Estás por debajo del peso saludable."
                : bmi != null && bmi >= 30
                ? "Presentas obesidad. Sigue el plan y registra progreso semanal."
                : undefined;

              return (
                <div className="grid gap-2 text-sm md:grid-cols-5">
                  <div>
                    <div className="text-muted-foreground">IMC</div>
                    <div className="font-medium">{bmi != null ? bmi.toFixed(1) : "—"} ({bmiCat(bmi)})</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Objetivo</div>
                    <div className="font-medium">{objetivoTxt}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Velocidad</div>
                    <div className="font-medium">{profile.velocidad_cambio ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Tiempo estimado</div>
                    <div className="font-medium">{etaInfo.etaLabel}</div>
                    {etaInfo.etaMonths && (
                      <div className="text-xs text-muted-foreground">
                        ≈ {etaInfo.etaMonths}
                        {etaInfo.delta && <span className="ml-1">• {etaInfo.delta}</span>}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-muted-foreground">Meta prevista</div>
                    <div className="font-medium">{etaInfo.etaDate}</div>
                    {etaInfo.ritmo && <div className="text-xs text-muted-foreground">Ritmo: {etaInfo.ritmo}</div>}
                  </div>
                  {extra && (
                    <div className="md:col-span-3 text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">{extra}</div>
                  )}
                </div>
              );
            })()}
            {/* Resumen del plan (fusionado) */}
            {!loading && data && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Objetivos del plan</div>
                <ul className="text-[13px] grid gap-2 md:grid-cols-2">
                  <li className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-indigo-600" />
                    <span className="text-muted-foreground">Kcal objetivo:</span>
                    <span className="font-medium tabular-nums">{data.objetivos.kcal ?? "—"} kcal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Egg className="h-4 w-4 text-violet-600" />
                    <span className="text-muted-foreground">Proteínas:</span>
                    <span className="font-medium tabular-nums">{data.objetivos.proteinas ?? "—"} g</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 rounded-sm" style={{ backgroundColor: COLORS[1] }} />
                    <span className="text-muted-foreground">Grasas:</span>
                    <span className="font-medium tabular-nums">{data.objetivos.grasas ?? "—"} g</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Wheat className="h-4 w-4 text-amber-600" />
                    <span className="text-muted-foreground">Carbohidratos:</span>
                    <span className="font-medium tabular-nums">{data.objetivos.carbohidratos ?? "—"} g</span>
                  </li>
                  <li className="flex items-center gap-2 md:col-span-2">
                    <Droplet className="h-4 w-4 text-emerald-600" />
                    <span className="text-muted-foreground">Agua:</span>
                    <span className="font-medium tabular-nums">{data.objetivos.agua_litros ?? "—"} L</span>
                  </li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="text-xs uppercase text-muted-foreground">Resumen de hoy</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Flame className="h-5 w-5" /> Calorías</CardTitle>
            <CardDescription>Objetivo vs consumido</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <div className="text-sm text-muted-foreground">Cargando…</div>
            ) : (
              <div className="space-y-3">
                <div className="text-3xl font-semibold">{Math.round(data.consumidos.calorias)} kcal</div>
                <div className="text-sm">Objetivo: {data.objetivos.kcal != null ? Math.round(data.objetivos.kcal) : "—"} kcal</div>
                <div className="text-sm">Restante: {data.kcal_restantes != null ? Math.round(data.kcal_restantes) : "—"} kcal</div>
                {/* Barra de progreso kcal */}
                {data.objetivos.kcal != null && (
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    {(() => {
                      const obj = Math.max(1, Number(data.objetivos.kcal) || 1);
                      const pct = Math.min(100, Math.max(0, (data.consumidos.calorias / obj) * 100));
                      return <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />;
                    })()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>
                Distribución de macros ({(pieOverride ?? pieState.mode) === "consumidos" ? "consumidos" : "objetivos"})
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant={(pieOverride ?? pieState.mode) === "consumidos" ? "default" : "outline"} onClick={() => setPieOverride("consumidos")}>Consumidos</Button>
                <Button size="sm" variant={(pieOverride ?? pieState.mode) === "objetivos" ? "default" : "outline"} onClick={() => setPieOverride("objetivos")}>Objetivos</Button>
              </div>
            </div>
            <CardDescription>Proteínas, grasas y carbohidratos</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {loading || !data ? (
              <div className="text-sm text-muted-foreground">Cargando…</div>
            ) : (
              noMacroData ? (
                <div className="h-full w-full grid place-items-center text-sm text-muted-foreground">
                  Aún no registraste macros hoy.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip formatter={(v: any) => `${v} g`} />
                    <Legend />
                    <Pie
                      data={((pieOverride ?? pieState.mode) === "consumidos" ? [
                        { name: "Proteínas", value: Math.max(0, Math.round(toNum(data.consumidos.proteinas))) },
                        { name: "Grasas", value: Math.max(0, Math.round(toNum(data.consumidos.grasas))) },
                        { name: "Carbohidratos", value: Math.max(0, Math.round(toNum(data.consumidos.carbohidratos))) },
                      ] : [
                        { name: "Proteínas", value: Math.max(0, Math.round(toNum(data.objetivos.proteinas))) },
                        { name: "Grasas", value: Math.max(0, Math.round(toNum(data.objetivos.grasas))) },
                        { name: "Carbohidratos", value: Math.max(0, Math.round(toNum(data.objetivos.carbohidratos))) },
                      ]) as { name: string; value: number }[]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={4}
                      label={false}
                      labelLine={false}
                    >
                      {(pieState.data as { name: string; value: number }[]).map((entry: { name: string; value: number }, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )
            )}
          </CardContent>
          {!loading && data && (
            <CardFooter className="grid grid-cols-1 gap-2 pt-0 md:grid-cols-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="mt-1 inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS[0] }} />
                <div>
                  <div className="font-medium">Proteínas</div>
                  <div className="text-muted-foreground">Obj: {data.objetivos.proteinas ?? "—"} g • Rest: {data.macros_restantes.proteinas ?? "—"} g</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS[1] }} />
                <div>
                  <div className="font-medium">Grasas</div>
                  <div className="text-muted-foreground">Obj: {data.objetivos.grasas ?? "—"} g • Rest: {data.macros_restantes.grasas ?? "—"} g</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS[2] }} />
                <div>
                  <div className="font-medium">Carbohidratos</div>
                  <div className="text-muted-foreground">Obj: {data.objetivos.carbohidratos ?? "—"} g • Rest: {data.macros_restantes.carbohidratos ?? "—"} g</div>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Adherencia agregada: comparación semanas/meses */}
      <div className="text-xs uppercase text-muted-foreground">Actividad reciente</div>
      <Card>
        <CardHeader>
          <CardTitle>Comidas cumplidas</CardTitle>
          <CardDescription>
            {adherenceMode === "weeks" ? "Semanas recientes" : "Meses recientes"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="text-sm text-muted-foreground">
              {adherenceMode === "weeks" ? "Esta semana vs. semana pasada" : adherenceMode === "months" ? "Este mes vs. mes pasado" : "Semana actual vs. semana anterior (por día)"}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={adherenceMode === "weeks" ? "default" : "outline"} onClick={() => setAdherenceMode("weeks")}>Semanas</Button>
              <Button size="sm" variant={adherenceMode === "months" ? "default" : "outline"} onClick={() => setAdherenceMode("months")}>Meses</Button>
              <Button size="sm" variant={adherenceMode === "weekdays" ? "default" : "outline"} onClick={() => setAdherenceMode("weekdays")}>Días</Button>
            </div>
          </div>
          {/* Tendencia */}
          {adherenceMode !== 'weekdays' ? (
            adherenceSeries.length > 0 && (
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={adherenceSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                      tickFormatter={(v) => {
                        const s = String(v);
                        if (adherenceMode === "months") {
                          const [y, m] = s.split("-");
                          return `${m}/${y.slice(2)}`; // MM/YY
                        }
                        const parts = s.split("-W");
                        return parts.length === 2 ? `Sem ${parts[1]}` : s; // Semana NN
                      }}
                    />
                    <YAxis
                      domain={[0, 1]}
                      tickFormatter={(v) => `${Math.round(v * 100)}%`}
                      width={40}
                    />
                    <Tooltip
                      formatter={(v: any) => [`${Math.round((Number(v) || 0) * 100)}%`, "Comidas cumplidas"]}
                      labelFormatter={(l) => {
                        const s = String(l);
                        if (adherenceMode === "months") {
                          const [y, m] = s.split("-");
                          return `Mes: ${m}/${y}`;
                        }
                        const parts = s.split("-W");
                        return parts.length === 2 ? `Semana: ${parts[1]}` : `Semana: ${s}`;
                      }}
                    />
                    <Line type="monotone" dataKey="pct" stroke="#4F46E5" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )
          ) : (
            weekdayCompare && (
              <div className="mb-4 space-y-2">
                <div className="grid grid-cols-7 gap-2 text-xs">
                  {weekdayCompare.current.map((d, i) => (
                    <div key={`cur-${i}`} className="p-2 rounded border">
                      <div className="text-muted-foreground mb-1">{d.label}</div>
                      <div className="h-2 w-full bg-muted rounded overflow-hidden">
                        <div className="h-full bg-indigo-600" style={{ width: `${Math.round(d.pct * 100)}%` }} />
                      </div>
                      <div className="mt-1 tabular-nums">{Math.round(d.pct * 100)}%</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 text-xs">
                  {weekdayCompare.prev.map((d, i) => (
                    <div key={`prev-${i}`} className="p-2 rounded border bg-muted/30">
                      <div className="text-muted-foreground mb-1">{d.label}</div>
                      <div className="h-2 w-full bg-muted rounded overflow-hidden">
                        <div className="h-full bg-emerald-600" style={{ width: `${Math.round(d.pct * 100)}%` }} />
                      </div>
                      <div className="mt-1 tabular-nums">{Math.round(d.pct * 100)}%</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">Arriba: semana actual • Abajo: semana anterior</div>
              </div>
            )
          )}
          {/* Textos claros bajo el gráfico */}
          {(() => {
            if (!adherenceSeries.length) {
              return <div className="text-sm text-muted-foreground">Sin datos suficientes.</div>;
            }
            const last = adherenceSeries[adherenceSeries.length - 1]?.pct ?? 0;
            const prev = adherenceSeries[adherenceSeries.length - 2]?.pct ?? 0;
            const delta = last - prev;
            const fmtPct = (v: number) => `${Math.round(v * 100)}%`;
            return (
              <>
                {/* Texto explicativo simple */}
                <p className="text-sm mb-3">
                  {adherenceMode === "weeks"
                    ? <>Esta semana llevas <strong>{fmtPct(last)}</strong> de comidas cumplidas. La semana pasada fue <strong>{fmtPct(prev)}</strong>.</>
                    : <>Este mes llevas <strong>{fmtPct(last)}</strong> de comidas cumplidas. El mes pasado fue <strong>{fmtPct(prev)}</strong>.</>}
                </p>
                {last7Avg != null && (
                  <p className="text-sm mb-3">
                    En los últimos 7 días llevas <strong>{fmtPct(last7Avg)}</strong>. Los 7 días anteriores fue <strong>{fmtPct(prev7Avg || 0)}</strong>.
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="rounded border p-3">
                    <div className="text-muted-foreground">{adherenceMode === "weeks" ? "Esta semana" : "Este mes"}</div>
                    <div className="text-2xl font-semibold">{fmtPct(last)}</div>
                  </div>
                  <div className="rounded border p-3">
                    <div className="text-muted-foreground">{adherenceMode === "weeks" ? "Semana pasada" : "Mes pasado"}</div>
                    <div className="text-2xl font-semibold">{fmtPct(prev)}</div>
                  </div>
                  <div className="rounded border p-3">
                    <div className={"text-muted-foreground"}>Diferencia</div>
                    <div className={`text-2xl font-semibold ${delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {delta >= 0 ? "↑" : "↓"} {fmtPct(Math.abs(delta))}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </CardContent>
      </Card>
        </section>
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progreso corporal</CardTitle>
              <CardDescription>Tendencia de peso vs. tu objetivo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {progressLoading ? (
                <p className="text-sm text-muted-foreground">Cargando…</p>
              ) : !progressStats?.lastEntry ? (
                <p className="text-sm text-muted-foreground">
                  Aún no registras mediciones. Abre la sección Progreso para crear tu primer control.
                </p>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Último control</p>
                      <p className="text-2xl font-semibold">
                        {safeNumber(progressStats.lastEntry?.peso_kg) != null
                          ? `${(safeNumber(progressStats.lastEntry?.peso_kg) as number).toFixed(1)} kg`
                          : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateLong(progressStats.lastEntry?.fecha)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${progressTrend?.badgeClass ?? "bg-muted/60 text-muted-foreground"}`}>
                      {progressTrend?.label ?? "Sin datos"}
                    </span>
                  </div>
                  {progressTrend?.message && (
                    <p className="text-sm text-muted-foreground">{progressTrend.message}</p>
                  )}
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Medición previa</dt>
                      <dd className="font-medium">
                        {safeNumber(progressStats.previousEntry?.peso_kg) != null
                          ? `${(safeNumber(progressStats.previousEntry?.peso_kg) as number).toFixed(1)} kg`
                          : "—"}
                      </dd>
                      <dd className="text-xs text-muted-foreground">{formatDateShort(progressStats.previousEntry?.fecha)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Ventana analizada</dt>
                      <dd className="font-medium">
                        {progressStats.startDate && progressStats.currentDate
                          ? `${formatDateShort(progressStats.startDate)} → ${formatDateShort(progressStats.currentDate)}`
                          : "Últimas lecturas"}
                      </dd>
                      <dd className="text-xs text-muted-foreground">
                        {progressStats.intervalWeeks ? `Cada ${progressStats.intervalWeeks} semanas` : "Frecuencia estándar"}
                      </dd>
                    </div>
                  </dl>
                  {progressTimeline.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Últimos registros</p>
                      <div className="space-y-2">
                        {progressTimeline.map((item) => {
                          const weightLabel = item.weight != null ? `${item.weight.toFixed(1)} kg` : "—";
                          const deltaLabel = item.delta == null || Number.isNaN(item.delta)
                            ? "—"
                            : `${item.delta > 0 ? "+" : ""}${item.delta.toFixed(1)} kg`;
                          const deltaColor =
                            item.delta == null || Number.isNaN(item.delta)
                              ? "text-muted-foreground"
                              : item.delta < 0
                              ? "text-emerald-600"
                              : item.delta > 0
                              ? "text-rose-600"
                              : "text-amber-600";
                          return (
                            <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                              <div>
                                <p className="text-sm font-medium">{formatDateShort(item.date)}</p>
                                <p className="text-xs text-muted-foreground">{weightLabel}</p>
                              </div>
                              <span className={`text-xs font-semibold ${deltaColor}`}>{deltaLabel}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="outline" size="sm" className="w-full sm:flex-1">
                <Link href="/dashboard/progress">Abrir progreso</Link>
              </Button>
              <Button asChild size="sm" className="w-full sm:flex-1">
                <Link href="/dashboard/progress?focus=history">Ver historial</Link>
              </Button>
            </CardFooter>
          </Card>
        </aside>
      </div>
    </div>
  );
}
