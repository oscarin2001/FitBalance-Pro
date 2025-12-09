"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import OnboardingHeader from "@/components/onboarding/OnboardingHeader";
import OnboardingActions from "@/components/onboarding/OnboardingActions";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import WeeklyPlanByDay from "@/components/WeeklyPlanByDay";
import { Clipboard, Download } from "lucide-react";
import { stripMarkdownStars } from "@/lib/utils";

function num(n: any): number | null {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  if (typeof n === "string") {
    // Extraer primer número (con signo opcional y decimales) de cadenas tipo "2637 kcal/día"
    const m = n.replace(",", ".").match(/-?\d+(?:\.\d+)?/);
    if (m) {
      const v = Number(m[0]);
      return Number.isFinite(v) ? v : null;
    }
  }
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}

// Fusiona campos de summary faltantes usando los bloques JSON del texto (si existen)
function mergeSummaryFromText(sum: any | null, text: string) {
  try {
    const parsed = tryParseAdviceJson(text);
    if (parsed?.summary && typeof parsed.summary === "object") {
      return { ...(sum || {}), ...(parsed.summary || {}) };
    }
  } catch {}
  return sum;
}

// Extrae un bloque JSON etiquetado manejando formato con o sin ```json fences
function extractJsonBlock(label: string, text: string): any | null {
  try {
    if (!text) return null;
    const idx = text.indexOf(label + ":");
    if (idx >= 0) {
      const after = text.slice(idx + label.length + 1);
      const startFence = after.match(/\s*```json\s*/i);
      let rest = after;
      if (startFence) rest = after.slice(startFence[0].length);
      const braceStart = rest.indexOf("{");
      if (braceStart >= 0) {
        let i = braceStart,
          depth = 0;
        for (; i < rest.length; i++) {
          const ch = rest[i];
          if (ch === "{") depth++;
          else if (ch === "}") {
            depth--;
            if (depth === 0) {
              const jsonStr = rest.slice(braceStart, i + 1);
              try {
                return JSON.parse(jsonStr);
              } catch {
                break;
              }
            }
          }
        }
      }
    }
    // Fallback: tomar el primer bloque ```json ... ```
    const fenceMatches = text.match(/```json\s*([\s\S]*?)```/gi) || [];
    for (const m of fenceMatches) {
      const inner = m.replace(/```json/i, "").replace(/```$/, "");
      try {
        return JSON.parse(inner.trim());
      } catch {}
    }
    // Último recurso: primer objeto en el texto
    const simple = text.match(/\{[\s\S]*\}/);
    if (simple) {
      try {
        return JSON.parse(simple[0]);
      } catch {}
    }
    return null;
  } catch {
    return null;
  }
}

// Intenta extraer bloques JSON_* desde el texto largo del consejo
function tryParseAdviceJson(text: string): {
  summary?: any;
  meals?: any;
  hydration?: any;
  beverages?: any;
  variants?: any;
} | null {
  try {
    const out: any = {};
    // Intento 1: bloques específicos por etiqueta
    let sum = extractJsonBlock("JSON_SUMMARY", text);
    let meals = extractJsonBlock("JSON_MEALS", text);
    let hyd = extractJsonBlock("JSON_HYDRATION", text);
    let bev = extractJsonBlock("JSON_BEVERAGES", text);
    let vars = extractJsonBlock("JSON_MEALS_VARIANTS", text);

    // Intento 2: si alguno vino nulo, probar con un bloque envolvente (primer ```json ...```) que contenga claves JSON_*
    const wrapper = extractJsonBlock("JSON_WRAPPER_FALLBACK", text);
    if (wrapper && typeof wrapper === "object") {
      if (!sum && wrapper.JSON_SUMMARY) sum = wrapper.JSON_SUMMARY;
      if (!meals && wrapper.JSON_MEALS) meals = wrapper.JSON_MEALS;
      if (!hyd && wrapper.JSON_HYDRATION) hyd = wrapper.JSON_HYDRATION;
      if (!bev && wrapper.JSON_BEVERAGES) bev = wrapper.JSON_BEVERAGES;
      if (!vars && (wrapper.JSON_MEALS_VARIANTS || wrapper.JSON_VARIANTS))
        vars = wrapper.JSON_MEALS_VARIANTS || wrapper.JSON_VARIANTS;
    }

    if (sum) out.summary = sum;
    if (meals) out.meals = meals;
    if (hyd) out.hydration = hyd;
    if (bev) out.beverages = bev;
    if (vars) out.variants = vars;
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

function normalizeSummary(raw: any | null, profile?: any | null) {
  const flat: Record<string, any> = {};
  const visited = new WeakSet<object>();
  function flatten(obj: any, path: string[] = []) {
    if (!obj || typeof obj !== "object") return;
    const ref = obj as object;
    if (visited.has(ref)) return;
    visited.add(ref);
    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => {
        if (item != null && typeof item === "object") {
          flatten(item, [...path, String(idx)]);
        }
      });
      return;
    }
    for (const [keyRaw, value] of Object.entries(obj)) {
      const key = String(keyRaw);
      if (value != null && typeof value === "object" && !Array.isArray(value)) {
        flatten(value, [...path, key]);
        continue;
      }
      if (Array.isArray(value)) {
        value.forEach((item, idx) => {
          if (item != null && typeof item === "object")
            flatten(item, [...path, key, String(idx)]);
        });
        continue;
      }
      if (value == null) continue;
      if (!(key in flat)) flat[key] = value;
      const parent = path[path.length - 1];
      if (parent) {
        const composite = `${parent}_${key}`;
        if (!(composite in flat)) flat[composite] = value;
        const keyLower = key.toLowerCase();
        if (
          /objetivo|target|goal|value|valor|objective|gramos|grams|cantidad|amount/.test(
            keyLower
          )
        ) {
          if (!(parent in flat)) flat[parent] = value;
          const parentGoal = `${parent}_objetivo`;
          if (!(parentGoal in flat)) flat[parentGoal] = value;
        }
      }
      const joined = [...path, key].join("_");
      if (joined && !(joined in flat)) flat[joined] = value;
    }
  }
  if (raw && typeof raw === "object") {
    flatten(raw);
  }
  const s: any = { ...(raw && typeof raw === "object" ? raw : {}), ...flat };
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      if (!(k in s)) continue;
      const v = (s as any)[k];
      const n = num(v);
      if (n != null) return n;
    }
    return null;
  };
  const pickDateIso = (...keys: string[]) => {
    for (const k of keys) {
      if (!(k in s)) continue;
      const raw = (s as any)[k];
      if (!raw) continue;
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    return null;
  };
  const out: any = {};
  out.tmb = pick("tmb", "TMB", "TMB_kcal", "tmb_kcal");
  out.tdee = pick("tdee", "TDEE", "tdee_kcal", "TDEE_kcal");
  out.kcal_objetivo = pick(
    "kcal_objetivo",
    "kcal",
    "calorias",
    "calorias_objetivo",
    "ingesta_calorica_recomendada_kcal",
    "objetivo_calorico",
    "calorie_target",
    "caloric_target",
    "calorie_goal"
  );
  out.deficit_superavit_kcal = pick(
    "deficit_superavit_kcal",
    "deficit_kcal",
    "superavit_kcal",
    "deficit",
    "delta_kcal"
  );
  out.ritmo_peso_kg_sem = pick(
    "ritmo_peso_kg_sem",
    "ritmo_kg_sem",
    "rate_kg_week",
    "proyeccion_cambio_semanal_kg"
  );
  out.proteinas_g = pick(
    "proteinas_g",
    "proteina_g",
    "proteinas",
    "protein_g",
    "proteinas_objetivo",
    "protein"
  );
  out.grasas_g = pick(
    "grasas_g",
    "grasas",
    "fat_g",
    "grasas_diarias_g",
    "grasas_objetivo",
    "fat"
  );
  out.carbohidratos_g = pick(
    "carbohidratos_g",
    "carbohidratos",
    "carbs_g",
    "carbohidratos_diarios_g",
    "carbohidratos_objetivo",
    "carbs",
    "carbohydrates"
  );
  out.peso_actual_kg = pick(
    "peso_actual_kg",
    "peso_actual",
    "weight_kg",
    "current_weight"
  );
  out.peso_objetivo_kg = pick(
    "peso_objetivo_kg",
    "peso_meta",
    "goal_weight",
    "target_weight",
    "target_weight_kg"
  );
  out.tiempo_estimado_semanas = pick(
    "tiempo_estimado_semanas",
    "eta_semanas",
    "tiempo_meta_semanas",
    "estimated_weeks"
  );
  out.tiempo_estimado_meses = pick(
    "tiempo_estimado_meses",
    "eta_meses",
    "estimated_months"
  );
  out.fecha_meta_estimada = pickDateIso(
    "fecha_meta_estimada",
    "meta_fecha",
    "objetivo_fecha_estimada_iso",
    "goal_date_iso"
  );

  // Derivar TDEE desde el perfil si falta
  if (out.tdee == null && profile && typeof profile === "object") {
    const kg = num(
      (profile as any).peso_kg ??
        (profile as any).weight_kg ??
        (profile as any).weight
    );
    const cm = num(
      (profile as any).altura_cm ??
        (profile as any).estatura_cm ??
        (profile as any).height_cm ??
        (profile as any).height
    );
    const age = num((profile as any).edad ?? (profile as any).age);
    const sexRaw = String(
      (profile as any).sexo ?? (profile as any).sex ?? ""
    ).toLowerCase();
    const male = /m|masc|hombre/.test(sexRaw);
    if (kg != null && cm != null && age != null) {
      // Mifflin-St Jeor
      const bmr = male
        ? 10 * kg + 6.25 * cm - 5 * age + 5
        : 10 * kg + 6.25 * cm - 5 * age - 161;
      // Factor de actividad básico
      const actRaw = String(
        (profile as any).actividad ??
          (profile as any).nivel_actividad ??
          (profile as any).activity_level ??
          ""
      ).toLowerCase();
      let factor = 1.4;
      if (/sedent/.test(actRaw)) factor = 1.2;
      else if (/liger|light/.test(actRaw)) factor = 1.375;
      else if (/moderad/.test(actRaw)) factor = 1.55;
      else if (/alto|intens|heavy/.test(actRaw)) factor = 1.725;
      else if (/muy alto|athlete|extrem/.test(actRaw)) factor = 1.9;
      out.tdee = Math.round(bmr * factor);
      // Si no había TMB, aprox con BMR
      if (out.tmb == null) out.tmb = Math.round(bmr);
    }
  }

  // 1) Completar kcal si hay TDEE y déficit/superávit
  if (
    out.kcal_objetivo == null &&
    out.tdee != null &&
    out.deficit_superavit_kcal != null
  ) {
    out.kcal_objetivo = Math.round(out.tdee - out.deficit_superavit_kcal);
  }
  // 1b) Completar kcal desde macros si están los 3
  if (
    out.kcal_objetivo == null &&
    out.proteinas_g != null &&
    out.grasas_g != null &&
    out.carbohidratos_g != null
  ) {
    out.kcal_objetivo = Math.max(
      0,
      Math.round(
        out.proteinas_g * 4 + out.grasas_g * 9 + out.carbohidratos_g * 4
      )
    );
  }
  // 1c) Completar kcal desde TDEE con heurística por objetivo/velocidad si aún falta
  if (out.kcal_objetivo == null && out.tdee != null) {
    const objetivo = String(profile?.objetivo || "").toLowerCase();
    const vel = String(profile?.velocidad_cambio || "").toLowerCase();
    let delta = 0;
    if (/bajar/.test(objetivo)) {
      // Déficit recomendado
      if (/lento/.test(vel)) delta = -450;
      else if (/medio|moderad/.test(vel)) delta = -500;
      else if (/rápid|rapid/.test(vel)) delta = -700;
      else delta = -500; // por defecto
    } else if (/ganar|muscul|subir/.test(objetivo)) {
      // Superávit recomendado
      if (/lento/.test(vel)) delta = 250;
      else if (/medio|moderad/.test(vel)) delta = 350;
      else if (/rápid|rapid/.test(vel)) delta = 500;
      else delta = 300;
    } else {
      delta = 0; // Mantener
    }
    out.kcal_objetivo = Math.max(0, Math.round(out.tdee + delta));
  }

  // 2) Completar macros faltantes con heurística si ya hay kcal
  if (out.kcal_objetivo != null) {
    if (out.grasas_g == null)
      out.grasas_g = Math.max(0, Math.round((out.kcal_objetivo * 0.25) / 9));
    if (out.proteinas_g != null && out.carbohidratos_g == null) {
      out.carbohidratos_g = Math.max(
        0,
        Math.round(
          (out.kcal_objetivo - out.proteinas_g * 4 - out.grasas_g * 9) / 4
        )
      );
    }
  }

  // 3) Completar déficit si falta y hay TDEE + kcal objetivo
  if (
    out.deficit_superavit_kcal == null &&
    out.tdee != null &&
    out.kcal_objetivo != null
  ) {
    out.deficit_superavit_kcal = Math.round(out.tdee - out.kcal_objetivo);
  }

  // 4) Completar ritmo estimado (kg/sem) si hay déficit
  if (out.ritmo_peso_kg_sem == null && out.deficit_superavit_kcal != null) {
    // 7700 kcal ~ 1 kg
    out.ritmo_peso_kg_sem = Number(
      ((out.deficit_superavit_kcal * 7) / 7700) * -1
    );
  }

  // 5) Estimar tiempo para alcanzar el objetivo de peso
  const profileWeight = profile
    ? num((profile as any).peso_kg ?? (profile as any).weight_kg)
    : null;
  const profileTarget = profile
    ? num(
        (profile as any).peso_objetivo_kg ?? (profile as any).target_weight_kg
      )
    : null;
  const currentWeight = out.peso_actual_kg ?? profileWeight;
  const targetWeight = out.peso_objetivo_kg ?? profileTarget;
  if (
    currentWeight != null &&
    targetWeight != null &&
    Math.abs(currentWeight - targetWeight) >= 0.1
  ) {
    const deltaKg = Math.abs(currentWeight - targetWeight);
    out.delta_peso_kg = Number(deltaKg.toFixed(2));
    let ritmoAbs =
      out.ritmo_peso_kg_sem != null
        ? Math.abs(Number(out.ritmo_peso_kg_sem))
        : null;
    if ((!ritmoAbs || ritmoAbs < 0.01) && out.deficit_superavit_kcal != null) {
      ritmoAbs = Math.abs((Number(out.deficit_superavit_kcal) * 7) / 7700);
      if (
        !Number.isNaN(ritmoAbs) &&
        ritmoAbs > 0.01 &&
        out.ritmo_peso_kg_sem == null
      ) {
        out.ritmo_peso_kg_sem =
          currentWeight > targetWeight ? -ritmoAbs : ritmoAbs;
      }
    }
    if (!ritmoAbs || ritmoAbs < 0.01) {
      const vel = String(profile?.velocidad_cambio || "").toLowerCase();
      if (/rap/i.test(vel)) ritmoAbs = 0.9;
      else if (/moder/i.test(vel)) ritmoAbs = 0.6;
      else if (/lent|suav/i.test(vel)) ritmoAbs = 0.4;
      else ritmoAbs = 0.5;
    }
    if (ritmoAbs && ritmoAbs > 0.01) {
      const weeks = Math.min(156, Math.max(0.5, deltaKg / ritmoAbs));
      if (out.tiempo_estimado_semanas == null)
        out.tiempo_estimado_semanas = Number(weeks.toFixed(1));
      if (out.tiempo_estimado_meses == null)
        out.tiempo_estimado_meses = Number((weeks / 4.345).toFixed(1));
      if (!out.fecha_meta_estimada) {
        const eta = new Date();
        eta.setDate(eta.getDate() + Math.round(weeks * 7));
        out.fecha_meta_estimada = eta.toISOString();
      }
    }
  }
  return out;
}

function renderAdviceToHtml(markdown: string): string {
  // 1) Limpieza agresiva: eliminar fences ```...``` (incluye ```json ... ```)
  const withoutFences = markdown.replace(/```[\s\S]*?```/g, "");
  // 2) Quitar cualquier línea que contenga JSON_*, aunque no esté al inicio,
  // títulos o párrafos de hidratación, y recomendaciones directas de agua.
  const noJson = withoutFences
    .split("\n")
    .filter((ln) => !/JSON_(SUMMARY|MEALS|HYDRATION|BEVERAGES)/i.test(ln))
    .filter((ln) => {
      const raw = ln.trim();
      const l = raw.toLowerCase();
      // Encabezados o líneas de hidratación
      if (/^#+\s*hidrataci[oó]n/.test(l)) return false;
      if (/hidrataci[oó]n diaria/.test(l)) return false;
      // Recomendaciones directas de agua
      if (/beber\s+agua/.test(l)) return false;
      if (/bebe\s+agua/.test(l)) return false;
      if (/toma(r)?\s+agua/.test(l)) return false;
      if (/^\s*agua[:\-]/.test(l)) return false;
      // Línea que solo sea la palabra agua
      if (/^agua\.?$/i.test(raw)) return false;
      // Listados de bebidas con ml: eliminar (té, infusiones, gaseosa, mate, café) y cualquier línea con ml de agua
      if (/\b\d{2,4}\s*ml\b/i.test(l)) {
        if (
          /(agua|te\s|t[eé]\s|t[eé]\b|t[eé]\s|té|infusi[oó]n|cafe|caf[eé]|gaseosa|cola|mate)/i.test(
            l
          )
        )
          return false;
      }
      return true;
    })
    .join("\n");

  // 2) Escape basic HTML
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = noJson.split("\n");
  let html = "";
  let inList = false;

  const flushList = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };

  for (let raw of lines) {
    let line = raw.trimEnd();

    // Headings ###, ##, #
    if (/^###\s+/.test(line)) {
      flushList();
      const content = escape(line.replace(/^###\s+/, ""));
      // Bold inline **text**
      const withBold = content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      html += `<h3>${withBold}</h3>`;
      continue;
    }
    if (/^##\s+/.test(line)) {
      flushList();
      const content = escape(line.replace(/^##\s+/, ""));
      const withBold = content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      html += `<h2>${withBold}</h2>`;
      continue;
    }
    if (/^#\s+/.test(line)) {
      flushList();
      const content = escape(line.replace(/^#\s+/, ""));
      const withBold = content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      html += `<h1>${withBold}</h1>`;
      continue;
    }

    // List items: lines starting with "* " or "- "
    if (/^(\*|-)\s+/.test(line)) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      const content = escape(line.replace(/^(\*|-)\s+/, "")).replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>"
      );
      html += `<li>${content}</li>`;
      continue;
    } else {
      flushList();
    }

    // Empty line
    if (line.trim() === "") {
      html += "<br/>";
      continue;
    }

    // Paragraph with bold support
    const content = escape(line).replace(
      /\*\*(.+?)\*\*/g,
      "<strong>$1</strong>"
    );
    html += `<p>${content}</p>`;
  }

  flushList();
  return html;
}

// Convierte el markdown del consejo a texto plano legible para PDF (sin asteriscos/markup)
function renderAdviceToPlain(markdown: string): string {
  // 1) Eliminar fences ```...``` completos
  const withoutFences = markdown.replace(/```[\s\S]*?```/g, "");
  // 2) Eliminar cualquier línea que contenga JSON_* y referencias directas a hidratación/agua.
  const noJson = withoutFences
    .split("\n")
    .filter((ln) => !/JSON_(SUMMARY|MEALS|HYDRATION|BEVERAGES)/i.test(ln))
    .filter((ln) => {
      const raw = ln.trim();
      const l = raw.toLowerCase();
      if (/^#+\s*hidrataci[oó]n/.test(l)) return false;
      if (/hidrataci[oó]n diaria/.test(l)) return false;
      if (/beber\s+agua/.test(l)) return false;
      if (/bebe\s+agua/.test(l)) return false;
      if (/toma(r)?\s+agua/.test(l)) return false;
      if (/^\s*agua[:\-]/.test(l)) return false;
      if (/^agua\.?$/i.test(raw)) return false;
      if (/\b\d{2,4}\s*ml\b/i.test(l)) {
        if (
          /(agua|te\s|t[eé]\s|té|infusi[oó]n|cafe|caf[eé]|gaseosa|cola|mate)/i.test(
            l
          )
        )
          return false;
      }
      return true;
    })
    .join("\n");
  const lines = noJson.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (let raw of lines) {
    let line = raw.trimEnd();
    // Quitar backticks y negritas
    line = line.replace(/`+/g, "");
    line = line.replace(/\*\*(.+?)\*\*/g, "$1");
    // Headings -> texto simple con espacio previo
    if (/^###\s+/.test(line)) {
      out.push("");
      out.push(line.replace(/^###\s+/, ""));
      continue;
    }
    if (/^##\s+/.test(line)) {
      out.push("");
      out.push(line.replace(/^##\s+/, ""));
      continue;
    }
    if (/^#\s+/.test(line)) {
      out.push("");
      out.push(line.replace(/^#\s+/, ""));
      continue;
    }
    // Listas -> viñetas
    if (/^(\*|-)\s+/.test(line)) {
      out.push("• " + line.replace(/^(\*|-)\s+/, ""));
      continue;
    }
    // Línea vacía -> mantener separación
    if (line.trim() === "") {
      out.push("");
      continue;
    }
    out.push(line);
  }
  // Compactar múltiples saltos en máx 2
  const compact: string[] = [];
  let emptyRun = 0;
  for (const l of out) {
    if (l.trim() === "") {
      emptyRun++;
      if (emptyRun <= 2) compact.push("");
    } else {
      emptyRun = 0;
      compact.push(l);
    }
  }
  return compact.join("\n");
}

export default function OnboardingAdvicePage() {
  const router = useRouter();
  const { update } = useSession();
  // Nuevo: detectar si debe invalidar cache (siempre que se entra a esta página forzamos regeneración limpia)
  const [forceInvalidate] = useState(true);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState<string>("");
  const [summary, setSummary] = useState<any | null>(null);
  const [mealItems, setMealItems] = useState<any[] | null>(null);
  const [hydrationLiters, setHydrationLiters] = useState<number | null>(null);
  // rawBeverages: respuesta directa de la IA (sin procesar)
  const [rawBeverages, setRawBeverages] = useState<any[] | null>(null);
  // beverages: bebidas finales procesadas (deduplicadas + distribución de "General")
  const [beverages, setBeverages] = useState<any[] | null>(null); // {nombre, ml, momento}
  const [savingMeals, setSavingMeals] = useState(false); // (preview only now; no persist until completion elsewhere)
  const [profile, setProfile] = useState<any | null>(null);
  const [weekly, setWeekly] = useState<any | null>(null);
  const [loadingWeekly, setLoadingWeekly] = useState<boolean>(true);
  const syncWeeklyFromAdvice = useCallback((payload: any) => {
    const payloadWeekly = (() => {
      if (Array.isArray(payload?.weekly) && payload.weekly.length)
        return payload.weekly;
      if (Array.isArray(payload?.meals?.weekly) && payload.meals.weekly.length)
        return payload.meals.weekly;
      return null;
    })();
    if (payloadWeekly) {
      setWeekly({ weekly: payloadWeekly, source: "ai" });
      setLoadingWeekly(false);
    } else {
      setWeekly((prev: any) => (prev?.source === "ai" ? null : prev));
    }
  }, []);
  // Summary normalizado para uso consistente (PDF, vista semanal, persistencia)
  const normSummary = useMemo(() => {
    const raw =
      summary && typeof summary === "object"
        ? summary.summary || summary.objetivos || summary
        : summary;
    return normalizeSummary(raw, profile);
  }, [summary, profile]);
  const [proposals, setProposals] = useState<any[] | null>(null);
  const [schedule, setSchedule] = useState<Record<string, string> | null>(null);
  const [showBaseProposals, setShowBaseProposals] = useState<boolean>(false);
  const [showFullAdvice, setShowFullAdvice] = useState<boolean>(false);
  // Variantes propuestas por la IA por tipo: { Desayuno: [...], Almuerzo: [...], ... }
  const [mealVariants, setMealVariants] = useState<Record<
    string,
    any[]
  > | null>(null);
  // Progreso sintético y ETA mientras se genera el consejo (sin streaming real todavía)
  const [progress, setProgress] = useState<number>(0); // 0..100
  const [etaSec, setEtaSec] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startRef = useRef<number | null>(null);
  const expectedRef = useRef<number>(20000); // ms estimados
  const intervalRef = useRef<any>(null);
  // Evitar doble envío al finalizar
  const [finishing, setFinishing] = useState(false);
  // Modo estricto: si la URL trae ai_strict=1, no forzamos fallback del lado cliente
  const [aiStrict, setAiStrict] = useState<boolean>(true);
  const [pdfDebug, setPdfDebug] = useState<boolean>(false);
  const formatEtaDate = (iso?: string | null) => {
    if (!iso) return null;
    try {
      return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };
  const summaryHighlights = useMemo(() => {
    if (!normSummary && hydrationLiters == null) return null;
    const kcal =
      normSummary?.kcal_objetivo != null
        ? `${Math.round(normSummary.kcal_objetivo)} kcal`
        : "—";
    const prote =
      normSummary?.proteinas_g != null
        ? `${Math.round(normSummary.proteinas_g)} g`
        : "—";
    const fats =
      normSummary?.grasas_g != null
        ? `${Math.round(normSummary.grasas_g)} g`
        : "—";
    const carbs =
      normSummary?.carbohidratos_g != null
        ? `${Math.round(normSummary.carbohidratos_g)} g`
        : "—";
    const fallbackWater =
      normSummary?.agua_litros_obj != null
        ? `${Number(normSummary.agua_litros_obj).toFixed(2)} L`
        : "—";
    const water =
      typeof hydrationLiters === "number"
        ? `${hydrationLiters.toFixed(2)} L`
        : fallbackWater;
    const etaWeeks =
      typeof normSummary?.tiempo_estimado_semanas === "number"
        ? normSummary.tiempo_estimado_semanas
        : null;
    const etaText = etaWeeks != null ? `${etaWeeks.toFixed(1)} sem` : "—";
    const etaMonths =
      typeof normSummary?.tiempo_estimado_meses === "number"
        ? `${normSummary.tiempo_estimado_meses.toFixed(1)} meses`
        : null;
    const etaDate =
      formatEtaDate(normSummary?.fecha_meta_estimada || null) ?? "—";
    const delta =
      typeof normSummary?.delta_peso_kg === "number"
        ? `${normSummary.delta_peso_kg.toFixed(1)} kg por cambiar`
        : null;
    const ritmo =
      typeof normSummary?.ritmo_peso_kg_sem === "number"
        ? `${Math.abs(normSummary.ritmo_peso_kg_sem).toFixed(2)} kg/sem`
        : null;
    return {
      kcal,
      prote,
      fats,
      carbs,
      water,
      etaText,
      etaMonths,
      etaDate,
      delta,
      ritmo,
    };
  }, [hydrationLiters, normSummary]);
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      setAiStrict(u.searchParams.get("ai_strict") === "1");
      setPdfDebug(u.searchParams.get("pdfDebug") === "1");
    } catch {}
  }, []);
  // Construir URL del endpoint con flags + propagación de params de la página
  function buildAdviceUrl() {
    try {
      const url = new URL(
        typeof window !== "undefined"
          ? window.location.href
          : "http://localhost"
      );
      const base = new URL("/api/account/advice", url.origin);
      // Propagar params existentes útiles
      const params = new URLSearchParams(url.search);
      // Flags para mejorar estabilidad y evitar fast fallback
      params.set("ai_strict", "1");
      params.set("ensureFull", "0");
      params.set("maxTokens", "3072");
      params.set("preferAlt", "1");
      // Timeouts ampliados para dar tiempo a la IA
      params.set("flashMs", "60000");
      params.set("longMs", "120000");
      params.set("fallbackMs", "45000");
      // Pide al servidor esperar al menos 4 min antes de permitir fallback local
      params.set("minFallbackMs", "240000");
      // Forzar el modelo que te funciona si no viene en la URL actual
      if (!params.has("model")) params.set("model", "models/gemini-2.0-flash");
      if (!params.has("alt")) params.set("alt", "models/gemini-2.0-flash");
      params.delete("forceLong");
      base.search = params.toString();
      return base.pathname + (base.search ? base.search : "");
    } catch {
      return "/api/account/advice";
    }
  }
  // Agregar helper para limpiar estado local y remoto
  async function resetAdviceState(options: { navigateBack?: boolean } = {}) {
    try {
      // Limpiar localStorage flags
      try {
        localStorage.removeItem("advice_last_ms");
      } catch {}
      try {
        localStorage.removeItem("advice_show_full");
      } catch {}
    } catch {}
    // Limpiar estado react
    setError(null);
    setText("");
    setSummary(null);
    setMealItems(null);
    setMealVariants(null);
    setHydrationLiters(null);
    setRawBeverages(null);
    setWeekly(null);
    setBeverages(null);
    setWeekly(null);
    setProgress(0);
    setEtaSec(null);
    // Invalidar cache servidor
    try {
      await fetch("/api/account/advice?invalidate=1", { method: "POST" });
    } catch {}
    if (options.navigateBack) {
      router.push("/onboarding/review");
    }
  }
  // Construir vista previa efímera a partir de mealItems (AI) si no hay weekly.weekly o para reemplazar cualquier plan previo guardado.
  const ephemeralWeekly = useMemo(() => {
    if (
      weekly?.source === "ai" &&
      Array.isArray(weekly.weekly) &&
      weekly.weekly.length
    ) {
      return weekly.weekly;
    }
    // Construye un plan semanal rotado SOLO en memoria partiendo de mealItems (IA) o, si no hay,
    // de un set mínimo generado localmente según enabledMeals del perfil.
    const hasVariants =
      mealVariants &&
      typeof mealVariants === "object" &&
      Object.keys(mealVariants).length > 0;

    // Heurística para medidas caseras (similar a weekly-proposals backend) para mostrar peso y medida.
    function householdMeasure(name: string, grams: number) {
      const n = String(name || "").toLowerCase();
      const g = Number(grams) || 0;
      const approx = (val: number, base: number) =>
        Math.abs(val - base) <= base * 0.25;
      if (/arroz/.test(n)) {
        if (approx(g, 90)) return "1/2 taza";
        if (approx(g, 180)) return "1 taza";
      }
      if (/pollo|pechuga|filete/.test(n)) {
        if (approx(g, 120)) return "1 filete mediano";
      }
      if (/papa|patata/.test(n)) {
        if (approx(g, 150)) return "1 papa mediana";
      }
      if (
        /nuez|almendra|mani|maní|pistacho|avellana|frutos?\s*secos|semilla/.test(
          n
        )
      ) {
        if (approx(g, 30)) return "1 puñado";
      }
      if (/huevo/.test(n)) {
        if (approx(g, 100)) return "2 huevos";
      }
      if (/pan.*integral|pan/.test(n)) {
        if (approx(g, 40)) return "1 rebanada";
      }
      if (/yogur|yogurt/.test(n)) {
        if (approx(g, 200)) return "1 taza";
      }
      if (
        /verdura|ensalada|br[oó]coli|espinaca|zanahoria|pepino|tomate|lechuga/.test(
          n
        )
      ) {
        if (approx(g, 150)) return "1 taza";
      }
      if (/avena/.test(n)) {
        if (approx(g, 30)) return "3 cucharadas";
      }
      if (/banana|pl[aá]tano|manzana/.test(n)) {
        if (approx(g, 120) || approx(g, 150)) return "1 pieza mediana";
      }
      return "";
    }

    function parseInlineIngredients(description: string) {
      const items: Array<{
        nombre: string;
        gramos?: number;
        qtyLabel?: string;
      }> = [];
      if (!description) return items;
      const text = description.replace(/\*/g, " ");
      const qtyRegex =
        /([^.,;:\n]+?)\s*\((\d+(?:[\.,]\d+)?)\s*(g|gr|gramos|kg|ml|l|cc|unidades?|unidad|pieza(?:s)?|piezas|taza(?:s)?|cucharad(?:a|ita)s?|puñado(?:s)?|rebanada(?:s)?|porciones?|cups?)\)/gi;
      let match: RegExpExecArray | null;
      while ((match = qtyRegex.exec(text)) !== null) {
        const rawName = match[1].replace(/^(?:y|con)\s+/i, "").trim();
        if (!rawName) continue;
        const amount = match[2].replace(",", ".");
        const unit = match[3].toLowerCase();
        const isGram = /^(g|gr|gram|gramos)$/i.test(unit);
        const gramos = isGram ? Number(amount) : undefined;
        const normalizedUnit = isGram ? "g" : match[3].trim();
        const qtyLabel = `${amount} ${normalizedUnit}`.trim();
        items.push({ nombre: rawName, gramos, qtyLabel });
      }
      if (!items.length) {
        const segments = text
          .split(/[,.;]|\by\b|\bcon\b/i)
          .map((seg) => seg.trim())
          .filter(Boolean);
        segments.forEach((segment) => {
          const clean = segment.replace(/^(?:y|con)\s+/i, "").trim();
          if (clean) items.push({ nombre: clean });
        });
      }
      return items;
    }

    // Limpiar títulos de comidas generados por la IA: eliminar cantidades, unidades y paréntesis
    function sanitizeMealTitle(raw: string | null | undefined) {
      if (!raw || typeof raw !== "string") return raw || "";
      let s = raw;
      // Quitar contenido entre paréntesis y corchetes
      s = s.replace(/\([^)]*\)/g, "");
      s = s.replace(/\[[^\]]*\]/g, "");
      // Quitar patrones de cantidad (80g, 250 ml, 15 g, 150g, 1 taza, 2 unidades, etc.)
      s = s.replace(
        /\b\d+[\.,]?\d*\s*(g|gr|grs|gramo(?:s)?|kg|mg|ml|l|taza(?:s)?|cucharad(?:a|as)|unidad(?:es)?|unidades|u)\b/gi,
        ""
      );
      s = s.replace(/\b\d+[\.,]?\d*(ml|g|l)\b/gi, "");
      // Quitar indicadores tipo '- 27 g proteína' al final
      s = s.replace(
        /[-–—]\s*\d+[\.,]?\d*\s*(g|gr|grs|gramo(?:s)?|ml|l).*/i,
        ""
      );
      // Quitar números sueltos que no aporten al título (pero no eliminar letras)
      s = s.replace(/\b\d+\b/g, "");
      // Normalizar comas y espacios
      s = s
        .replace(/\s{2,}/g, " ")
        .replace(/\s*,\s*/g, ", ")
        .trim();
      // Eliminar comas iniciales o finales
      s = s.replace(/^,\s*/g, "").replace(/\s*,\s*$/g, "");
      return s;
    }

    // Leer enabledMeals del perfil para saber si hay snacks separados mañana/tarde
    let enabledMeals: any = null;
    try {
      const raw = profile?.preferencias_alimentos;
      if (raw) {
        enabledMeals =
          typeof raw === "string"
            ? JSON.parse(raw)?.enabledMeals
            : raw?.enabledMeals;
      }
    } catch {}
    const snackManana =
      enabledMeals?.snack_manana || enabledMeals?.["snack_mañana"] || false;
    const snackTarde = enabledMeals?.snack_tarde || false;
    const separateSnacks = snackManana && snackTarde;
    // Normalized flags used later
    const wantsSnackManana = Boolean(snackManana);
    const wantsSnackTarde = Boolean(snackTarde);

    // Agrupar por tipo para poder rotar. Si hay 2 snacks distintos y la IA entregó items tipo "Snack",
    // asignar alternadamente Snack_manana / Snack_tarde. Priorizar variantes de la IA si existen.
    const mealsByType: Record<string, any[]> = {};
    if (hasVariants) {
      const mapKeys = (k: string) =>
        /^desayuno$/i.test(k)
          ? "Desayuno"
          : /^almuerzo|comida|lunch$/i.test(k)
          ? "Almuerzo"
          : /^cena|dinner$/i.test(k)
          ? "Cena"
          : "Snack";
      for (const [rawType, arr] of Object.entries(mealVariants!)) {
        const tipo = mapKeys(rawType);
        const list = Array.isArray(arr) ? arr.filter(Boolean) : [];
        if (list.length) mealsByType[tipo] = list;
      }
    }
    if (!Object.keys(mealsByType).length && Array.isArray(mealItems)) {
      let snackToggle = 0;
      const normTipo = (raw: any) => {
        const s = String(raw || "").toLowerCase();
        if (/desayuno|breakfast|mañana|morning/.test(s)) return "Desayuno";
        if (/almuerzo|comida|lunch|mediod[ií]a|medio dia/.test(s))
          return "Almuerzo";
        if (/cena|dinner|noche|night/.test(s)) return "Cena";
        if (/snack|merienda|colaci[oó]n|tentempi[ée]/.test(s)) return "Snack";
        return "Comida";
      };
      for (const mOrig of mealItems) {
        const m = { ...mOrig } as any;
        // Mapear nombre desde claves comunes si falta
        if (m && m.nombre == null) {
          const name = m.name ?? m.titulo ?? m.title ?? null;
          if (name) m.nombre = sanitizeMealTitle(name);
        }
        // Normalizar tipo tomando posibles claves alternativas
        let tipo = normTipo(m?.tipo ?? m?.type ?? m?.meal_type);
        if (/^snack$/i.test(tipo) && separateSnacks) {
          tipo = snackToggle % 2 === 0 ? "Snack_manana" : "Snack_tarde";
          snackToggle++;
        }
        if (!mealsByType[tipo]) mealsByType[tipo] = [];
        mealsByType[tipo].push(m);
      }
    }

    // Si seguimos sin items (IA no entregó JSON_MEALS ni variantes), intentar parsear el texto largo del consejo
    if (
      !Object.keys(mealsByType).length &&
      typeof text === "string" &&
      text.trim().length
    ) {
      try {
        const lines = text.replace(/\r\n/g, "\n").split("\n");
        const dayHeader = /^\s*(D[ií]A|DIA)\s*\d+/i;
        const mealHeader =
          /\b(Desayuno|Almuerzo|Comida|Cena|Snack\s*1|Snack\s*2|Snack)\s*:/i;
        type TmpMeal = {
          tipo: string;
          nombre: string;
          ingredientes: {
            nombre: string;
            gramos?: number;
            qtyLabel?: string;
          }[];
        };
        const tmp: Record<string, TmpMeal[]> = {};
        let currentMeal: TmpMeal | null = null;
        for (let i = 0; i < lines.length; i++) {
          const ln = lines[i].trim();
          if (!ln) continue;
          if (dayHeader.test(ln)) {
            currentMeal = null;
            continue;
          }
          // Detectar encabezados de comida tipo "• Desayuno: Nombre ..." o "- Cena: ..."
          const headMatch = ln.match(
            /^[•\-*\u2022\s]*\s*(Desayuno|Almuerzo|Comida|Cena|Snack(?:\s*\d+)?)\s*(?:\([^)]*\)|\[[^\]]*\]|[-–][^:]+)?\s*:\s*(.+)$/i
          );
          if (headMatch) {
            let tipo = headMatch[1];
            const nombre = headMatch[2].trim();
            if (/comida/i.test(tipo)) tipo = "Almuerzo";
            if (/snack/i.test(tipo)) {
              if (separateSnacks)
                tipo =
                  !tmp["Snack_manana"] ||
                  (tmp["Snack_manana"] || []).length <=
                    (tmp["Snack_tarde"] || []).length
                    ? "Snack_manana"
                    : "Snack_tarde";
              else tipo = "Snack";
            }
            const rawTitle =
              (nombre && nombre.split(/[.]/)[0]?.trim()) || nombre;
            const displayName = sanitizeMealTitle(rawTitle);
            currentMeal = { tipo, nombre: displayName, ingredientes: [] };
            const inlineIngs = parseInlineIngredients(nombre);
            if (inlineIngs.length) currentMeal.ingredientes.push(...inlineIngs);
            if (!tmp[tipo]) tmp[tipo] = [];
            tmp[tipo].push(currentMeal);
            continue;
          }
          // Capturar ingredientes básicos en líneas que empiecen con "* "
          if (currentMeal && /^\*\s+/.test(ln)) {
            const raw = ln.replace(/^\*\s+/, "").trim();
            // Extraer nombre y gramos aproximados si los hay
            const gramsMatch = raw.match(/(\d{2,4})\s*g\b/i);
            const nombre = raw
              .replace(/\([^)]*\)/g, "")
              .replace(/\d+\s*g/gi, "")
              .replace(/\s{2,}/g, " ")
              .trim()
              .replace(/^[\-•]\s*/, "");
            const gramos = gramsMatch ? Number(gramsMatch[1]) : undefined;
            currentMeal.ingredientes.push({ nombre, gramos });
            continue;
          }
          // Si viene otra viñeta o separador, terminar ingredientes
          if (/^---+$/.test(ln)) {
            currentMeal = null;
            continue;
          }
        }
        // Pasar tmp a mealsByType si se detectó algo
        const keys = Object.keys(tmp);
        if (keys.length) {
          for (const k of keys) {
            const list = tmp[k].filter(Boolean);
            if (list.length) mealsByType[k] = list as any[];
          }
        }
      } catch {}
    }

    // NOTE: Fallback generation of basic meals removed — IA is expected to provide meals.

    // Normalización: asegurar que los tipos requeridos por enabledMeals existan como buckets
    const requiredTypes: string[] = [];
    if (enabledMeals?.desayuno) requiredTypes.push("Desayuno");
    if (enabledMeals?.almuerzo) requiredTypes.push("Almuerzo");
    if (enabledMeals?.cena) requiredTypes.push("Cena");
    if (wantsSnackManana && wantsSnackTarde) {
      requiredTypes.push("Snack_manana", "Snack_tarde");
    } else if (wantsSnackManana || wantsSnackTarde) {
      requiredTypes.push("Snack");
    }

    // Si el usuario quiere dos snacks separados pero solo hay 'Snack' genérico, clonar para crear ambos buckets
    if (wantsSnackManana && wantsSnackTarde) {
      const genericSnack = mealsByType["Snack"] || [];
      if (
        !mealsByType["Snack_manana"] &&
        (mealsByType["Snack_tarde"] || genericSnack.length)
      ) {
        mealsByType["Snack_manana"] =
          mealsByType["Snack_tarde"] && mealsByType["Snack_tarde"].length
            ? JSON.parse(JSON.stringify(mealsByType["Snack_tarde"]))
            : JSON.parse(JSON.stringify(genericSnack));
      }
      if (
        !mealsByType["Snack_tarde"] &&
        (mealsByType["Snack_manana"] || genericSnack.length)
      ) {
        mealsByType["Snack_tarde"] =
          mealsByType["Snack_manana"] && mealsByType["Snack_manana"].length
            ? JSON.parse(JSON.stringify(mealsByType["Snack_manana"]))
            : JSON.parse(JSON.stringify(genericSnack));
      }
    }

    // Asegurar que todos los requiredTypes existan; si falta alguno, clonar del más parecido
    for (const t of requiredTypes) {
      if (!mealsByType[t] || !mealsByType[t].length) {
        if (/Snack/.test(t)) {
          const src =
            mealsByType["Snack"] ||
            mealsByType["Snack_manana"] ||
            mealsByType["Snack_tarde"] ||
            [];
          if (src.length) mealsByType[t] = JSON.parse(JSON.stringify(src));
        } else {
          // Para comidas principales, clonar de otro principal si existe
          const src =
            mealsByType["Almuerzo"] ||
            mealsByType["Cena"] ||
            mealsByType["Desayuno"] ||
            [];
          if (src.length) mealsByType[t] = JSON.parse(JSON.stringify(src));
        }
        if (!mealsByType[t]) mealsByType[t] = [];
      }
    }
    // Determinar días activos según dias_dieta del perfil (1..7). Si no hay valor válido, usar los 7.
    const allDayNames = [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ];
    const dietDaysCount =
      typeof (profile as any)?.dias_dieta === "number" &&
      (profile as any).dias_dieta >= 1 &&
      (profile as any).dias_dieta <= 7
        ? (profile as any).dias_dieta
        : 7;
    const dayNames = allDayNames.slice(0, dietDaysCount);
    // Patrón solicitado: L/J (0), M/V (1), Mi/S (2), Domingo distinto (3) solo si llega a Domingo.
    const rotationIndex: Record<string, number> = {
      Lunes: 0,
      Jueves: 0,
      Martes: 1,
      Viernes: 1,
      Miércoles: 2,
      Sábado: 2,
      Domingo: 3,
    };
    const rotationIndexList = dayNames.map((d) => rotationIndex[d] ?? 0);
    const maxRotIndex = rotationIndexList.length
      ? Math.max(...rotationIndexList)
      : 0;
    const requiredVariants = Math.min(Math.max(maxRotIndex + 1, 1), 4); // 1..4

    // Normalizar arrays generando variantes sintéticas hasta cubrir requiredVariants.
    Object.keys(mealsByType).forEach((k) => {
      const arr = mealsByType[k];
      if (!Array.isArray(arr) || arr.length === 0) {
        delete mealsByType[k];
        return;
      }
      // Detectar posibles proteínas alternativas del perfil para variar entre variantes.
      let candidateProteins: string[] = [];
      let candidateCarbs: string[] = [];
      let candidateFats: string[] = [];
      let candidateVeggies: string[] = [];
      let candidateFruits: string[] = [];
      let candidateSnacks: string[] = [];
      try {
        const prefRaw = profile?.preferencias_alimentos;
        let pref: any = null;
        if (prefRaw)
          pref = typeof prefRaw === "string" ? JSON.parse(prefRaw) : prefRaw;
        // Heurística: recolectar strings en cualquier array anidada.
        const proteinRegex =
          /atun|atún|salmon|salmón|pollo|pavo|carne|cerdo|res|vacuno|huevo|clara|tofu|lenteja|garbanzo|frijol|soja|soya|tempeh|queso|yogur|caballa|sardina|marisco|camaron|camarón|langostino|tilapia|merluza|bacalao|pechuga|proteina/i;
        const carbRegex =
          /arroz|pasta|papa|patata|batata|quinoa|avena|pan|tortilla|arepa|cuscus|cuscús|fideo|noodle|yuca|mandioca|maiz|maíz/i;
        const fatRegex =
          /aguacate|palta|aceite|oliva|mani|maní|almendra|nuez|nueces|pistacho|avellana|mantequilla de mani|mantequilla de maní|cacahuete|semilla|chia|chía|linaza|ajonjoli|sésamo|sesamo|manteca de cacahuete/i;
        const vegRegex =
          /brocoli|brócoli|espinaca|zanahoria|pepino|lechuga|tomate|berenjena|calabacin|calabacín|pimiento|coliflor|verdura|acelga|apio|repollo|col|remolacha|betabel/i;
        const fruitRegex =
          /manzana|banana|plátano|platano|pera|fresa|fresas|frutilla|naranja|mandarina|uva|mango|kiwi|papaya|melon|melón|sandia|sandía|arándano|arandano|frambuesa|piña|anana|arándanos/i;
        const snackRegex =
          /barra|granola|yogur|yogurt|frutos secos|mix|tostada|galleta|cookie|snack|batido|smoothie|chips|tortitas|tortita/i;
        const seen = new Set<string>();
        function collect(o: any) {
          if (!o) return;
          if (Array.isArray(o)) {
            o.forEach(collect);
            return;
          }
          if (typeof o === "string") {
            const low = o.toLowerCase();
            if (proteinRegex.test(o) && !seen.has("p:" + low)) {
              seen.add("p:" + low);
              candidateProteins.push(o);
            }
            if (carbRegex.test(o) && !seen.has("c:" + low)) {
              seen.add("c:" + low);
              candidateCarbs.push(o);
            }
            if (fatRegex.test(o) && !seen.has("f:" + low)) {
              seen.add("f:" + low);
              candidateFats.push(o);
            }
            if (vegRegex.test(o) && !seen.has("v:" + low)) {
              seen.add("v:" + low);
              candidateVeggies.push(o);
            }
            if (fruitRegex.test(o) && !seen.has("fr:" + low)) {
              seen.add("fr:" + low);
              candidateFruits.push(o);
            }
            if (snackRegex.test(o) && !seen.has("s:" + low)) {
              seen.add("s:" + low);
              candidateSnacks.push(o);
            }
            return;
          }
          if (typeof o === "object") {
            Object.values(o).forEach(collect);
          }
        }
        collect(pref);
      } catch {}
      // También añadir proteínas presentes ya en las comidas base de este tipo.
      const proteinRegex2 =
        /atun|atún|salmon|salmón|pollo|pavo|carne|cerdo|res|vacuno|huevo|tofu|lenteja|garbanzo|frijol|soja|soya|tempeh|queso|yogur|caballa|sardina|camaron|camarón|langostino|tilapia|merluza|bacalao|pechuga/i;
      const carbRegex2 =
        /arroz|pasta|papa|patata|batata|quinoa|avena|pan|tortilla|arepa|cuscus|cuscús|fideo|noodle|yuca|mandioca|maiz|maíz/i;
      const fatRegex2 =
        /aguacate|palta|aceite|oliva|mani|maní|almendra|nuez|nueces|pistacho|avellana|mantequilla de mani|mantequilla de maní|cacahuete|semilla|chia|chía|linaza|ajonjoli|sésamo|sesamo|manteca de cacahuete/i;
      const vegRegex2 =
        /brocoli|brócoli|espinaca|zanahoria|pepino|lechuga|tomate|berenjena|calabacin|calabacín|pimiento|coliflor|verdura|acelga|apio|repollo|col|remolacha|betabel/i;
      const fruitRegex2 =
        /manzana|banana|plátano|platano|pera|fresa|fresas|frutilla|naranja|mandarina|uva|mango|kiwi|papaya|melon|melón|sandia|sandía|arándano|arandano|frambuesa|piña|anana|arándanos/i;
      const snackRegex2 =
        /barra|granola|yogur|yogurt|frutos secos|mix|tostada|galleta|cookie|snack|batido|smoothie|chips|tortitas|tortita/i;
      arr.forEach((m) => {
        if (Array.isArray(m?.ingredientes)) {
          for (const ing of m.ingredientes) {
            const nm = (ing?.nombre || ing?.name || "").toString();
            const low = nm.toLowerCase();
            if (
              proteinRegex2.test(nm) &&
              !candidateProteins.some((p) => p.toLowerCase() === low)
            )
              candidateProteins.push(nm);
            if (
              carbRegex2.test(nm) &&
              !candidateCarbs.some((p) => p.toLowerCase() === low)
            )
              candidateCarbs.push(nm);
            if (
              fatRegex2.test(nm) &&
              !candidateFats.some((p) => p.toLowerCase() === low)
            )
              candidateFats.push(nm);
            if (
              vegRegex2.test(nm) &&
              !candidateVeggies.some((p) => p.toLowerCase() === low)
            )
              candidateVeggies.push(nm);
            if (
              fruitRegex2.test(nm) &&
              !candidateFruits.some((p) => p.toLowerCase() === low)
            )
              candidateFruits.push(nm);
            if (
              snackRegex2.test(nm) &&
              !candidateSnacks.some((p) => p.toLowerCase() === low)
            )
              candidateSnacks.push(nm);
          }
        }
      });
      // Limitar a máximo 8 para evitar explosión.
      candidateProteins = candidateProteins.slice(0, 8);
      candidateCarbs = candidateCarbs.slice(0, 8);
      candidateFats = candidateFats.slice(0, 8);
      candidateVeggies = candidateVeggies.slice(0, 12);
      candidateFruits = candidateFruits.slice(0, 8);
      candidateSnacks = candidateSnacks.slice(0, 8);

      const genericNameTokens = new Set([
        "proteina",
        "proteína",
        "proteins",
        "protein",
        "proteico",
        "grasas",
        "grasa",
        "carbohidratos",
        "carbohidrato",
        "carbs",
        "snack",
        "colacion",
        "colación",
        "tentempié",
        "meal",
        "comida",
        "desayuno",
        "almuerzo",
        "cena",
        "base",
        "default",
        "variante",
        "variantea",
        "varianteb",
        "opcion",
        "opción",
        "opciones",
        "macro",
        "macros",
        "plato",
        "general",
      ]);

      function titleCaseBasic(str: string): string {
        return str
          .replace(/[_\s]+/g, " ")
          .trim()
          .replace(
            /(^|\s)([a-záéíóúñ])/gi,
            (_, p1: string, p2: string) => `${p1}${p2.toUpperCase()}`
          );
      }

      function isMeaningfulMealName(
        name: string | null | undefined,
        tipo: string
      ): boolean {
        if (!name) return false;
        const clean = name.trim();
        if (!clean) return false;
        const lower = clean.toLowerCase();
        const normalizedTipo = tipo.replace(/_/g, " ").toLowerCase();
        if (lower === normalizedTipo) return false;
        if (lower === `${normalizedTipo} base`) return false;
        if (lower.length <= 4) return false;
        const tokens = lower.split(/[^a-záéíóúñü]+/i).filter(Boolean);
        if (!tokens.length) return false;
        const hasFoodWord = tokens.some(
          (token) => !genericNameTokens.has(token)
        );
        return hasFoodWord;
      }

      function friendlyMealName(
        tipoComida: string,
        ingredientes: any[],
        variantIndex: number,
        fallbackName: string
      ): string {
        const fallback = fallbackName
          ? fallbackName.replace(/_/g, " ").trim()
          : tipoComida;
        const seen = new Set<string>();
        const cleaned: Array<{ raw: string; lower: string }> = [];
        ingredientes.forEach((ing: any) => {
          const raw = (ing?.nombre || ing?.name || "").toString();
          if (!raw) return;
          const base = raw.replace(/\s*\([^)]*\)\s*/g, "").trim();
          if (!base) return;
          const low = base.toLowerCase();
          if (seen.has(low)) return;
          seen.add(low);
          cleaned.push({ raw: base, lower: low });
        });
        const pick = (regex: RegExp) => {
          const found = cleaned.find((it) => regex.test(it.lower));
          return found ? found.raw : "";
        };
        const prot = pick(proteinRegex2);
        const carb = pick(carbRegex2);
        const veg = pick(vegRegex2);
        const fat = pick(fatRegex2);
        const fruit = pick(fruitRegex2);
        const snack = pick(snackRegex2);

        let base = "";
        if (/snack/i.test(tipoComida)) {
          const main =
            snack || fruit || prot || cleaned[0]?.raw || fallback || tipoComida;
          const extras = [fruit, prot, fat].filter(
            (val) => val && val !== main
          );
          if (extras.length >= 2) {
            base = `${main} con ${extras[0]} y ${extras[1]}`;
          } else if (extras.length === 1) {
            base = `${main} con ${extras[0]}`;
          } else {
            base = main;
          }
        } else if (/desayuno|breakfast/i.test(tipoComida)) {
          const main =
            carb || prot || fruit || cleaned[0]?.raw || fallback || tipoComida;
          const extras = [prot, fruit, fat].filter(
            (val) => val && val !== main
          );
          if (extras.length >= 2) {
            base = `${main} con ${extras[0]} y ${extras[1]}`;
          } else if (extras.length === 1) {
            base = `${main} con ${extras[0]}`;
          } else {
            base = main;
          }
        } else {
          const main = prot || cleaned[0]?.raw || fallback || tipoComida;
          const extras = [carb, veg, fat].filter((val) => val && val !== main);
          if (extras.length >= 2) {
            base = `${main} con ${extras[0]} y ${extras[1]}`;
          } else if (extras.length === 1) {
            base = `${main} con ${extras[0]}`;
          } else {
            base = main;
          }
        }

        const pretty = titleCaseBasic(base || fallback || tipoComida);
        if (variantIndex <= 0) return pretty;
        return `${pretty} (Opción ${String.fromCharCode(65 + variantIndex)})`;
      }

      function ensureVariants(list: any[], need: number) {
        const baseOriginal = list[0];
        if (!baseOriginal) return;
        while (list.length < need) {
          const variantIndex = list.length;
          const clone = JSON.parse(JSON.stringify(baseOriginal));
          if (!Array.isArray(clone.ingredientes)) clone.ingredientes = [];
          if (clone.ingredientes.length > 1) {
            const shift = variantIndex % clone.ingredientes.length;
            clone.ingredientes = [
              ...clone.ingredientes.slice(shift),
              ...clone.ingredientes.slice(0, shift),
            ];
          }
          function rotateCategory(
            candidates: string[],
            regex: RegExp,
            defaultGrams: number
          ) {
            if (!candidates || candidates.length < 2) return;
            const target = candidates[variantIndex % candidates.length];
            let idx = -1;
            for (let i = 0; i < clone.ingredientes.length; i++) {
              const nm = (
                clone.ingredientes[i]?.nombre ||
                clone.ingredientes[i]?.name ||
                ""
              ).toString();
              if (regex.test(nm)) {
                idx = i;
                break;
              }
            }
            if (idx >= 0) {
              const grams =
                clone.ingredientes[idx]?.gramos ??
                clone.ingredientes[idx]?.g ??
                defaultGrams;
              clone.ingredientes[idx].nombre = target;
              if (grams) clone.ingredientes[idx].gramos = grams;
            } else {
              clone.ingredientes.push({ nombre: target, gramos: defaultGrams });
            }
          }
          rotateCategory(candidateProteins, proteinRegex2, 120);
          rotateCategory(candidateCarbs, carbRegex2, 90);
          rotateCategory(candidateVeggies, vegRegex2, 80);
          rotateCategory(candidateFats, fatRegex2, 15);
          rotateCategory(candidateFruits, fruitRegex2, 120);
          if (/snack/i.test(k))
            rotateCategory(candidateSnacks, snackRegex2, 30);
          list.push(clone);
        }

        list.forEach((variant: any, idx: number) => {
          if (!variant) return;
          if (!Array.isArray(variant.ingredientes)) variant.ingredientes = [];
          const currentName =
            typeof variant.nombre === "string" ? variant.nombre.trim() : "";
          if (currentName && isMeaningfulMealName(currentName, k)) {
            variant.nombre = titleCaseBasic(currentName);
          } else {
            const fallbackName =
              currentName ||
              (idx === 0 ? k : `${k} ${String.fromCharCode(65 + idx)}`);
            variant.nombre = friendlyMealName(
              k,
              variant.ingredientes,
              idx,
              fallbackName
            );
          }
        });
      }
      ensureVariants(arr, requiredVariants);
    });

    const dailyProtein =
      normSummary &&
      typeof normSummary === "object" &&
      typeof normSummary.proteinas_g === "number"
        ? Math.round(normSummary.proteinas_g)
        : null;
    const typeKeys = Object.keys(mealsByType);
    // Orden sugerido por horario si existe; si no, orden lógico
    const baseOrder = [
      "Desayuno",
      "Snack_manana",
      "Snack",
      "Almuerzo",
      "Snack_tarde",
      "Cena",
    ];
    const scheduleOrder = schedule
      ? (Object.keys(schedule) as string[])
      : baseOrder;
    const typeKeysSorted = typeKeys.slice().sort((a, b) => {
      const ia =
        scheduleOrder.indexOf(a) === -1 ? 999 : scheduleOrder.indexOf(a);
      const ib =
        scheduleOrder.indexOf(b) === -1 ? 999 : scheduleOrder.indexOf(b);
      return ia - ib;
    });
    const proteinShare = typeKeysSorted.length ? 1 / typeKeysSorted.length : 0;

    return dayNames.map((day) => {
      const rot = rotationIndex[day] ?? 0;
      const mealsForDay = typeKeysSorted.map((tipo) => {
        const variants = mealsByType[tipo];
        const variant = variants[rot % variants.length];
        const nombre = variant?.nombre || variant?.titulo || `${tipo} base`;
        const ings = Array.isArray(variant?.ingredientes)
          ? variant.ingredientes
          : [];
        const itemsText = ings.map((ing: any) => {
          const nm = ing?.nombre || ing?.name || "Ingrediente";
          const customLabel =
            typeof ing?.qtyLabel === "string" ? ing.qtyLabel.trim() : "";
          const g = Number(ing?.gramos ?? ing?.g ?? 0);
          const hm = g > 0 ? householdMeasure(nm, g) : "";
          if (customLabel) return `${nm} (${customLabel})`;
          if (g > 0 && hm) return `${nm} (${g} g • ${hm})`;
          if (g > 0) return `${nm} (${g} g)`;
          return nm;
        });
        return {
          tipo,
          receta: { nombre },
          targetProteinG: dailyProtein
            ? Math.round(dailyProtein * proteinShare)
            : null,
          itemsText,
        };
      });
      return { day, active: true, meals: mealsForDay };
    });
  }, [weekly, mealItems, normSummary, profile, mealVariants, text]);

  // Fijar hidratación por defecto si vino nula pero ya tenemos summary
  useEffect(() => {
    if (hydrationLiters == null && normSummary) {
      const litros = normSummary?.kcal_objetivo
        ? Math.max(
            1.5,
            Math.min(
              4,
              Math.round(((normSummary.kcal_objetivo as number) / 1000) * 10) /
                10
            )
          )
        : 2.0;
      setHydrationLiters(litros);
    }
  }, [hydrationLiters, normSummary]);

  // Al terminar de cargar el consejo, si ya tenemos un weekly efímero o persistido, dejar de mostrar loadingWeekly
  useEffect(() => {
    if (!loading) {
      if (Array.isArray(ephemeralWeekly) && ephemeralWeekly.length) {
        if (loadingWeekly) setLoadingWeekly(false);
      } else if (
        weekly &&
        Array.isArray(weekly.weekly) &&
        weekly.weekly.length
      ) {
        if (loadingWeekly) setLoadingWeekly(false);
      } else if (loadingWeekly) {
        setLoadingWeekly(false);
      }
    }
  }, [loading, loadingWeekly, ephemeralWeekly, weekly]);

  // Si hay error también detener el loadingWeekly para que aparezca el estado vacío y no quede bloqueado
  useEffect(() => {
    if (error) setLoadingWeekly(false);
  }, [error]);

  // Lanzar fetch inicial del consejo con progreso sintético
  useEffect(() => {
    let cancelled = false;

    // Inicializar progreso y loading inmediatamente al montar (antes de cualquier fetch)
    setError(null);
    setLoading(true);
    setLoadingWeekly(true);
    startRef.current = performance.now();
    const base = 14000;
    const extra = Math.random() * 12000; // 0-12s
    expectedRef.current = base + extra;
    setProgress(3);
    setEtaSec(Math.round(expectedRef.current / 1000));

    async function loadProfileAndSchedule() {
      // Restaurar preferencia Ver más/Ver menos
      try {
        const v = localStorage.getItem("advice_show_full");
        if (v === "1") setShowFullAdvice(true);
      } catch {}
      // Perfil
      try {
        const prof = await fetch("/api/account/profile", { cache: "no-store" });
        if (prof.ok) {
          const pj = await prof.json();
          if (!cancelled) setProfile(pj?.user || null);
        }
      } catch {}
      // Horarios
      try {
        const sRes = await fetch("/api/account/meal-plan/schedule", {
          cache: "no-store",
        });
        if (sRes.ok) {
          const sj = await sRes.json().catch(() => ({}));
          const sched =
            sj?.schedule && typeof sj.schedule === "object"
              ? sj.schedule
              : null;
          if (!cancelled) setSchedule(sched);
        }
      } catch {}
    }

    async function fetchAdvice() {
      setError(null);
      // Mantener barra de carga si entramos en modo polling (202)
      let startedPolling = false;
      try {
        const res = await fetch(buildAdviceUrl(), { method: "POST" });
        const json = await res.json().catch(() => ({}));
        if (res.status === 422) {
          // Mostrar igualmente cualquier contenido parcial si lo hubiera
          setError(
            json?.error ||
              "Salida incompleta. Puedes reintentar para versión completa."
          );
          // no retornamos aún, intentamos extraer lo posible (continuará flujo)
        }
        // Caso: generación todavía en curso (202 started/pending desde prefetch)
        if (res.status === 202 && (json?.started || json?.pending)) {
          // Polling robusto: respetar Retry-After si lo devuelve el servidor y aplicar backoff exponencial
          const pollStart = performance.now();
          startedPolling = true; // evitar ocultar la barra en finally
          let pollAttempts = 0;
          // Intentar obtener contenido fallback pero NO inmediato: esperar ~60s (solo si no estamos en modo estricto)
          const fallbackTimer = setTimeout(async () => {
            if (cancelled) return;
            if (aiStrict) return; // no forzar fallback en modo estricto
            // Si ya tenemos contenido, no forzar fallback
            const hasContent =
              (text && text.length) ||
              summary ||
              (Array.isArray(mealItems) && mealItems.length);
            if (hasContent) return;
            try {
              const forced = await fetch(
                buildAdviceUrl() +
                  (buildAdviceUrl().includes("?") ? "&" : "?") +
                  "minFallbackMs=0",
                { method: "POST" }
              );
              const jf = await forced.json().catch(() => ({}));
              if (forced.ok) {
                if (typeof jf?.advice === "string") setText(jf.advice);
                if (jf?.summary || jf?.advice)
                  setSummary(
                    mergeSummaryFromText(jf?.summary ?? null, jf?.advice || "")
                  );
                const itemsF0 = jf?.meals?.items;
                if (Array.isArray(itemsF0) && itemsF0.length)
                  setMealItems(itemsF0);
                const variantsF0 = jf?.meals?.variants;
                if (variantsF0 && typeof variantsF0 === "object")
                  setMealVariants(variantsF0);
                const litrosF0 = jf?.hydration?.litros;
                if (typeof litrosF0 === "number" && litrosF0 > 0) {
                  setHydrationLiters(litrosF0);
                } else {
                  const parsed = tryParseAdviceJson(jf?.advice || "");
                  const lAlt = parsed?.hydration?.litros;
                  if (typeof lAlt === "number" && lAlt > 0)
                    setHydrationLiters(lAlt);
                }
                const bevsF0 = jf?.beverages?.items;
                if (Array.isArray(bevsF0) && bevsF0.length)
                  setRawBeverages(bevsF0);
                syncWeeklyFromAdvice(jf);
              }
            } catch {}
          }, 60000);
          // Cancelar el timer si se desmonta
          if (cancelled) clearTimeout(fallbackTimer);
          async function poll() {
            if (cancelled) return;
            try {
              const r2 = await fetch(buildAdviceUrl(), { method: "POST" });
              const j2 = await r2.json().catch(() => ({}));
              // Si ya está completado, procesar y salir
              if (r2.ok && !j2.started && !j2.pending) {
                if (!cancelled) {
                  const wasFallback = !!j2.fallback;
                  setText(j2.advice || "");
                  setSummary(
                    mergeSummaryFromText(j2.summary ?? null, j2.advice || "")
                  );
                  const items = j2.meals?.items;
                  setMealItems(
                    Array.isArray(items) && items.length ? items : null
                  );
                  const variants = j2.meals?.variants;
                  setMealVariants(
                    variants && typeof variants === "object" ? variants : null
                  );
                  const litros = j2.hydration?.litros;
                  if (typeof litros === "number" && litros > 0)
                    setHydrationLiters(litros);
                  else {
                    const parsed = tryParseAdviceJson(j2.advice || "");
                    const lAlt = parsed?.hydration?.litros;
                    if (typeof lAlt === "number" && lAlt > 0)
                      setHydrationLiters(lAlt);
                  }
                  const bevs = j2.beverages?.items;
                  setRawBeverages(
                    Array.isArray(bevs) && bevs.length ? bevs : null
                  );
                  syncWeeklyFromAdvice(j2);
                  setLoading(false);
                  setProgress(100);
                  setEtaSec(0);
                  if (wasFallback) {
                    setError(
                      "Contenido parcial (fallback). Puedes reintentar para enriquecerlo."
                    );
                  }
                }
                return;
              }

              // Si excede el tiempo máximo de polling, forzar fallback inmediato y terminar
              if (performance.now() - pollStart > 300000) {
                if (!cancelled) {
                  try {
                    if (aiStrict) {
                      setError(
                        "La generación está tardando demasiado. Puedes reintentar."
                      );
                      setLoading(false);
                      setEtaSec(0);
                      return;
                    }
                    const forced = await fetch(
                      buildAdviceUrl() +
                        (buildAdviceUrl().includes("?") ? "&" : "?") +
                        "minFallbackMs=0",
                      { method: "POST" }
                    );
                    const jf = await forced.json().catch(() => ({}));
                    if (forced.ok) {
                      setText(jf.advice || "");
                      setSummary(
                        mergeSummaryFromText(
                          jf.summary ?? null,
                          jf.advice || ""
                        )
                      );
                      const itemsF = jf.meals?.items;
                      setMealItems(
                        Array.isArray(itemsF) && itemsF.length ? itemsF : null
                      );
                      const litrosF = jf.hydration?.litros;
                      if (typeof litrosF === "number" && litrosF > 0)
                        setHydrationLiters(litrosF);
                      else {
                        const parsed = tryParseAdviceJson(jf.advice || "");
                        const lAlt = parsed?.hydration?.litros;
                        if (typeof lAlt === "number" && lAlt > 0)
                          setHydrationLiters(lAlt);
                      }
                      const bevsF = jf.beverages?.items;
                      setRawBeverages(
                        Array.isArray(bevsF) && bevsF.length ? bevsF : null
                      );
                      syncWeeklyFromAdvice(jf);
                    } else {
                      setError(
                        "La generación está tardando demasiado. Puedes reintentar."
                      );
                    }
                  } catch {
                    setError(
                      "La generación está tardando demasiado. Puedes reintentar."
                    );
                  }
                  setLoading(false);
                  setEtaSec(0);
                }
                return;
              }

              // Calcular retraso para el siguiente intento:
              // 1) Si el servidor devolvió Retry-After, úsalo (s). 2) Si no, aplica backoff exponencial (2s * 2^attempts) con tope.
              pollAttempts += 1;
              const raHeader = r2.headers.get
                ? r2.headers.get("retry-after")
                : null;
              let delayMs = 2000;
              if (raHeader) {
                const raSec = parseInt(raHeader, 10);
                if (!Number.isNaN(raSec) && raSec > 0)
                  delayMs = Math.max(2000, raSec * 1000);
              } else {
                // exponential backoff: 2000ms, 4000ms, 8000ms, ... capped at 30s
                const backoff =
                  2000 * Math.pow(2, Math.min(pollAttempts - 1, 4));
                delayMs = Math.min(Math.max(2000, backoff), 30000);
              }
              if (!cancelled) setTimeout(poll, delayMs);
              return;
            } catch (e) {
              // En caso de error de red, esperar y reintentar con backoff
              pollAttempts += 1;
              const backoff = 2000 * Math.pow(2, Math.min(pollAttempts - 1, 5));
              const delayMs = Math.min(backoff, 30000);
              if (!cancelled) setTimeout(poll, delayMs);
              return;
            }
          }
          poll();
          return; // salimos para que el flujo normal no se ejecute aún
        }
        if (!res.ok) {
          if (res.status === 401) {
            if (!cancelled) router.replace("/auth/login");
            return;
          }
          if (res.status === 400 && json?.step) {
            toast.error(json?.error || "Faltan datos. Serás redirigido.");
            if (!cancelled) router.replace(`/onboarding/${json.step}`);
            return;
          }
          throw new Error(json?.error || "AI error");
        }
        if (!cancelled) {
          const jsonWasFallback = !!json.fallback;
          // Si llegó 200 pero sin contenido útil, considerar como aún pendiente y reintentar breve polling
          const missingAll =
            !json?.advice &&
            !json?.summary &&
            !(
              json?.meals &&
              Array.isArray(json?.meals?.items) &&
              json?.meals?.items?.length
            );
          if (missingAll) {
            startedPolling = true; // mantener loader
            let retries = 0;
            const repollStart = performance.now();
            const repoll = async () => {
              if (cancelled) return;
              try {
                const r = await fetch(buildAdviceUrl(), { method: "POST" });
                const j = await r.json().catch(() => ({}));
                if (
                  r.ok &&
                  (j?.advice ||
                    j?.summary ||
                    (j?.meals &&
                      Array.isArray(j?.meals?.items) &&
                      j?.meals?.items?.length))
                ) {
                  setText(j.advice || "");
                  setSummary(
                    mergeSummaryFromText(j.summary ?? null, j.advice || "")
                  );
                  const items2 = j.meals?.items;
                  setMealItems(
                    Array.isArray(items2) && items2.length ? items2 : null
                  );
                  const variants2 = j.meals?.variants;
                  setMealVariants(
                    variants2 && typeof variants2 === "object"
                      ? variants2
                      : null
                  );
                  const litros2 = j.hydration?.litros;
                  if (typeof litros2 === "number" && litros2 > 0)
                    setHydrationLiters(litros2);
                  else {
                    const parsed = tryParseAdviceJson(j.advice || "");
                    const lAlt = parsed?.hydration?.litros;
                    if (typeof lAlt === "number" && lAlt > 0)
                      setHydrationLiters(lAlt);
                  }
                  const bevs2 = j.beverages?.items;
                  setRawBeverages(
                    Array.isArray(bevs2) && bevs2.length ? bevs2 : null
                  );
                  syncWeeklyFromAdvice(j);
                  setLoading(false);
                  setProgress(100);
                  setEtaSec(0);
                  return;
                }
              } catch {}
              retries += 1;
              // Esperar con backoff suave hasta ~60s en total antes de forzar fallback
              const elapsed = performance.now() - repollStart;
              if (elapsed < 60000 && !cancelled) {
                const delay = Math.min(5000, 1000 + retries * 800); // 1.8s, 2.6s, ... máx 5s
                setTimeout(repoll, delay);
              } else if (!cancelled) {
                // como último recurso, forzar fallback inmediato en servidor (si no es modo estricto)
                try {
                  if (aiStrict) {
                    setError(
                      "La generación está tardando demasiado. Puedes reintentar."
                    );
                    setLoading(false);
                    setProgress(100);
                    setEtaSec(0);
                    return;
                  }
                  const forced = await fetch(
                    buildAdviceUrl() +
                      (buildAdviceUrl().includes("?") ? "&" : "?") +
                      "minFallbackMs=0",
                    { method: "POST" }
                  );
                  const jf = await forced.json().catch(() => ({}));
                  setText(jf.advice || "");
                  setSummary(jf.summary ?? null);
                  const items3 = jf.meals?.items;
                  setMealItems(
                    Array.isArray(items3) && items3.length ? items3 : null
                  );
                  const litros3 = jf.hydration?.litros;
                  setHydrationLiters(
                    typeof litros3 === "number" && litros3 > 0 ? litros3 : null
                  );
                  const bevs3 = jf.beverages?.items;
                  setRawBeverages(
                    Array.isArray(bevs3) && bevs3.length ? bevs3 : null
                  );
                  syncWeeklyFromAdvice(jf);
                } catch {}
                setLoading(false);
                setProgress(100);
                setEtaSec(0);
              }
            };
            setTimeout(repoll, 800);
          } else {
            setText(json.advice || "");
            setSummary(json.summary ?? null);
            const items = json.meals?.items;
            let nextItems = Array.isArray(items) && items.length ? items : null;
            let nextVariants =
              json.meals?.variants && typeof json.meals.variants === "object"
                ? json.meals.variants
                : null;
            if (
              !nextItems &&
              typeof json.advice === "string" &&
              json.advice.includes("JSON_")
            ) {
              const parsed = tryParseAdviceJson(json.advice);
              if (parsed?.meals) {
                const m = Array.isArray(parsed.meals?.items)
                  ? parsed.meals.items
                  : Array.isArray(parsed.meals)
                  ? parsed.meals
                  : null;
                if (m && m.length) nextItems = m;
              }
              if (
                !nextVariants &&
                parsed?.variants &&
                typeof parsed.variants === "object"
              ) {
                nextVariants = parsed.variants;
              }
              if (
                parsed?.hydration &&
                typeof parsed.hydration?.litros === "number"
              ) {
                setHydrationLiters(parsed.hydration.litros);
              }
              if (parsed?.summary && !json.summary) {
                setSummary(parsed.summary);
              }
            }
            setMealItems(nextItems);
            setMealVariants(nextVariants);
            const litros = json.hydration?.litros;
            setHydrationLiters(
              typeof litros === "number" && litros > 0 ? litros : null
            );
            const bevs = json.beverages?.items;
            setRawBeverages(Array.isArray(bevs) && bevs.length ? bevs : null);
            syncWeeklyFromAdvice(json);
            // En éxito directo, cerrar loader aquí
            setLoading(false);
            setProgress(100);
            setEtaSec(0);
            if (jsonWasFallback) {
              setError(
                "Contenido parcial (fallback). Puedes reintentar para versión más completa."
              );
            }
            if (json.cached) {
              // Ajustar progreso instantáneo para cache
              // ya ajustado arriba; mantener por claridad
            } else if (typeof json.took_ms === "number") {
              try {
                localStorage.setItem("advice_last_ms", String(json.took_ms));
              } catch {}
            }
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "No se pudo generar el consejo");
          setText("No se pudo generar el consejo en este momento.");
        }
      } finally {
        // No cambiar loading aquí. El loader debe permanecer visible mientras haya polling
        // o hasta que hayamos establecido contenido o error en ramas superiores.
      }
    }

    // Prefetch en background para permitir cache si tarda (mismos parámetros que la petición principal)
    try {
      const base = buildAdviceUrl();
      const prefetchUrl =
        base + (base.includes("?") ? "&" : "?") + "prefetch=1";
      fetch(prefetchUrl, { method: "POST" });
    } catch {}
    // Ejecutar en paralelo: no esperes a perfil/schedule para comenzar IA
    Promise.allSettled([loadProfileAndSchedule(), fetchAdvice()]);

    return () => {
      cancelled = true;
    };
  }, []);

  // Intervalo de actualización del progreso sintético
  useEffect(() => {
    if (loading) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (!startRef.current) return;
        const now = performance.now();
        const elapsed = now - startRef.current;
        const expected = expectedRef.current || 20000;
        // Curva por tramos: 0-3s -> hasta 40%; 3-8s -> 40-70%; 8s- (expected*0.9) -> 70-93%; resto se frena en 96%.
        let target = 0;
        if (elapsed < 3000) {
          target = (elapsed / 3000) * 40;
        } else if (elapsed < 8000) {
          target = 40 + ((elapsed - 3000) / 5000) * 30; // 40-70
        } else if (elapsed < expected * 0.9) {
          const span = expected * 0.9 - 8000;
          target = 70 + ((elapsed - 8000) / span) * 23; // 70-93
        } else {
          target = 96; // se detiene aquí hasta completar
        }
        setProgress((p) => {
          const next = Math.min(loading ? target : 100, 100);
          return next > p ? next : p; // monotónico
        });
        const remainingMs = Math.max(0, expected - elapsed);
        setEtaSec(remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0);
      }, 500);
      return () => {
        clearInterval(intervalRef.current);
      };
    } else {
      // Loading terminó -> limpiar
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Ocultar barra después de breve delay (mantener 100% por feedback)
      const timeout = setTimeout(() => {
        setEtaSec(null);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  function retryAdvice() {
    // Reinicia la lógica de fetch usando el mismo efecto anterior: simplemente replicamos fetchAdvice
    setError(null);
    setText("");
    setMealItems(null);
    setMealVariants(null);
    setHydrationLiters(null);
    setRawBeverages(null);
    // re-disparar usando lógica separada: reusar código -> simple fetch inline
    (async () => {
      setLoading(true);
      startRef.current = performance.now();
      expectedRef.current = 14000 + Math.random() * 12000;
      setProgress(3);
      setEtaSec(Math.round(expectedRef.current / 1000));
      try {
        const res = await fetch(buildAdviceUrl(), { method: "POST" });
        const json = await res.json().catch(() => ({}));
        if (res.status === 422) {
          setError(json?.error || "Salida incompleta. Puedes reintentar.");
        }
        if (!res.ok) throw new Error(json?.error || "AI error");
        if (json.fallback) {
          setError("Contenido parcial (fallback). Puedes reintentar.");
        }
        setText(json.advice || "");
        setSummary(json.summary ?? null);
        const items = json.meals?.items;
        let nextItems = Array.isArray(items) && items.length ? items : null;
        let nextVariants =
          json.meals?.variants && typeof json.meals.variants === "object"
            ? json.meals.variants
            : null;
        // Si no llegaron items válidos, intentar parsear del texto largo
        if (
          !nextItems &&
          typeof json.advice === "string" &&
          json.advice.includes("JSON_")
        ) {
          const parsed = tryParseAdviceJson(json.advice);
          if (parsed?.meals) {
            const m = Array.isArray(parsed.meals?.items)
              ? parsed.meals.items
              : Array.isArray(parsed.meals)
              ? parsed.meals
              : null;
            if (m && m.length) nextItems = m;
          }
          if (
            !nextVariants &&
            parsed?.variants &&
            typeof parsed.variants === "object"
          ) {
            nextVariants = parsed.variants;
          }
          if (
            parsed?.hydration &&
            typeof parsed.hydration?.litros === "number"
          ) {
            setHydrationLiters(parsed.hydration.litros);
          }
          if (parsed?.summary && !json.summary) {
            setSummary(parsed.summary);
          }
        }
        setMealItems(nextItems);
        setMealVariants(nextVariants);
        const litros = json.hydration?.litros;
        setHydrationLiters(
          typeof litros === "number" && litros > 0 ? litros : null
        );
        const bevs = json.beverages?.items;
        setRawBeverages(Array.isArray(bevs) && bevs.length ? bevs : null);
        syncWeeklyFromAdvice(json);
      } catch (e: any) {
        setError(e?.message || "No se pudo generar el consejo");
        setText("No se pudo generar el consejo en este momento.");
      } finally {
        setLoading(false);
        setProgress(100);
        setEtaSec(0);
      }
    })();
  }

  // Procesamiento de bebidas: deduplicar y limitar a 2 bebidas finales, distribuir 'General'.
  useEffect(() => {
    if (
      !rawBeverages ||
      !Array.isArray(rawBeverages) ||
      rawBeverages.length === 0
    ) {
      setBeverages(null);
      return;
    }
    const norm = (s: string) =>
      s
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim();
    let enabledMeals: any = null;
    try {
      const rawPref = profile?.preferencias_alimentos;
      const pref = rawPref
        ? typeof rawPref === "string"
          ? JSON.parse(rawPref)
          : rawPref
        : null;
      enabledMeals = pref?.enabledMeals || null;
    } catch {}
    const snackManana =
      enabledMeals?.snack_manana || enabledMeals?.["snack_mañana"] || false;
    const snackTarde = enabledMeals?.snack_tarde || false;
    const baseOrder: string[] = ["Desayuno"];
    if (snackManana) baseOrder.push("Snack mañana");
    baseOrder.push("Almuerzo");
    if (snackTarde) baseOrder.push("Snack tarde");
    baseOrder.push("Cena");
    let scheduleOrder: string[] = [];
    if (schedule && typeof schedule === "object") {
      scheduleOrder = Object.keys(schedule)
        .filter((k) => typeof (schedule as any)[k] === "string")
        .sort((a, b) =>
          String((schedule as any)[a]).localeCompare(
            String((schedule as any)[b])
          )
        );
    }
    const momentOrder = scheduleOrder.length ? scheduleOrder : baseOrder;
    const cloned = rawBeverages
      .map((b) => ({
        nombre: (b?.nombre || b?.name || "Bebida").toString().trim(),
        ml: Math.min(250, Math.max(0, Number(b?.ml) || 0)),
        momento: (b?.momento || b?.moment || "").toString().trim(),
      }))
      .filter((b) => b.ml > 0 && !/^agua(\b|\s|$)/i.test(b.nombre));
    const general: any[] = [];
    const withMoment: any[] = [];
    cloned.forEach((b) => {
      if (!b.momento || /^general$/i.test(b.momento)) general.push(b);
      else withMoment.push(b);
    });
    if (general.length && momentOrder.length)
      general.forEach((b, idx) => {
        b.momento = momentOrder[idx % momentOrder.length];
      });
    const all = [...withMoment, ...general];
    const map = new Map<
      string,
      { nombre: string; momento: string; ml: number }
    >();
    for (const b of all) {
      const key = norm(b.nombre) + "|" + norm(b.momento || "General");
      const prev = map.get(key);
      if (prev) prev.ml = Math.min(250, prev.ml + b.ml);
      else
        map.set(key, {
          nombre: b.nombre,
          momento: b.momento || "General",
          ml: Math.min(250, b.ml),
        });
    }
    const orderIndex = (m: string) => {
      const i = momentOrder.findIndex(
        (o) => o.toLowerCase() === m.toLowerCase()
      );
      return i === -1 ? 999 : i;
    };
    let finalList = Array.from(map.values()).sort((a, b) => {
      const om = orderIndex(a.momento) - orderIndex(b.momento);
      if (om !== 0) return om;
      return a.nombre.localeCompare(b.nombre, "es");
    });
    if (finalList.length > 2) {
      const picked = [] as any[];
      const momentsSeen = new Set();
      for (const b of finalList) {
        const mKey = b.momento.toLowerCase();
        if (momentsSeen.has(mKey)) continue;
        picked.push(b);
        momentsSeen.add(mKey);
        if (picked.length === 2) break;
      }
      finalList = picked;
    }
    setBeverages(finalList.length ? finalList : null);
  }, [rawBeverages, schedule, profile]);

  // Persistir preferencia de ver más/menos
  useEffect(() => {
    try {
      localStorage.setItem("advice_show_full", showFullAdvice ? "1" : "0");
    } catch {}
  }, [showFullAdvice]);

  // (sin persistencia de ver más/menos; el consejo se muestra completo)

  // Eliminado guardado inmediato del plan inicial. El plan semanal aquí es solo una vista previa.
  // Se evita llamar a /api/account/onboarding/initial-plan hasta finalizar onboarding para que
  // al presionar "Volver" no quede ningún plan parcial persistido.

  async function regenerateLong() {
    try {
      setLoading(true);
      const res = await fetch("/api/account/advice?mode=long", {
        method: "POST",
        body: JSON.stringify({ long: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error || "No se pudo regenerar el consejo");
        return;
      }
      setText(json.advice || "");
      setSummary(json.summary ?? null);
      const items = json.meals?.items;
      setMealItems(Array.isArray(items) && items.length ? items : null);
      const litros = json.hydration?.litros;
      setHydrationLiters(
        typeof litros === "number" && litros > 0 ? litros : null
      );
      syncWeeklyFromAdvice(json);
      toast.success("Consejo regenerado (largo)");
    } catch {
      toast.error("Error regenerando el consejo");
    } finally {
      setLoading(false);
    }
  }

  async function next() {
    if (finishing) return; // Guardar contra doble click
    setFinishing(true);
    try {
      // Bloquear si no hay plan generado aún
      if (
        !ephemeralWeekly &&
        !(
          weekly?.weekly &&
          Array.isArray(weekly.weekly) &&
          weekly.weekly.length
        )
      ) {
        toast.error(
          "Primero genera el plan semanal (espera a que termine la IA)"
        );
        setFinishing(false);
        return;
      }
      // Guardar plan inicial SOLO ahora (al finalizar) usando las comidas generadas por la IA (mealItems)
      if (Array.isArray(mealItems) && mealItems.length) {
        try {
          const res = await fetch("/api/account/onboarding/initial-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: mealItems }),
            credentials: "include",
            cache: "no-store",
          });
          if (!res.ok) {
            console.warn(
              "No se pudo guardar el plan inicial (finalizar)",
              await res.text()
            );
            toast.error("No se pudo guardar el plan de comidas");
          }
        } catch (e) {
          console.warn("Error guardando plan inicial al finalizar", e);
          toast.error("Error guardando el plan de comidas");
        }
      }

      // 2) Guardar objetivo de hidratación si vino en la respuesta
      if (typeof hydrationLiters === "number" && hydrationLiters > 0) {
        try {
          const res = await fetch("/api/account/hydration/goal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ litros: hydrationLiters }),
            credentials: "include",
            cache: "no-store",
          });
          if (!res.ok)
            console.warn("No se pudo guardar hidratación", await res.text());
        } catch (e) {
          console.warn("Error guardando hidratación", e);
        }
      }

      // 2b) Guardar plan de bebidas (cada bebida <=250ml, no confundir con hidratación total)
      if (Array.isArray(beverages) && beverages.length) {
        try {
          const res = await fetch("/api/account/beverages-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: beverages.map((b) => ({
                nombre: b.nombre,
                ml: b.ml,
                momento: b.momento,
              })),
            }),
            credentials: "include",
            cache: "no-store",
          });
          if (!res.ok)
            console.warn(
              "No se pudo guardar plan de bebidas",
              await res.text()
            );
        } catch (e) {
          console.warn("Error guardando plan de bebidas", e);
        }
      }

      // 3) Aplicar objetivos de plan (kcal y macros) y guardar el consejo para el usuario
      try {
        const applyBody: any = {};
        if (summary && typeof summary === "object") {
          // Usar summary normalizado para asegurar campos completos
          const s: any = normalizeSummary(summary, profile) || { ...summary };
          // Si aun faltara kcal, intentar una estimación mínima desde TDEE/deficit o macros
          let kcal = Number(s.kcal_objetivo);
          const prot = Number(s.proteinas_g) || null;
          if (!Number.isFinite(kcal)) {
            const tdee = Number(s.tdee);
            const def = Number(s.deficit_superavit_kcal);
            if (Number.isFinite(tdee) && Number.isFinite(def))
              kcal = Math.round(tdee - def);
            if (
              !Number.isFinite(kcal) &&
              Number.isFinite(Number(s.grasas_g)) &&
              Number.isFinite(Number(s.carbohidratos_g)) &&
              prot != null
            ) {
              kcal = Math.round(
                prot * 4 +
                  Number(s.grasas_g) * 9 +
                  Number(s.carbohidratos_g) * 4
              );
            }
            if (Number.isFinite(kcal)) s.kcal_objetivo = kcal;
          }
          // Completar grasas/carbos si faltan con kcal
          if (
            Number.isFinite(Number(s.kcal_objetivo)) &&
            (!Number.isFinite(Number(s.grasas_g)) || Number(s.grasas_g) <= 0)
          ) {
            s.grasas_g = Math.max(
              0,
              Math.round((Number(s.kcal_objetivo) * 0.25) / 9)
            );
          }
          if (
            Number.isFinite(Number(s.kcal_objetivo)) &&
            prot &&
            (!Number.isFinite(Number(s.carbohidratos_g)) ||
              Number(s.carbohidratos_g) <= 0)
          ) {
            const carbs = Math.round(
              (Number(s.kcal_objetivo) - prot * 4 - Number(s.grasas_g) * 9) / 4
            );
            s.carbohidratos_g = Math.max(0, carbs);
          }
          if (
            typeof s.tiempo_estimado_semanas === "number" &&
            s.tiempo_estimado_semanas > 0
          ) {
            applyBody.objetivo_eta_semanas = s.tiempo_estimado_semanas;
          }
          if (typeof s.fecha_meta_estimada === "string") {
            applyBody.objetivo_eta_fecha = s.fecha_meta_estimada;
          }
          applyBody.summary = s;
        }
        if (typeof hydrationLiters === "number" && hydrationLiters > 0)
          applyBody.agua_litros_obj = hydrationLiters;
        if (text) applyBody.advice = text;
        // Persistir bebidas/infusiones si existen
        if (Array.isArray(beverages) && beverages.length) {
          applyBody.beverages = beverages.map((b) => ({
            nombre: (b?.nombre || b?.name || "Bebida").toString().trim(),
            ml: Math.min(250, Math.max(0, Number(b?.ml) || 0)),
            momento: (b?.momento || "General").toString(),
          }));
        }
        // Persistir plan semanal final (usamos la vista previa efímera si existe; si no, el weekly persistido)
        const finalWeekly = Array.isArray(ephemeralWeekly)
          ? ephemeralWeekly
          : Array.isArray(weekly?.weekly)
          ? weekly.weekly
          : null;
        if (finalWeekly) applyBody.weekly = finalWeekly;
        if (Object.keys(applyBody).length) {
          const applyRes = await fetch("/api/account/plan/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(applyBody),
            credentials: "include",
            cache: "no-store",
          });
          if (!applyRes.ok)
            console.warn(
              "No se pudieron aplicar objetivos del plan",
              await applyRes.text()
            );
        }
      } catch (e) {
        console.warn("Error aplicando objetivos del plan", e);
      }

      const done = await fetch("/api/auth/onboarding/complete", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      });
      if (done.status === 401) {
        toast.error("Sesión expirada. Inicia sesión nuevamente.");
        router.replace("/auth/login");
        setFinishing(false);
        return;
      }
      if (!done.ok) throw new Error();
      toast.success("¡Listo!", { description: "Onboarding completado" });
      // Hard navigation para asegurar que el middleware lea las cookies nuevas
      try {
        document.cookie = `first_login=false; Path=/; Max-Age=${
          60 * 60 * 24 * 30
        }; SameSite=Lax`;
        document.cookie = `onboarded=true; Path=/; Max-Age=${
          60 * 60 * 24 * 30
        }; SameSite=Lax`;
      } catch {}
      // Intentar refrescar el JWT de NextAuth para que onboarding_completed=true sin esperar nueva navegación
      try {
        await update?.({ onboarding_completed: true });
      } catch {}
      // Ir al dashboard
      window.location.replace("/dashboard");
    } catch {
      toast.error("No se pudo finalizar el onboarding");
      setFinishing(false);
    }
  }

  async function skip() {
    if (finishing) return;
    setFinishing(true);
    try {
      const done = await fetch("/api/auth/onboarding/complete", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      });
      if (done.status === 401) {
        toast.error("Sesión expirada. Inicia sesión nuevamente.");
        router.replace("/auth/login");
        setFinishing(false);
        return;
      }
      if (!done.ok) throw new Error();
      try {
        document.cookie = `first_login=false; Path=/; Max-Age=${
          60 * 60 * 24 * 30
        }; SameSite=Lax`;
        document.cookie = `onboarded=true; Path=/; Max-Age=${
          60 * 60 * 24 * 30
        }; SameSite=Lax`;
      } catch {}
      try {
        await update?.({ onboarding_completed: true });
      } catch {}
      window.location.replace("/dashboard");
    } catch {
      toast.error("No se pudo finalizar el onboarding");
      setFinishing(false);
    }
  }

  async function downloadPdf() {
    try {
      // Cargar jsPDF UMD si no está cargado
      const ensureJsPdf = () =>
        new Promise<void>((resolve, reject) => {
          const w = window as any;
          if (w.jspdf?.jsPDF) return resolve();
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("No se pudo cargar jsPDF"));
          document.head.appendChild(script);
        });
      await ensureJsPdf();
      const jsPDF = (window as any).jspdf?.jsPDF;
      if (!jsPDF) throw new Error("jsPDF no disponible");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const usableWidth = pageWidth - margin * 2;
      const formatEtaDate = (value?: string | null) => {
        if (!value) return null;
        try {
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) return value;
          return new Intl.DateTimeFormat("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(date);
        } catch {
          return value;
        }
      };

      // Título
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Consejo personalizado - FitBalance", margin, margin);

      // Fecha
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(new Date().toLocaleString(), margin, margin + 16);

      // Resumen estructurado (si existe)
      let cursorY = margin + 40;
      if (summary || normSummary) {
        // Construir 's' preferiendo valores normalizados SOLO cuando existan,
        // sin sobrescribir con null/undefined los valores del summary original.
        const s: any = { ...(summary || {}) };
        if (normSummary && typeof normSummary === "object") {
          for (const k of Object.keys(normSummary)) {
            const v = (normSummary as any)[k];
            if (v != null) (s as any)[k] = v;
          }
        }
        // Fallback adicional: fusionar desde bloques JSON del texto actual
        try {
          const parsed = tryParseAdviceJson(text || "");
          if (parsed?.summary && typeof parsed.summary === "object") {
            for (const [k, v] of Object.entries(parsed.summary)) {
              if (v != null && (s as any)[k] == null) {
                (s as any)[k] = v;
              }
            }
          }
          if (pdfDebug) {
            // Log de diagnóstico: valores que van al PDF
            // Conserva este bloque comentado para depurar manualmente el PDF si fuera necesario.
          }
        } catch {}
        // Normalizar snapshot final para usar nombres estándar en el PDF
        const sNorm = normalizeSummary(s, profile) || ({} as any);
        // Completar heurísticas faltantes para PDF
        if (
          sNorm &&
          sNorm.kcal_objetivo == null &&
          sNorm.proteinas_g != null &&
          sNorm.grasas_g != null &&
          sNorm.carbohidratos_g != null
        ) {
          sNorm.kcal_objetivo = Math.max(
            0,
            Math.round(
              sNorm.proteinas_g * 4 +
                sNorm.grasas_g * 9 +
                sNorm.carbohidratos_g * 4
            )
          );
        }
        if (
          sNorm &&
          sNorm.deficit_superavit_kcal == null &&
          sNorm.tdee != null &&
          sNorm.kcal_objetivo != null
        ) {
          sNorm.deficit_superavit_kcal = Math.round(
            Number(sNorm.tdee) - Number(sNorm.kcal_objetivo)
          );
        }
        if (
          sNorm &&
          sNorm.ritmo_peso_kg_sem == null &&
          sNorm.deficit_superavit_kcal != null
        ) {
          sNorm.ritmo_peso_kg_sem = Number(
            ((Number(sNorm.deficit_superavit_kcal) * 7) / 7700) * -1
          );
        }
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Resumen", margin, cursorY);
        cursorY += 18;
        doc.setFont("helvetica", "normal");
        const etaWeeks =
          typeof sNorm?.tiempo_estimado_semanas === "number"
            ? sNorm.tiempo_estimado_semanas
            : null;
        const etaMonths =
          typeof sNorm?.tiempo_estimado_meses === "number"
            ? sNorm.tiempo_estimado_meses
            : null;
        const etaLabel =
          etaWeeks != null
            ? etaMonths != null
              ? `${etaWeeks.toFixed(1)} sem (~${etaMonths.toFixed(1)} meses)`
              : `${etaWeeks.toFixed(1)} sem`
            : "—";
        const etaDateRaw =
          sNorm?.fecha_meta_estimada ??
          sNorm?.fecha_meta_estimada_iso ??
          sNorm?.objetivo_eta_fecha ??
          null;
        const etaDateFormatted = etaDateRaw ? formatEtaDate(etaDateRaw) : null;
        const etaDateLabel = etaDateFormatted ?? "—";

        const rows: Array<[string, string]> = [
          ["TMB", sNorm?.tmb != null ? `${Math.round(sNorm.tmb)} kcal` : "—"],
          [
            "TDEE",
            sNorm?.tdee != null ? `${Math.round(sNorm.tdee)} kcal` : "—",
          ],
          [
            "Kcal objetivo",
            sNorm?.kcal_objetivo != null
              ? `${Math.round(sNorm.kcal_objetivo)} kcal`
              : "—",
          ],
          [
            "Déficit/Superávit",
            sNorm?.deficit_superavit_kcal != null
              ? `${Math.round(sNorm.deficit_superavit_kcal)} kcal/día`
              : "—",
          ],
          [
            "Ritmo estimado",
            sNorm?.ritmo_peso_kg_sem != null
              ? `${Number(sNorm.ritmo_peso_kg_sem).toFixed(2)} kg/sem`
              : "—",
          ],
          ["Tiempo estimado", etaLabel],
          ["Meta prevista", etaDateLabel],
          [
            "Proteínas",
            sNorm?.proteinas_g != null
              ? `${Math.round(sNorm.proteinas_g)} g`
              : "—",
          ],
          [
            "Grasas",
            sNorm?.grasas_g != null ? `${Math.round(sNorm.grasas_g)} g` : "—",
          ],
          [
            "Carbohidratos",
            sNorm?.carbohidratos_g != null
              ? `${Math.round(sNorm.carbohidratos_g)} g`
              : "—",
          ],
          [
            "Agua (objetivo)",
            typeof hydrationLiters === "number" && hydrationLiters > 0
              ? `${hydrationLiters.toFixed(2)} L`
              : "—",
          ],
        ];
        const leftColWidth = 140;
        const lineHeight = 16;
        rows.forEach(([k, v]) => {
          if (cursorY > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
          }
          doc.text(k + ":", margin, cursorY);
          doc.text(v, margin + leftColWidth, cursorY);
          cursorY += lineHeight;
        });
        // separador
        cursorY += 8;
        doc.setDrawColor(200);
        doc.line(margin, cursorY, pageWidth - margin, cursorY);
        cursorY += 16;
      }

      // Contenido (texto plano sin markdown)
      doc.setTextColor(0);
      doc.setFontSize(12);
      const content = renderAdviceToPlain(
        text || "No hay contenido disponible."
      );
      const lines = doc.splitTextToSize(content, usableWidth);
      const lineHeight = 16;
      lines.forEach((line: string) => {
        if (cursorY > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }
        doc.text(line, margin, cursorY);
        cursorY += lineHeight;
      });

      // Separador antes del plan semanal
      cursorY += 12;
      if (cursorY > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.setDrawColor(200);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 18;

      // Título de plan semanal
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Plan semanal", margin, cursorY);
      cursorY += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      const weeklyPlan =
        Array.isArray(ephemeralWeekly) && ephemeralWeekly.length
          ? ephemeralWeekly
          : weekly?.weekly || null;
      if (Array.isArray(weeklyPlan) && weeklyPlan.length) {
        for (const day of weeklyPlan) {
          if (cursorY > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
          }
          // Día
          doc.setFont("helvetica", "bold");
          const isFree =
            !day?.active ||
            !Array.isArray(day?.meals) ||
            day.meals.length === 0;
          const dayTitle =
            String(day.day || "Día") + (isFree ? " (libre)" : "");
          doc.text(dayTitle, margin, cursorY);
          cursorY += 14;
          doc.setFont("helvetica", "normal");
          // Comidas del día
          const meals = Array.isArray(day.meals) ? day.meals : [];
          if (meals.length === 0) {
            const wrapped = doc.splitTextToSize(
              "Día libre (sin plan de comidas)",
              usableWidth
            );
            for (const ln of wrapped) {
              if (cursorY > pageHeight - margin) {
                doc.addPage();
                cursorY = margin;
              }
              doc.text(ln, margin + 12, cursorY);
              cursorY += 14;
            }
            // Espacio entre días y continuar
            cursorY += 6;
            continue;
          }
          for (const m of meals) {
            const tipo = String(m?.tipo ?? "");
            const rawNombre = m?.receta?.nombre ? String(m.receta.nombre) : "—";
            const nombre = stripMarkdownStars(rawNombre) || rawNombre;
            const prot =
              typeof m?.targetProteinG === "number" && m.targetProteinG > 0
                ? ` • ${m.targetProteinG} g proteína`
                : "";
            const line = `${tipo}: ${nombre}${prot}`;
            const wrapped = doc.splitTextToSize(line, usableWidth);
            for (const ln of wrapped) {
              if (cursorY > pageHeight - margin) {
                doc.addPage();
                cursorY = margin;
              }
              doc.text(ln, margin + 12, cursorY);
              cursorY += 14;
            }
            // Items de referencia, si hay
            const items = Array.isArray(m?.itemsText) ? m.itemsText : [];
            for (const it of items) {
              if (cursorY > pageHeight - margin) {
                doc.addPage();
                cursorY = margin;
              }
              const wrappedIt = doc.splitTextToSize(
                `- ${it}`,
                usableWidth - 18
              );
              for (const wi of wrappedIt) {
                if (cursorY > pageHeight - margin) {
                  doc.addPage();
                  cursorY = margin;
                }
                doc.text(wi, margin + 24, cursorY);
                cursorY += 14;
              }
            }
          }
          // Espacio entre días
          cursorY += 6;
        }
      } else {
        const fallback = doc.splitTextToSize(
          "No hay plan semanal disponible.",
          usableWidth
        );
        for (const ln of fallback) {
          if (cursorY > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
          }
          doc.text(ln, margin, cursorY);
          cursorY += 14;
        }
      }

      const pdfBeveragesSource =
        Array.isArray(beverages) && beverages.length
          ? beverages
          : Array.isArray(rawBeverages) && rawBeverages.length
          ? rawBeverages
          : null;
      if (pdfBeveragesSource && pdfBeveragesSource.length) {
        const normalizedBeverages = pdfBeveragesSource.map((b: any) => ({
          nombre: (b?.nombre || b?.name || "Bebida").toString(),
          momento: (b?.momento || "General").toString(),
          ml: Math.min(250, Math.max(0, Number(b?.ml) || 0)),
        }));
        cursorY += 12;
        if (cursorY > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }
        doc.setDrawColor(200);
        doc.line(margin, cursorY, pageWidth - margin, cursorY);
        cursorY += 18;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("Bebidas e infusiones", margin, cursorY);
        cursorY += 16;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        normalizedBeverages.forEach((b) => {
          const momentoLabel =
            b.momento && b.momento.toLowerCase() !== "general"
              ? b.momento
              : "General";
          const mlLabel = b.ml > 0 ? `${b.ml} ml` : null;
          const line = [b.nombre, momentoLabel, mlLabel]
            .filter(Boolean)
            .join(" • ");
          const wrapped = doc.splitTextToSize(line, usableWidth);
          wrapped.forEach((ln: string) => {
            if (cursorY > pageHeight - margin) {
              doc.addPage();
              cursorY = margin;
            }
            doc.text(ln, margin + 12, cursorY);
            cursorY += 14;
          });
          cursorY += 2;
        });
      }

      doc.save("Consejo-FitBalance.pdf");
    } catch (e) {
      toast.error("No se pudo generar el PDF");
      throw e;
    }
  }

  return (
    <OnboardingLayout>
      <OnboardingHeader
        title="Consejo personalizado"
        subtitle="Aquí verás recomendaciones y tu plan semanal sugerido según lo que seleccionaste."
      />
      {/* Resumen movido a /onboarding/review para evitar redundancia */}
      <OnboardingCard>
        {loading ? (
          <div className="min-h-[200px] flex flex-col gap-3">
            <div>Generando recomendaciones con IA...</div>
            <div className="w-full h-3 rounded bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, progress).toFixed(1)}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span>{Math.round(progress)}%</span>
              {etaSec != null && etaSec > 0 && (
                <span>~{etaSec}s restantes</span>
              )}
              {etaSec === 0 && <span>Procesando…</span>}
            </div>
            {error && <div className="text-xs text-destructive">{error}</div>}
            {error && (
              <div>
                <Button variant="outline" size="sm" onClick={retryAdvice}>
                  Reintentar
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div
              className={`${
                showFullAdvice ? "" : "max-h-[360px] overflow-hidden relative"
              }`}
            >
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: renderAdviceToHtml(text) }}
              />
              {!showFullAdvice && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
              )}
            </div>
            <div className="mt-2 flex gap-1 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  try {
                    const plain = renderAdviceToPlain(text || "");
                    navigator.clipboard?.writeText(plain);
                    toast.success("Consejo copiado al portapapeles");
                  } catch {
                    toast.error("No se pudo copiar");
                  }
                }}
                aria-label="Copiar consejo"
                title="Copiar consejo"
              >
                <Clipboard className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  downloadPdf().catch(() =>
                    toast.error("No se pudo descargar el PDF")
                  );
                }}
                aria-label="Descargar PDF"
                title="Descargar PDF"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowFullAdvice((v) => !v)}
              >
                {showFullAdvice ? "Ver menos" : "Ver más"}
              </Button>
            </div>
          </>
        )}
      </OnboardingCard>

      {/* Tarjeta de resumen removida según solicitud para evitar mostrar duplicados en onboarding/advice */}

      {/* Plan semanal sugerido (compacto por días) */}
      <OnboardingCard>
        <div className="font-medium">Plan semanal sugerido (vista previa)</div>
        <div className="text-xs text-muted-foreground">
          No se guarda todavía; si retrocedes no se persistirá ningún cambio.
          (Generado en memoria)
        </div>
        {loading ? (
          <div className="w-full mt-3">
            <div className="text-sm mb-2 text-muted-foreground flex items-center justify-between">
              <span>Generando plan semanal…</span>
              {progress < 100 && (
                <span className="text-[10px]">
                  {Math.round(Math.min(progress, 96))}%
                </span>
              )}
            </div>
            <div className="h-2 w-full rounded bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(progress, 96).toFixed(1)}%` }}
              />
            </div>
          </div>
        ) : ephemeralWeekly ? (
          <div className="mt-3">
            <WeeklyPlanByDay
              weekly={ephemeralWeekly}
              schedule={schedule}
              beverages={beverages}
            />
          </div>
        ) : loadingWeekly ? (
          <div className="text-sm text-muted-foreground mt-2">
            Generando plan semanal…
          </div>
        ) : weekly?.weekly ? (
          <div className="mt-3">
            <WeeklyPlanByDay
              weekly={weekly.weekly}
              schedule={schedule}
              beverages={beverages}
            />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground mt-2">
            No hay plan semanal para mostrar.
          </div>
        )}
      </OnboardingCard>

      {/* Tarjeta de plan de bebidas eliminada según solicitud. */}

      {/* Propuestas base (3) para rotación */}
      {/* Propuestas base removidas por simplicidad */}
      {/* Preview del plan eliminado por redundancia */}
      {/* Importante: ningún dato (resumen, hidratación, comidas) se persiste mientras el usuario está aquí.
            Solo al presionar "Guardar y terminar" se aplican objetivos, se guarda el consejo y se completa el onboarding. */}
      <OnboardingActions
        back={{
          onClick: () => resetAdviceState({ navigateBack: true }),
          label: "Volver",
        }}
        next={{
          onClick: next,
          label: "Guardar y terminar",
          disabled:
            loading ||
            (!ephemeralWeekly &&
              !(
                weekly?.weekly &&
                Array.isArray(weekly.weekly) &&
                weekly.weekly.length
              )),
        }}
      />
    </OnboardingLayout>
  );
}

function labelForTipo(t: string) {
  const s = String(t);
  if (/^Snack_manana$/.test(s)) return "Snack mañana";
  if (/^Snack_tarde$/.test(s)) return "Snack tarde";
  return s;
}
