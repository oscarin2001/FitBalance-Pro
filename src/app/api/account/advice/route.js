import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import jwt from "jsonwebtoken";
import { getToken } from "next-auth/jwt";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import crypto from "crypto";

// ---- Constantes y estado en memoria ----
// Unificamos uso del modelo: si existe GEMINI_MODEL (como en tu .env gemini-2.5-flash) lo usamos para ambos
// Se pueden definir GEMINI_MODEL_LONG y GEMINI_MODEL_FALLBACK si quieres diferenciarlos.
function normalizeModelName(name, fallback) {
  if (!name) return fallback;
  // Si el valor ya contiene 'models/' lo dejamos; si no, lo usamos tal cual (el provider suele aceptar ambos formatos).
  return name.trim();
}
const GEMINI_ENV_MODEL = process.env.GEMINI_MODEL;
const GEMINI_MODEL_LONG = normalizeModelName(
  process.env.GEMINI_MODEL_LONG || GEMINI_ENV_MODEL,
  "models/gemini-2.5-flash"
);
const GEMINI_MODEL_FALLBACK = normalizeModelName(
  process.env.GEMINI_MODEL_FALLBACK || GEMINI_ENV_MODEL,
  GEMINI_MODEL_LONG || "models/gemini-2.5-flash"
);
const activeGenerations = new Map(); // userId -> Promise
// Timeouts configurables (ms)
const ADVICE_FLASH_TIMEOUT_MS = parseInt(
  process.env.ADVICE_FLASH_TIMEOUT_MS || "18000",
  10
); // 18s
const ADVICE_LONG_TIMEOUT_MS = parseInt(
  process.env.ADVICE_LONG_TIMEOUT_MS || "35000",
  10
); // 35s
const ADVICE_FALLBACK_TIMEOUT_MS = parseInt(
  process.env.ADVICE_FALLBACK_TIMEOUT_MS || "15000",
  10
); // fallback corto
const FAST_MODE = process.env.ADVICE_STRICT_FAST === "1"; // Si está activo evitamos modelo largo
const PREFETCH_MAX_MS = parseInt(
  process.env.ADVICE_PREFETCH_MAX_MS || "45000",
  10
); // watchdog máximo prefetch
// Ventana mínima antes de permitir fallback local (para dar oportunidad a la IA). Por defecto 5 min.
// Ventana mínima antes de permitir fallback local (ahora 3 min por petición del usuario)
const ADVICE_MIN_FALLBACK_MS = parseInt(
  process.env.ADVICE_MIN_FALLBACK_MS || "180000",
  10
);

function canUseLocalFallback(start) {
  return Date.now() - start >= ADVICE_MIN_FALLBACK_MS;
}

async function waitMinWindow(start) {
  const elapsed = Date.now() - start;
  if (elapsed < ADVICE_MIN_FALLBACK_MS) {
    const remaining = ADVICE_MIN_FALLBACK_MS - elapsed;
    // Limitar log spam si remaining es muy grande
    console.log(
      `[advice] Esperando ${remaining}ms extra antes de fallback local (elapsed=${elapsed} < min=${ADVICE_MIN_FALLBACK_MS})`
    );
    await new Promise((r) => setTimeout(r, remaining));
  }
}

function getCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

async function getUserIdFromRequest(request) {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (secret) {
    try {
      const nt = await getToken({ req: request, secret });
      if (nt?.email) {
        const auth = await prisma.auth.findUnique({
          where: { email: nt.email.toLowerCase() },
        });
        if (auth?.usuarioId) return auth.usuarioId;
      }
    } catch {}
  }
  try {
    const cookieName = getCookieName();
    const token = request.cookies.get(cookieName)?.value;
    const legacySecret = process.env.AUTH_SECRET;
    if (!token || !legacySecret) return null;
    const decoded = jwt.verify(token, legacySecret);
    return parseInt(decoded.sub, 10);
  } catch {
    return null;
  }
}

function calcAge(date) {
  if (!date) return null;
  try {
    const dob = new Date(date);
    const now = new Date();
    return Math.floor(
      (now.getTime() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)
    );
  } catch {
    return null;
  }
}

// ---- Handler principal (POST) ----
export async function POST(request) {
  try {
    const url = new URL(request.url);
    console.log("[advice][config]", {
      FLASH: ADVICE_FLASH_TIMEOUT_MS,
      LONG: ADVICE_LONG_TIMEOUT_MS,
      FALLBACK_SHORT: ADVICE_FALLBACK_TIMEOUT_MS,
      MIN_FALLBACK: ADVICE_MIN_FALLBACK_MS,
      PREFETCH_MAX_MS,
      FAST_MODE,
    });
    const debugMode = url.searchParams.get("debug") === "1";
    // Permite solicitar ver el prompt exacto enviado al modelo sin activar todo el modo debug completo
    const debugPromptOnly = url.searchParams.get("debugPrompt") === "1";
    // Permite invalidar el cache forzado (?invalidate=1)
    const invalidate = url.searchParams.get("invalidate") === "1";
    // Fuerza intentar obtener salida 'completa' (reintento con modelo largo extendido si la primera fue short o fallback)
    const ensureFull = url.searchParams.get("ensureFull") === "1";
    // Devuelve siempre el prompt completo (además de debugPrompt) si se pasa showPrompt=1
    const showPrompt = url.searchParams.get("showPrompt") === "1";
    const strictMode =
      url.searchParams.get("ai_strict") === "1" ||
      url.searchParams.get("strict") === "1"; // fuerza esperar más y desactiva fast
    // Soportar múltiples formas de solicitar modelo largo
    let forceLong =
      url.searchParams.get("forceLong") === "1" ||
      url.searchParams.get("mode") === "long";
    // Intentar leer body para detectar flags (si viene vacío no falla)
    let bodyData = null;
    try {
      bodyData = await request.json();
    } catch {}
    if (bodyData?.forceLong || bodyData?.long) forceLong = true;

    // Override de modelo por query (?model=models/gemini-1.5-flash)
    const qModel = (url.searchParams.get("model") || "").trim();
    let EFFECTIVE_MODEL_LONG = GEMINI_MODEL_LONG;
    let EFFECTIVE_MODEL_FALLBACK = GEMINI_MODEL_FALLBACK;
    if (qModel) {
      EFFECTIVE_MODEL_LONG = normalizeModelName(qModel, GEMINI_MODEL_LONG);
      EFFECTIVE_MODEL_FALLBACK = EFFECTIVE_MODEL_LONG;
    }

    // Permitir override del umbral mínimo antes de fallback local por petición (?minFallbackMs=0)
    const qMinFallback = url.searchParams.get("minFallbackMs");
    const MIN_FALLBACK_MS =
      qMinFallback !== null && qMinFallback !== undefined && qMinFallback !== ""
        ? Number(qMinFallback)
        : ADVICE_MIN_FALLBACK_MS;
    // Si el cliente solicita minFallbackMs=0 queremos permitir respuesta inmediata (incluso si hay prefetch en curso)
    const forceFallbackNow = MIN_FALLBACK_MS === 0;
    // Sombras locales de helpers para respetar el override de esta petición
    const canUseLocalFallback = (start) => {
      return Date.now() - start >= MIN_FALLBACK_MS;
    };
    const waitMinWindow = async (start) => {
      const elapsed = Date.now() - start;
      if (elapsed < MIN_FALLBACK_MS) {
        const remaining = MIN_FALLBACK_MS - elapsed;
        console.log(
          `[advice] Esperando ${remaining}ms extra antes de fallback local (elapsed=${elapsed} < min=${MIN_FALLBACK_MS})`
        );
        await new Promise((r) => setTimeout(r, remaining));
      }
    };

    // Timeouts efectivos por petición: en modo estricto ampliamos ventanas y desactivamos fast
    const USE_FAST = FAST_MODE && !strictMode;
    let FLASH_MS = strictMode
      ? ADVICE_FLASH_TIMEOUT_MS + 20000
      : ADVICE_FLASH_TIMEOUT_MS; // +20s si estricto
    let LONG_MS = strictMode
      ? ADVICE_LONG_TIMEOUT_MS + 20000
      : ADVICE_LONG_TIMEOUT_MS; // +20s si estricto
    let FALLBACK_MS = strictMode
      ? ADVICE_FALLBACK_TIMEOUT_MS + 10000
      : ADVICE_FALLBACK_TIMEOUT_MS; // +10s si estricto
    // Overrides por query para pruebas rápidas
    const qFlash = Number(url.searchParams.get("flashMs"));
    const qLong = Number(url.searchParams.get("longMs"));
    const qFallback = Number(url.searchParams.get("fallbackMs"));
    if (Number.isFinite(qFlash) && qFlash > 0) FLASH_MS = qFlash;
    if (Number.isFinite(qLong) && qLong > 0) LONG_MS = qLong;
    if (Number.isFinite(qFallback) && qFallback > 0) FALLBACK_MS = qFallback;
    const MAX_ATTEMPTS_OVERRIDE = Number(url.searchParams.get("maxAttempts"));
    // maxTokens override y modelos alternativos (failover)
    const MAX_TOKENS =
      Number(url.searchParams.get("maxTokens")) ||
      Number(process.env.ADVICE_MAX_TOKENS) ||
      8192;
    const altFromQuery = (url.searchParams.get("alt") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const ALT_MODELS = altFromQuery.length
      ? altFromQuery
      : (
          process.env.ADVICE_ALT_MODELS ||
          "models/gemini-1.5-flash,models/gemini-1.5-flash-8b"
        )
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const PREFER_ALT_FIRST = url.searchParams.get("preferAlt") === "1";
    const userId = await getUserIdFromRequest(request);
    if (!userId)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const user = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!user)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const age = calcAge(user.fecha_nacimiento);

    // ---- Preferencias y configuración ----
    let prefsRaw = user.preferencias_alimentos ?? null;
    let prefs = null;
    try {
      prefs = typeof prefsRaw === "string" ? JSON.parse(prefsRaw) : prefsRaw;
    } catch {
      prefs = null;
    }
    const formatList = (arr) =>
      Array.isArray(arr) && arr.length ? arr.join(", ") : "—";
    const prefsText = prefs
      ? `\nPreferencias declaradas:\n- Carbohidratos preferidos: ${formatList(
          prefs.carbs
        )}\n- Proteínas preferidas: ${formatList(
          prefs.proteins
        )}\n- Fuentes de fibra: ${formatList(
          prefs.fiber
        )}\n- Grasas saludables: ${formatList(
          prefs.fats
        )}\n- Snacks habituales: ${formatList(
          prefs.snacks
        )}\n- Bebidas / infusiones preferidas: ${formatList(
          prefs.beverages
        )}\n- Alimentos a evitar: ${formatList(
          prefs.avoids
        )}\n- Alimentos favoritos: ${formatList(prefs.likes)}`
      : "";
    const em =
      prefs &&
      typeof prefs === "object" &&
      prefs.enabledMeals &&
      typeof prefs.enabledMeals === "object"
        ? prefs.enabledMeals
        : null;
    const wantTypesOrder = [];
    if (em) {
      if (em.desayuno) wantTypesOrder.push("Desayuno");
      if (em.almuerzo) wantTypesOrder.push("Almuerzo");
      if (em.cena) wantTypesOrder.push("Cena");
      const snackCount =
        (em["snack_mañana"] || em.snack_manana ? 1 : 0) +
        (em.snack_tarde ? 1 : 0);
      for (let i = 0; i < snackCount; i++) wantTypesOrder.push("Snack");
    }
    const wantTypesText = wantTypesOrder.length
      ? `\n\nEl usuario seleccionó EXACTAMENTE ${
          wantTypesOrder.length
        } comidas diarias con estos tipos (usa el tipo 'Snack' para snacks): ${wantTypesOrder.join(
          ", "
        )}.\nEl bloque JSON_MEALS debe contener exactamente ${
          wantTypesOrder.length
        } items con esos tipos y ninguno adicional.`
      : "";

    let preferredProteinDaily = null;
    try {
      const w =
        typeof user.peso_kg === "number" && user.peso_kg > 0
          ? user.peso_kg
          : null;
      if (
        typeof user.proteinas_g_obj === "number" &&
        user.proteinas_g_obj > 0
      ) {
        preferredProteinDaily = Math.round(user.proteinas_g_obj);
      } else if (
        prefs &&
        prefs.proteinRangeKg &&
        typeof prefs.proteinRangeKg === "object" &&
        w
      ) {
        const { min, max } = prefs.proteinRangeKg;
        if (typeof min === "number" && typeof max === "number" && max > 0) {
          const mid = (min + max) / 2;
          preferredProteinDaily = Math.round(mid * w);
        }
      }
    } catch {}

    function computePlanHash(u, prefsObj, proteinDaily) {
      try {
        const basis = {
          sexo: u.sexo,
          fecha_nacimiento: u.fecha_nacimiento,
          altura_cm: u.altura_cm,
          peso_kg: u.peso_kg,
          objetivo: u.objetivo,
          nivel_actividad: u.nivel_actividad,
          velocidad_cambio: u.velocidad_cambio,
          pais: u.pais,
          peso_objetivo_kg: u.peso_objetivo_kg,
          proteinas_g_obj: u.proteinas_g_obj,
          preferencias_alimentos: prefsObj,
          preferredProteinDaily: proteinDaily,
        };
        const json = JSON.stringify(basis, Object.keys(basis).sort());
        return crypto.createHash("sha256").update(json).digest("hex");
      } catch {
        return null;
      }
    }
    const currentHash = computePlanHash(user, prefs, preferredProteinDaily);
    const isPrefetch = url.searchParams.get("prefetch") === "1";

    // Si se solicita invalidación, limpiar cache antes de revisar
    if (invalidate) {
      try {
        await prisma.usuario.update({
          where: { id: userId },
          data: { plan_ai: null },
        });
      } catch {}
    }

    // Concurrency guard también para peticiones normales (antes sólo prefetch).
    // Si otra generación está activa: normalmente 202; pero si minFallbackMs=0 -> devolver fallback inmediato 200.
    if (!isPrefetch && activeGenerations.has(userId)) {
      if (forceFallbackNow) {
        const fb = await generateFallbackContent();
        // Extraer bloques básicos para estructurar
        function extractJsonBlock(label, text) {
          if (!text) return null;
          const labelIdx = text.indexOf(label + ":");
          if (labelIdx >= 0) {
            const after = text.slice(labelIdx + label.length + 1);
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
                    } catch {}
                    break;
                  }
                }
              }
            }
          }
          const fenceMatches = text.match(/```json\s*([\s\S]*?)```/gi) || [];
          for (const m of fenceMatches) {
            const inner = m.replace(/```json/i, "").replace(/```$/, "");
            try {
              return JSON.parse(inner.trim());
            } catch {}
          }
          const simple = text.match(/\{[\s\S]*\}/);
          if (simple) {
            try {
              return JSON.parse(simple[0]);
            } catch {}
          }
          return null;
        }
        const summary = extractJsonBlock("JSON_SUMMARY", fb.content) || null;
        const meals = extractJsonBlock("JSON_MEALS", fb.content) || {
          items: [],
        };
        const hydration = extractJsonBlock("JSON_HYDRATION", fb.content) || {
          litros: 2,
        };
        const beveragesPlan =
          extractJsonBlock("JSON_BEVERAGES", fb.content) || null;
        return NextResponse.json(
          {
            advice: fb.content,
            summary,
            meals,
            hydration,
            beverages: beveragesPlan,
            model: fb.usedModel,
            took_ms: fb.genMs,
            fallback: true,
          },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { pending: true },
        { status: 202, headers: { "Retry-After": "10" } }
      );
    }

    if (!forceLong && !invalidate) {
      try {
        const cached =
          user?.plan_ai && typeof user.plan_ai === "object"
            ? user.plan_ai
            : null;
        // Heurística para detectar contenido legacy defectuoso (placeholder anterior)
        function isLegacyOrInvalid(advice) {
          if (!advice) return true;
          const legacyPhrases = [
            "Resumen rápido no disponible por timeout",
            "Resumen rápido no disponible",
            "Resumen rápido (fallback crítico)",
          ];
          if (legacyPhrases.some((p) => advice.includes(p))) return true;
          // Nuevo: considerar inválido cualquier fallback local para forzar un nuevo intento IA al recargar
          if (/^# Consejo generado localmente \(fallback\)/.test(advice.trim()))
            return true;
          // Si no contiene el marcador JSON_SUMMARY probablemente sea incompleto viejo
          if (!advice.includes("JSON_SUMMARY")) return true;
          return false;
        }
        if (
          cached &&
          cached.hash === currentHash &&
          cached.advice &&
          cached.summary &&
          cached.meals &&
          !isLegacyOrInvalid(cached.advice)
        ) {
          return NextResponse.json(
            {
              advice: cached.advice,
              summary: cached.summary,
              meals: cached.meals,
              hydration: cached.hydration,
              beverages: cached.beverages,
              weekly: cached.weekly || null,
              cached: true,
            },
            { status: 200 }
          );
        }
      } catch {}
    }

    const basePrompt = `Eres un nutricionista y entrenador.
Datos del usuario:
- Sexo: ${user.sexo ?? ""}
- Edad: ${age}
- Altura: ${user.altura_cm ?? ""} cm
- Peso actual: ${user.peso_kg ?? ""} kg
- Peso objetivo: ${user.peso_objetivo_kg ?? ""} kg
- Objetivo: ${user.objetivo ?? ""}
- Nivel de actividad: ${user.nivel_actividad ?? ""}
- Velocidad de cambio: ${user.velocidad_cambio ?? ""}
- País: ${user.pais ?? ""}${prefsText}
${
  preferredProteinDaily
    ? `\n- Objetivo de proteína diario (fijado o sugerido por el usuario): ${preferredProteinDaily} g/día`
    : ""
}

Tareas:
1) Mensaje de bienvenida corto.
2) Análisis detallado de la información.
3) Estimar TMB (Mifflin-St Jeor) y TDEE.
4) Recomendación de ingesta calórica.
5) Proyección semanal de cambio de peso.
6) Recomendaciones prácticas (2-3 bullets) y distribución de macros.
7) PLAN SEMANAL COMPLETO: Crea comidas variadas y personalizadas para 7 días, con rotación de ingredientes para evitar monotonía. Cada comida debe tener ingredientes específicos con cantidades en gramos.
Formato: subtítulos claros y bullets.

Guía de cálculo:
- Fórmula TMB (Mifflin-St Jeor) y factores actividad.
- Ajuste calórico según objetivo y velocidad (déficit/superávit razonables).
- Reparto macros: proteína según objetivo, grasas 20-30%, resto carbohidratos.
- Proyección usando ~7700 kcal ≈ 1 kg.

Reglas para el PLAN SEMANAL:
- Crea comidas REALMENTE VARIADAS usando preferencias del usuario y alimentos permitidos
- Cada comida debe tener ingredientes específicos con cantidades exactas en gramos
- Incluye 4-6 comidas por día según las preferencias del usuario
- Varía los ingredientes entre días para evitar repetición
- Usa nombres descriptivos para cada comida (ej: "Ensalada de quinoa con pollo" en lugar de "Almuerzo")
- Incluye medidas caseras aproximadas (ej: "1 pechuga mediana", "1/2 taza de arroz")
- Considera restricciones alimentarias y preferencias declaradas
- Haz que las comidas sean atractivas y apetitosas
- Genera múltiples opciones para cada tipo de comida para permitir rotación
- Incluye variedad de proteínas, carbohidratos y vegetales
- Considera el objetivo calórico y de macronutrientes del usuario

Salida estructurada al final, cada bloque en su línea:
- JSON_SUMMARY {...} (incluye tmb, tdee, kcal_objetivo, deficit_superavit_kcal, ritmo_peso_kg_sem, macros y agrega obligatoriamente "tiempo_estimado_semanas" (número) y "fecha_meta_estimada_iso" (fecha ISO) calculados a partir del peso actual vs. objetivo y el ritmo semanal)
- JSON_MEALS {...} (con comidas variadas y específicas)
- JSON_HYDRATION {...} (con "litros" diarios recomendados derivados del peso y objetivo)
- JSON_BEVERAGES {...}
- OPCIONAL JSON_MEALS_VARIANTS {...}
${wantTypesText}`;

    // Booster adicional para forzar riqueza si el usuario pide ensureFull
    const PROMPT_BOOSTER = `\n\nIMPORTANTE (REGLAS ESTRICTAS PARA RESPUESTA COMPLETA):\n- NO omitas NINGÚN bloque JSON solicitado.\n- Antes de los bloques JSON, genera una narrativa estructurada (≈600-1200 palabras) que cubra: bienvenida personalizada, análisis, cálculos paso a paso (TMB, TDEE), razonamiento del ajuste calórico, reparto de macros con justificación y recomendaciones prácticas.\n- Cada comida del PLAN SEMANAL debe ser única (no repitas exactamente la misma combinación más de una vez).\n- Usa ingredientes REALISTAS y variados, cantidades en gramos y, entre paréntesis, una medida casera aproximada cuando aplique.\n- Asegura que los tipos de comida EXACTOS solicitados (${
      wantTypesOrder.join(", ") || "Desayuno, Almuerzo, Cena, Snack"
    }) aparezcan en JSON_MEALS en ese orden, sin extras.\n- Nombra cada comida con un título atractivo y descriptivo (ej: "Bowls de quinoa con charque" en lugar de "Almuerzo").\n- Después de la narrativa coloca cada bloque JSON en SU PROPIA LÍNEA, empezando con la etiqueta (ej: JSON_SUMMARY { ... }).\n- Si estás cerca de límite de tokens, PRIORIZA completar todos los bloques JSON completos y válidos.\n- NO inventes calorías imposibles ni macros incoherentes; mantén consistencia (proteína objetivo ${
      preferredProteinDaily || "calculada"
    } g/día).`;

    const effectivePrompt = ensureFull
      ? basePrompt + PROMPT_BOOSTER
      : basePrompt;

    // ---- Generación IA (prefetch y principal) ----

    // Fallback local enriquecido con cálculos reales si la IA falla
    async function generateFallbackContent() {
      const t0 = Date.now();
      try {
        // Calcular TMB (Mifflin-St Jeor)
        const peso = typeof user.peso_kg === "number" ? user.peso_kg : null;
        const altura =
          typeof user.altura_cm === "number" ? user.altura_cm : null;
        const edad = age || null;
        let tmb = null;
        if (peso && altura && edad != null && user.sexo) {
          if ((user.sexo || "").toLowerCase().startsWith("m")) {
            tmb = 10 * peso + 6.25 * altura - 5 * edad + 5;
          } else {
            tmb = 10 * peso + 6.25 * altura - 5 * edad - 161;
          }
        }
        // Factor actividad heurístico
        const actividad = (user.nivel_actividad || "").toLowerCase();
        const actFactor = actividad.includes("alto")
          ? 1.55
          : actividad.includes("moder")
          ? 1.45
          : actividad.includes("lig")
          ? 1.35
          : 1.25;
        const tdee = tmb ? tmb * actFactor : null;
        // Ajuste según objetivo
        const objetivo = (user.objetivo || "").toLowerCase();
        const vel = (user.velocidad_cambio || "").toLowerCase();
        let delta = 0; // kcal/día
        if (objetivo.includes("bajar") || objetivo.includes("grasa")) {
          delta = -350;
          if (vel.includes("rap") || vel.includes("alto")) delta = -500;
          if (vel.includes("suave")) delta = -250;
        } else if (objetivo.includes("ganar") || objetivo.includes("mus")) {
          delta = 250;
          if (vel.includes("rap") || vel.includes("alto")) delta = 350;
          if (vel.includes("suave")) delta = 150;
        }
        const kcalObjetivo = tdee
          ? Math.max(1200, Math.round(tdee + delta))
          : null;
        // Proteína
        const prote =
          preferredProteinDaily ||
          (peso
            ? Math.round(peso * (objetivo.includes("ganar") ? 1.9 : 1.6))
            : 0);
        // Grasas 25% kcal
        const grasas = kcalObjetivo ? Math.round((kcalObjetivo * 0.25) / 9) : 0;
        // Carbos resto
        const carbos = kcalObjetivo
          ? Math.max(0, Math.round((kcalObjetivo - prote * 4 - grasas * 9) / 4))
          : 0;
        // Ritmo estimado (kg/sem) usando 7700 kcal
        const ritmo = delta !== 0 ? +((delta * 7) / 7700).toFixed(2) : 0;

        // Construir comidas básicas usando alimentos guardados si existen
        const mealTypes = wantTypesOrder.length
          ? wantTypesOrder
          : ["Desayuno", "Almuerzo", "Cena", "Snack"];
        const basic = await (async () => {
          try {
            return await generateBasicItemsByTypes(userId, mealTypes);
          } catch {
            return [];
          }
        })();
        const meals = {
          items: basic.map((m) => ({
            ...m,
            nombre: m.nombre || m.tipo + " base",
          })),
        };
        const hydration = { litros: 2 };
        const beverages = { items: [] };
        const deltaKg =
          peso && user.peso_objetivo_kg
            ? Math.abs(peso - user.peso_objetivo_kg)
            : null;
        const ritmoAbs = Math.abs(ritmo);
        let etaWeeks = null;
        if (deltaKg && ritmoAbs > 0.01) {
          etaWeeks = Math.min(156, Math.max(0.5, deltaKg / ritmoAbs));
        }
        const etaDate = etaWeeks
          ? (() => {
              const d = new Date();
              d.setDate(d.getDate() + Math.round(etaWeeks * 7));
              return d;
            })()
          : null;
        const summary = {
          tmb: tmb ? Math.round(tmb) : 0,
          tdee: tdee ? Math.round(tdee) : 0,
          kcal_objetivo: kcalObjetivo || 0,
          deficit_superavit_kcal: delta,
          ritmo_peso_kg_sem: ritmo,
          proteinas_g: prote,
          grasas_g: grasas,
          carbohidratos_g: carbos,
        };
        if (peso != null) summary.peso_actual_kg = peso;
        if (user.peso_objetivo_kg)
          summary.peso_objetivo_kg = user.peso_objetivo_kg;
        if (etaWeeks) {
          summary.tiempo_estimado_semanas = Number(etaWeeks.toFixed(1));
          summary.tiempo_estimado_meses = Number((etaWeeks / 4.345).toFixed(1));
          if (etaDate) summary.fecha_meta_estimada = etaDate.toISOString();
          summary.delta_peso_kg = Number(deltaKg?.toFixed(2) || 0);
        }
        const explanation = `# Consejo generado localmente (fallback)\n\nSe produjo un timeout o error con el proveedor de IA. Generamos un plan base calculado localmente para que no te quedes sin información. Cuando reintentes más tarde, se intentará obtener una versión enriquecida con más variedad y análisis narrativo.\n\n## Resumen calculado\n- TMB (estimado): ${
          summary.tmb || "—"
        } kcal\n- TDEE (estimado): ${
          summary.tdee || "—"
        } kcal\n- Ajuste objetivo: ${delta} kcal/día\n- Kcal objetivo: ${
          summary.kcal_objetivo || "—"
        } kcal\n- Ritmo estimado: ${
          summary.ritmo_peso_kg_sem || 0
        } kg/sem\n- Proteínas: ${summary.proteinas_g} g\n- Grasas: ${
          summary.grasas_g
        } g\n- Carbohidratos: ${
          summary.carbohidratos_g
        } g\n\n## Recomendaciones base\n* Prioriza distribución pareja de proteína en cada comida.\n* Mantén verduras/fibra en 2-3 comidas al día.\n* Hidrátate de forma constante (2 L objetivo base).\n\n## Próximo paso\nPulsa “Regenerar” para intentar una versión completa cuando el servicio esté disponible.\n`;
        const content = `${explanation}\nJSON_SUMMARY: ${JSON.stringify(
          summary
        )}\nJSON_MEALS: ${JSON.stringify(
          meals
        )}\nJSON_HYDRATION: ${JSON.stringify(
          hydration
        )}\nJSON_BEVERAGES: ${JSON.stringify(beverages)}`;
        return { content, usedModel: "fallback-local", genMs: Date.now() - t0 };
      } catch (e) {
        const content = `Resumen rápido (fallback crítico).\n\nJSON_SUMMARY: {"tmb":0,"tdee":0,"kcal_objetivo":0,"deficit_superavit_kcal":0,"ritmo_peso_kg_sem":0,"proteinas_g":${
          preferredProteinDaily || 0
        },"grasas_g":0,"carbohidratos_g":0}\nJSON_MEALS: {"items":[]}\nJSON_HYDRATION: {"litros":2}\nJSON_BEVERAGES: {"items":[]}`;
        return { content, usedModel: "fallback-local", genMs: Date.now() - t0 };
      }
    }

    async function generateFullAdvice(promptText, opts = { forceLong: false }) {
      const FULL_PROMPT = `Eres un experto en nutrición y entrenamiento, preciso y claro.\n\n${promptText}`;
      async function runModel(modelName, fullPrompt) {
        return generateText({
          model: google(modelName),
          prompt: fullPrompt,
          temperature: 0.7,
          maxTokens: 8192,
        });
      }
      async function withTimeout(promise, ms) {
        let to;
        const timeout = new Promise((_, rej) => {
          to = setTimeout(() => rej(new Error("timeout")), ms);
        });
        return Promise.race([promise, timeout]).finally(() => clearTimeout(to));
      }
      const t0 = Date.now();
      let content = null;
      let usedModel = null;
      let phase = "start";
      let genMs = null; // genMs se calcula al final salvo fallback
      const attemptLog = [];
      try {
        if (opts.forceLong && !USE_FAST) {
          phase = "long-primary";
          const res = await withTimeout(
            runModel(GEMINI_MODEL_LONG, FULL_PROMPT),
            LONG_MS
          );
          content = res.text;
          usedModel = GEMINI_MODEL_LONG;
          attemptLog.push({
            phase,
            model: usedModel,
            chars: content?.length || 0,
          });
        } else {
          // Flash primero (más rápido)
          phase = "flash-primary";
          try {
            const resFlash = await withTimeout(
              runModel(GEMINI_MODEL_FALLBACK, FULL_PROMPT),
              FLASH_MS
            );
            content = resFlash.text;
            usedModel = GEMINI_MODEL_FALLBACK;
            attemptLog.push({
              phase,
              model: usedModel,
              chars: content?.length || 0,
            });
          } catch (eFlash) {
            if (!USE_FAST) {
              // Intentar long si no estamos en fast mode
              phase = "long-after-flash-fail";
              try {
                const resLong = await withTimeout(
                  runModel(GEMINI_MODEL_LONG, FULL_PROMPT),
                  LONG_MS
                );
                content = resLong.text;
                usedModel = GEMINI_MODEL_LONG;
                attemptLog.push({
                  phase,
                  model: usedModel,
                  chars: content?.length || 0,
                });
              } catch (eLong) {
                phase = "flash-reduced";
                try {
                  const shortPrompt =
                    FULL_PROMPT + "\n\n(Genera solo bloques JSON concisos.)";
                  const resShort = await withTimeout(
                    runModel(GEMINI_MODEL_FALLBACK, shortPrompt),
                    FALLBACK_MS
                  );
                  content = resShort.text;
                  usedModel = GEMINI_MODEL_FALLBACK + "-short";
                  attemptLog.push({
                    phase,
                    model: usedModel,
                    chars: content?.length || 0,
                  });
                } catch (eShort) {
                  phase = "local-fallback-delay-check";
                  if (!canUseLocalFallback(t0)) {
                    await waitMinWindow(t0);
                  }
                  phase = "local-fallback";
                  const fallbackResult = await generateFallbackContent();
                  content = fallbackResult.content;
                  usedModel = fallbackResult.usedModel;
                  genMs = fallbackResult.genMs;
                  attemptLog.push({
                    phase,
                    model: usedModel,
                    chars: content?.length || 0,
                  });
                }
              }
            } else {
              // Fast mode: ir directo a short y luego local
              phase = "flash-reduced-fast";
              try {
                const shortPrompt =
                  FULL_PROMPT + "\n\n(Genera solo bloques JSON concisos.)";
                const resShort = await withTimeout(
                  runModel(GEMINI_MODEL_FALLBACK, shortPrompt),
                  FALLBACK_MS
                );
                content = resShort.text;
                usedModel = GEMINI_MODEL_FALLBACK + "-short";
                attemptLog.push({
                  phase,
                  model: usedModel,
                  chars: content?.length || 0,
                });
              } catch (eShortFast) {
                phase = "local-fallback-fast-delay-check";
                if (!canUseLocalFallback(t0)) {
                  await waitMinWindow(t0);
                }
                phase = "local-fallback-fast";
                const fallbackResult = await generateFallbackContent();
                content = fallbackResult.content;
                usedModel = fallbackResult.usedModel;
                genMs = fallbackResult.genMs;
                attemptLog.push({
                  phase,
                  model: usedModel,
                  chars: content?.length || 0,
                });
              }
            }
          }
        }
      } catch (err) {
        phase = "catch-local-fallback-delay-check";
        if (!canUseLocalFallback(t0)) {
          await waitMinWindow(t0);
        }
        phase = "catch-local-fallback";
        const fallbackResult = await generateFallbackContent();
        content = fallbackResult.content;
        usedModel = fallbackResult.usedModel;
        genMs = fallbackResult.genMs;
      }
      // Si no se estableció antes (fallback), calcular duración ahora
      genMs = genMs ?? Date.now() - t0;

      // Reintento extendido si el usuario solicita ensureFull y el resultado parece incompleto (modelo short, fallback o texto muy corto)
      if (ensureFull || strictMode) {
        const looksShort =
          !content || content.length < 1200 || /-short$/.test(usedModel || "");
        const isLocalFallback = (usedModel || "").startsWith("fallback");
        if ((looksShort || isLocalFallback) && !USE_FAST) {
          try {
            const extraMs = strictMode ? 45000 : 15000;
            const extendedTimeout = ADVICE_LONG_TIMEOUT_MS + extraMs; // tiempo extendido
            const startRetry = Date.now();
            const resExtended = await withTimeout(
              runModel(GEMINI_MODEL_LONG, FULL_PROMPT),
              extendedTimeout
            );
            content = resExtended.text;
            usedModel = GEMINI_MODEL_LONG + "-extended";
            phase = phase + ":extended-long";
            // actualizar duración total sumando el retry
            genMs += Date.now() - startRetry;
          } catch (eExtended) {
            // si falla, mantenemos el contenido previo
            phase = phase + ":extended-fail";
          }
        }
      }
      console.log(
        `[advice][generateFullAdvice] phase=${phase} model=${usedModel} genMs=${genMs} attempts=${JSON.stringify(
          attemptLog
        )}`
      );
      return { content, usedModel: usedModel || "unknown", genMs };
    }

    function buildLocalSummary() {
      // Intenta construir un summary mínimo utilizando datos del usuario si falta o viene vacío
      try {
        const peso = typeof user.peso_kg === "number" ? user.peso_kg : null;
        const altura =
          typeof user.altura_cm === "number" ? user.altura_cm : null;
        const edad = age || null;
        let tmb = 0;
        if (peso && altura && edad != null && user.sexo) {
          if ((user.sexo || "").toLowerCase().startsWith("m")) {
            tmb = 10 * peso + 6.25 * altura - 5 * edad + 5;
          } else {
            tmb = 10 * peso + 6.25 * altura - 5 * edad - 161;
          }
        }
        const actividad = (user.nivel_actividad || "").toLowerCase();
        const actFactor = actividad.includes("alto")
          ? 1.55
          : actividad.includes("moder")
          ? 1.45
          : actividad.includes("lig")
          ? 1.35
          : 1.25;
        const tdee = tmb ? Math.round(tmb * actFactor) : 0;
        const objetivo = (user.objetivo || "").toLowerCase();
        const vel = (user.velocidad_cambio || "").toLowerCase();
        let delta = 0;
        if (objetivo.includes("bajar") || objetivo.includes("grasa")) {
          delta = -350;
          if (vel.includes("rap") || vel.includes("alto")) delta = -500;
          if (vel.includes("suave")) delta = -250;
        } else if (objetivo.includes("ganar") || objetivo.includes("mus")) {
          delta = 250;
          if (vel.includes("rap") || vel.includes("alto")) delta = 350;
          if (vel.includes("suave")) delta = 150;
        }
        const kcal_objetivo = tdee ? Math.max(1200, tdee + delta) : 0;
        const proteinas_g =
          preferredProteinDaily ||
          (peso
            ? Math.round(peso * (objetivo.includes("ganar") ? 1.9 : 1.6))
            : 0);
        const grasas_g = kcal_objetivo
          ? Math.round((kcal_objetivo * 0.25) / 9)
          : 0;
        const carbohidratos_g = kcal_objetivo
          ? Math.max(
              0,
              Math.round((kcal_objetivo - proteinas_g * 4 - grasas_g * 9) / 4)
            )
          : 0;
        const ritmo_peso_kg_sem =
          delta !== 0 ? +((delta * 7) / 7700).toFixed(2) : 0;
        return {
          tmb,
          tdee,
          kcal_objetivo,
          deficit_superavit_kcal: delta,
          ritmo_peso_kg_sem,
          proteinas_g,
          grasas_g,
          carbohidratos_g,
        };
      } catch {
        return null;
      }
    }

    function toNumberOrNull(value) {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (typeof value === "string") {
        const normalized = value.replace(",", ".");
        const match = normalized.match(/-?\d+(?:\.\d+)?/);
        if (match) {
          const num = Number(match[0]);
          if (Number.isFinite(num)) return num;
        }
      }
      return null;
    }

    function estimateTmbFromProfile() {
      const peso = typeof user.peso_kg === "number" ? user.peso_kg : null;
      const altura = typeof user.altura_cm === "number" ? user.altura_cm : null;
      const edad = age ?? null;
      if (peso && altura && edad != null && user.sexo) {
        const male = (user.sexo || "").toLowerCase().startsWith("m");
        return male
          ? 10 * peso + 6.25 * altura - 5 * edad + 5
          : 10 * peso + 6.25 * altura - 5 * edad - 161;
      }
      return null;
    }

    function estimateTdee(summaryCandidate) {
      if (summaryCandidate && typeof summaryCandidate === "object") {
        const direct = toNumberOrNull(
          summaryCandidate.tdee ?? summaryCandidate.TDEE
        );
        if (direct && direct > 800) return direct;
        const kcal = toNumberOrNull(summaryCandidate.kcal_objetivo);
        const delta = toNumberOrNull(summaryCandidate.deficit_superavit_kcal);
        if (kcal != null && delta != null) {
          const derived = kcal - delta;
          if (derived > 800) return derived;
        }
      }
      const tmb = estimateTmbFromProfile();
      if (!tmb) return null;
      const actividad = (user.nivel_actividad || "").toLowerCase();
      let factor = 1.25;
      if (/muy\s*alto|extrem/.test(actividad)) factor = 1.9;
      else if (/alto|intens/.test(actividad)) factor = 1.6;
      else if (/moder/.test(actividad)) factor = 1.5;
      else if (/lig/.test(actividad)) factor = 1.35;
      return Math.max(900, Math.round(tmb * factor));
    }

    function classifyGoalType() {
      const raw = (user.objetivo || "").toLowerCase();
      if (/bajar|grasa|defin|perder/.test(raw)) return "loss";
      if (/ganar|muscul|subir|hiper/.test(raw)) return "gain";
      return "maint";
    }

    function classifySpeedType() {
      const raw = (user.velocidad_cambio || "").toLowerCase();
      if (/rap|alto|agres|intens/.test(raw)) return "fast";
      if (/lent|suav/.test(raw)) return "slow";
      return "moderate";
    }

    function getDeltaBounds(goalType, speedType) {
      const presets = {
        loss: { slow: -350, moderate: -500, fast: -700 },
        gain: { slow: 250, moderate: 350, fast: 500 },
        maint: { slow: 0, moderate: 0, fast: 0 },
      };
      const target =
        presets[goalType]?.[speedType] ?? presets[goalType]?.moderate ?? 0;
      const min = goalType === "loss" ? -900 : goalType === "gain" ? 150 : -120;
      const max = goalType === "loss" ? -250 : goalType === "gain" ? 700 : 150;
      return { target, min, max };
    }

    function sanitizeSummaryTargets(summaryCandidate) {
      if (!summaryCandidate || typeof summaryCandidate !== "object") return;
      const tdeeEst = estimateTdee(summaryCandidate);
      if (!tdeeEst || !Number.isFinite(tdeeEst)) return;
      const goalType = classifyGoalType();
      const speedType = classifySpeedType();
      const { target, min, max } = getDeltaBounds(goalType, speedType);
      let kcal = toNumberOrNull(summaryCandidate.kcal_objetivo);
      const expected = Math.round(tdeeEst + target);
      if (kcal == null) kcal = expected;
      const minCalories = Math.max(1100, Math.round(tdeeEst + min));
      const maxCalories = Math.max(minCalories, Math.round(tdeeEst + max));
      let adjusted = Math.min(Math.max(kcal, minCalories), maxCalories);
      if (goalType === "loss") {
        adjusted = Math.min(adjusted, Math.round(tdeeEst - 100));
      } else if (goalType === "gain") {
        adjusted = Math.max(adjusted, Math.round(tdeeEst + 100));
      }
      summaryCandidate.kcal_objetivo = adjusted;
      const delta = Math.round(adjusted - tdeeEst);
      summaryCandidate.deficit_superavit_kcal = delta;
      if (summaryCandidate.tdee == null || summaryCandidate.tdee <= 0) {
        summaryCandidate.tdee = Math.round(tdeeEst);
      }
      if (summaryCandidate.tmb == null || summaryCandidate.tmb <= 0) {
        const tmb = estimateTmbFromProfile();
        if (tmb) summaryCandidate.tmb = Math.round(tmb);
      }
      const ritmo = delta !== 0 ? Number(((delta * 7) / 7700).toFixed(2)) : 0;
      summaryCandidate.ritmo_peso_kg_sem = ritmo;

      if (summaryCandidate.proteinas_g == null) {
        if (preferredProteinDaily) {
          summaryCandidate.proteinas_g = preferredProteinDaily;
        } else if (typeof user.peso_kg === "number") {
          const multiplier =
            goalType === "gain" ? 1.9 : goalType === "loss" ? 1.7 : 1.6;
          summaryCandidate.proteinas_g = Math.round(user.peso_kg * multiplier);
        }
      }
      const fats = toNumberOrNull(summaryCandidate.grasas_g);
      if (fats == null || fats <= 0) {
        summaryCandidate.grasas_g = Math.max(
          0,
          Math.round((adjusted * 0.25) / 9)
        );
      }
      const carbs = toNumberOrNull(summaryCandidate.carbohidratos_g);
      if (carbs == null || carbs < 0) {
        const prot = toNumberOrNull(summaryCandidate.proteinas_g) || 0;
        const fatsNow = toNumberOrNull(summaryCandidate.grasas_g) || 0;
        const remaining = adjusted - prot * 4 - fatsNow * 9;
        summaryCandidate.carbohidratos_g = Math.max(
          0,
          Math.round(remaining / 4)
        );
      }
    }

    // PREFETCH: lanzar generación en background y devolver rápido 202
    if (isPrefetch && !forceLong) {
      if (!activeGenerations.has(userId)) {
        const startedAt = Date.now();
        let finished = false;
        const genPromise = (async () => {
          try {
            const { content, usedModel, genMs } = await generateFullAdvice(
              effectivePrompt,
              { forceLong: false }
            );
            // Parse y cache (reutilizando extract logic del flujo principal -> lo duplicamos mínimo aquí para aislar)
            function extractJsonBlock(label, text) {
              if (!text) return null;
              const labelIdx = text.indexOf(label + ":");
              if (labelIdx >= 0) {
                const after = text.slice(labelIdx + label.length + 1);
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
                        } catch {}
                        break;
                      }
                    }
                  }
                }
              }
              const fenceMatches =
                text.match(/```json\s*([\s\S]*?)```/gi) || [];
              for (const m of fenceMatches) {
                const inner = m.replace(/```json/i, "").replace(/```$/, "");
                try {
                  return JSON.parse(inner.trim());
                } catch {}
              }
              const simple = text.match(/\{[\s\S]*\}/);
              if (simple) {
                try {
                  return JSON.parse(simple[0]);
                } catch {}
              }
              return null;
            }
            let summary = extractJsonBlock("JSON_SUMMARY", content) || null;
            let meals = extractJsonBlock("JSON_MEALS", content) || null;
            let hydration = extractJsonBlock("JSON_HYDRATION", content) || null;
            let beveragesPlan =
              extractJsonBlock("JSON_BEVERAGES", content) || null;
            const vObj =
              extractJsonBlock("JSON_MEALS_VARIANTS", content) || null;
            if (meals && vObj && vObj.variants) {
              try {
                meals.variants = vObj.variants;
              } catch {}
            }
            if (summary && preferredProteinDaily) {
              try {
                summary.proteinas_g = preferredProteinDaily;
              } catch {}
            }
            try {
              if (currentHash && meals && summary && content) {
                const isLocalFallback = (usedModel || "").startsWith(
                  "fallback-local"
                );
                if (!isLocalFallback) {
                  const cacheObj = {
                    advice: content,
                    summary,
                    meals,
                    hydration,
                    beverages: beveragesPlan,
                    hash: currentHash,
                    model: usedModel,
                    generated_ms: genMs,
                    ts: new Date().toISOString(),
                  };
                  await prisma.usuario.update({
                    where: { id: userId },
                    data: { plan_ai: cacheObj },
                  });
                }
              }
            } catch {}
            finished = true;
          } catch (e) {
            console.error("[advice][prefetch] error", e);
          } finally {
            finished = true;
            activeGenerations.delete(userId);
          }
        })();
        activeGenerations.set(userId, genPromise);
        // Watchdog
        // Watchdog ampliado: no forzar fallback antes de la ventana mínima salvo que ADVICE_PREFETCH_MAX_MS supere ese valor.
        const watchdogLimit = Math.max(PREFETCH_MAX_MS, ADVICE_MIN_FALLBACK_MS);
        setTimeout(() => {
          if (!finished && Date.now() - startedAt >= watchdogLimit) {
            console.warn(
              `[advice][prefetch][watchdog] excedido ${watchdogLimit}ms -> liberando slot. Se permitirá fallback local en próxima solicitud.`
            );
            activeGenerations.delete(userId);
            // NO cacheamos fallback inmediato aquí; dejamos que la siguiente petición decida según canUseLocalFallback.
          }
        }, watchdogLimit + 100);
      }
      return NextResponse.json(
        { started: true },
        { status: 202, headers: { "Retry-After": "10" } }
      );
    }

    // Si hay una generación activa (iniciada vía prefetch) evitar trabajo duplicado;
    // si minFallbackMs=0 -> devolver fallback inmediato 200.
    if (activeGenerations.has(userId) && !forceLong) {
      if (forceFallbackNow) {
        const fb = await generateFallbackContent();
        function extractJsonBlock(label, text) {
          if (!text) return null;
          const labelIdx = text.indexOf(label + ":");
          if (labelIdx >= 0) {
            const after = text.slice(labelIdx + label.length + 1);
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
                    } catch {}
                    break;
                  }
                }
              }
            }
          }
          const fenceMatches = text.match(/```json\s*([\s\S]*?)```/gi) || [];
          for (const m of fenceMatches) {
            const inner = m.replace(/```json/i, "").replace(/```$/, "");
            try {
              return JSON.parse(inner.trim());
            } catch {}
          }
          const simple = text.match(/\{[\s\S]*\}/);
          if (simple) {
            try {
              return JSON.parse(simple[0]);
            } catch {}
          }
          return null;
        }
        const summary = extractJsonBlock("JSON_SUMMARY", fb.content) || null;
        const meals = extractJsonBlock("JSON_MEALS", fb.content) || {
          items: [],
        };
        const hydration = extractJsonBlock("JSON_HYDRATION", fb.content) || {
          litros: 2,
        };
        const beveragesPlan =
          extractJsonBlock("JSON_BEVERAGES", fb.content) || null;
        return NextResponse.json(
          {
            advice: fb.content,
            summary,
            meals,
            hydration,
            beverages: beveragesPlan,
            model: fb.usedModel,
            took_ms: fb.genMs,
            fallback: true,
          },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { pending: true },
        { status: 202, headers: { "Retry-After": "10" } }
      );
    }

    const prompt = basePrompt; // El contenido completo ya está en basePrompt, evitar duplicar texto crudo aquí
    // --- FIN prompt residual eliminado ---
    // Continuar con generación usando "prompt" (toda la lógica de instrucciones ya está incluida en basePrompt previamente)
    // BLOQUE DUPLICADO DE INSTRUCCIONES ELIMINADO (antes causaba error de parseo)

    // Use AI SDK to generate text (the provider reads GOOGLE_GENERATIVE_AI_API_KEY from env)
    async function runModel(modelName, fullPrompt) {
      console.log(`[advice] Intentando usar modelo: ${modelName}`);
      // Informational: if a legacy GOOGLE_GENERATIVE_AI_API_KEY exists, log its presence in debug only.
      if (
        process.env.GOOGLE_GENERATIVE_AI_API_KEY &&
        process.env.NODE_ENV !== "production"
      ) {
        console.log(
          `[advice] GOOGLE_GENERATIVE_AI_API_KEY present (len=${process.env.GOOGLE_GENERATIVE_AI_API_KEY.length})`
        );
      }
      // Helper: sleep ms
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      // Try calling generateText with retries and exponential backoff for retryable errors.
      async function callWithRetries(modelSpec, prompt, opts = {}) {
        const maxAttempts =
          Number.isFinite(MAX_ATTEMPTS_OVERRIDE) && MAX_ATTEMPTS_OVERRIDE > 0
            ? MAX_ATTEMPTS_OVERRIDE
            : opts.maxAttempts || 4;
        const baseDelay = opts.baseDelay || 500; // ms
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const res = await generateText({
              model: modelSpec,
              prompt,
              temperature: 0.7,
              maxTokens: opts.maxTokens || MAX_TOKENS,
            });
            console.log(
              `[advice] modelo-call OK (attempt ${attempt}/${maxAttempts})`
            );
            return res;
          } catch (err) {
            const isRetryable =
              err &&
              (err.isRetryable ||
                (err.statusCode &&
                  [429, 502, 503, 504].includes(err.statusCode)));
            console.warn(
              `[advice] modelo-call error attempt ${attempt}/${maxAttempts}: ${
                err?.message || err
              }`
            );
            if (!isRetryable) {
              throw err;
            }
            if (attempt < maxAttempts) {
              const delay = baseDelay * Math.pow(2, attempt - 1);
              console.log(`[advice] retrying after ${delay}ms`);
              await sleep(delay + Math.floor(Math.random() * 200));
            } else {
              // last attempt failed -> rethrow
              throw err;
            }
          }
        }
      }

      try {
        // If an API key is present, prefer calling the Google provider wrapper directly
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (apiKey) {
          console.log(
            "[advice] GOOGLE_GENERATIVE_AI_API_KEY present -> using provider wrapper directly to avoid gateway routing"
          );
          try {
            const googleModel = google(modelName, { apiKey });
            return await callWithRetries(googleModel, fullPrompt, {
              maxAttempts: 3,
              baseDelay: 700,
              maxTokens: 8192,
            });
          } catch (errWrapper) {
            console.warn(
              `[advice] Provider-wrapped request failed: ${
                errWrapper?.message || errWrapper
              }`
            );
            // Last attempt with a reduced prompt
            try {
              const shortPrompt =
                fullPrompt +
                "\n\n(Respuesta concisa: genera solo los bloques JSON pedidos y un breve análisis.)";
              const googleModel2 = google(modelName, { apiKey });
              return await callWithRetries(googleModel2, shortPrompt, {
                maxAttempts: 2,
                baseDelay: 800,
                maxTokens: 2400,
              });
            } catch (errShort) {
              console.warn(
                `[advice] Short prompt attempt failed: ${
                  errShort?.message || errShort
                }`
              );
              // Si preferimos alternativos primero o tras fallar, intentar ALT_MODELS
              if (PREFER_ALT_FIRST && ALT_MODELS.length) {
                for (const alt of ALT_MODELS) {
                  try {
                    const altModel = google(alt, { apiKey });
                    const resAlt = await callWithRetries(altModel, fullPrompt, {
                      maxAttempts: 1,
                      baseDelay: 500,
                      maxTokens: MAX_TOKENS,
                    });
                    console.log(`[advice] alt-first OK -> ${alt}`);
                    return resAlt;
                  } catch (eAlt) {
                    console.warn(
                      `[advice] alt-first fail ${alt}: ${eAlt?.message || eAlt}`
                    );
                  }
                }
              }
              throw errShort;
            }
          }
        } else {
          // No API key: try plain model name via provider routing first, then the provider wrapper without explicit key
          try {
            return await callWithRetries(modelName, fullPrompt, {
              maxAttempts: 3,
              baseDelay: 500,
              maxTokens: 8192,
            });
          } catch (errPlain) {
            console.warn(
              `[advice] Plain model name request failed, will retry with provider wrapper: ${
                errPlain?.message || errPlain
              }`
            );
            try {
              const googleModel = google(modelName);
              return await callWithRetries(googleModel, fullPrompt, {
                maxAttempts: 3,
                baseDelay: 700,
                maxTokens: 8192,
              });
            } catch (errWrapper) {
              console.warn(
                `[advice] Provider-wrapped request failed: ${
                  errWrapper?.message || errWrapper
                }`
              );
              try {
                const shortPrompt =
                  fullPrompt +
                  "\n\n(Respuesta concisa: genera solo los bloques JSON pedidos y un breve análisis.)";
                const googleModel2 = google(modelName);
                return await callWithRetries(googleModel2, shortPrompt, {
                  maxAttempts: 2,
                  baseDelay: 800,
                  maxTokens: 2400,
                });
              } catch (errShort) {
                console.warn(
                  `[advice] Short prompt attempt failed: ${
                    errShort?.message || errShort
                  }`
                );
                if (PREFER_ALT_FIRST && ALT_MODELS.length) {
                  for (const alt of ALT_MODELS) {
                    try {
                      const altModel = google(alt);
                      const resAlt = await callWithRetries(
                        altModel,
                        fullPrompt,
                        {
                          maxAttempts: 1,
                          baseDelay: 500,
                          maxTokens: MAX_TOKENS,
                        }
                      );
                      console.log(`[advice] alt-first OK -> ${alt}`);
                      return resAlt;
                    } catch (eAlt) {
                      console.warn(
                        `[advice] alt-first fail ${alt}: ${
                          eAlt?.message || eAlt
                        }`
                      );
                    }
                  }
                }
                throw errShort;
              }
            }
          }
        }
      } catch (error) {
        // If quota exceeded or resource exhausted, or provider overloaded, gestionar fallbacks/alternativos
        try {
          const statusCode =
            error?.statusCode ||
            (error?.data && error.data.error && error.data.error.code) ||
            null;
          const msg = String(error?.message || "");
          const isQuota =
            statusCode === 429 ||
            /quota exceeded|RESOURCE_EXHAUSTED|generate_content_free_tier_requests/i.test(
              msg
            );
          const isOverloaded =
            statusCode === 503 || /overloaded|UNAVAILABLE/i.test(msg);
          // Nuevo: clave inválida/filtrada -> fallback inmediato sin esperar ventana mínima
          const isLeakedOrDenied =
            statusCode === 403 ||
            /PERMISSION_DENIED|Your API key was reported as leaked|API key invalid/i.test(
              msg
            );
          if (isLeakedOrDenied) {
            console.warn(
              `[advice] API key inválida/denegada detectada (status=${statusCode}). Generando fallback local inmediato.`
            );
            const fb = await generateFallbackContent();
            return {
              text: fb.content,
              usedModel: fb.usedModel,
              genMs: fb.genMs,
              keyDenied: true,
            };
          }
          if (isQuota) {
            console.warn(
              `[advice] Modelo quota exceeded detected (status=${statusCode}). Generando fallback local inmediato.`
            );
            const fb = await generateFallbackContent();
            // Return an object compatible with generateText result (.text)
            return {
              text: fb.content,
              usedModel: fb.usedModel,
              genMs: fb.genMs,
              quota: true,
            };
          }
          // Failover: intentar modelos alternativos si el proveedor está sobrecargado
          if (isOverloaded && ALT_MODELS.length) {
            console.warn(
              `[advice] Modelo principal sobrecargado (status=${statusCode}). Intentando modelos alternativos: ${ALT_MODELS.join(
                ", "
              )}`
            );
            for (const alt of ALT_MODELS) {
              try {
                const altModel = process.env.GOOGLE_GENERATIVE_AI_API_KEY
                  ? google(alt, {
                      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
                    })
                  : google(alt);
                const resAlt = await callWithRetries(
                  altModel,
                  /* usar prompt completo */ fullPrompt,
                  { maxAttempts: 1, baseDelay: 500, maxTokens: MAX_TOKENS }
                );
                console.log(`[advice] alt-model OK -> ${alt}`);
                return resAlt;
              } catch (eAlt) {
                console.warn(
                  `[advice] alt-model fail ${alt}: ${eAlt?.message || eAlt}`
                );
                continue;
              }
            }
          }
        } catch (e2) {
          console.error("[advice] Error al procesar quota fallback:", e2);
        }
        console.error(
          `[advice] Error con modelo ${modelName}:`,
          error?.message || error
        );
        console.error(`[advice] Error completo:`, error);
        throw error;
      }
    }

    // Preparar prompt final para esta solicitud
    const MAIN_PROMPT = `Eres un experto en nutrición y entrenamiento, preciso y claro.\n\n${effectivePrompt}`;

    async function withTimeout(promise, ms) {
      let to;
      const timeout = new Promise((_, rej) => {
        to = setTimeout(() => rej(new Error("timeout")), ms);
      });
      return Promise.race([promise, timeout]).finally(() => clearTimeout(to));
    }

    let content = null;
    let usedModel = GEMINI_MODEL_LONG; // será reemplazado por flash si estrategia flash-first
    // Aplicar overrides de modelo efectivos
    usedModel = EFFECTIVE_MODEL_LONG;
    let genMs = null; // tiempo de generación (se setea al final si no hubo fallback previo)
    let mainPhase = "init";
    const t0 = Date.now();
    try {
      if (forceLong && !FAST_MODE) {
        const resLongFirst = await withTimeout(
          runModel(GEMINI_MODEL_LONG, MAIN_PROMPT),
          ADVICE_LONG_TIMEOUT_MS
        );
        content = resLongFirst.text;
        usedModel = GEMINI_MODEL_LONG;
      } else {
        // Flash-first
        try {
          mainPhase = "flash-primary";
          const resFlash = await withTimeout(
            runModel(EFFECTIVE_MODEL_FALLBACK, MAIN_PROMPT),
            ADVICE_FLASH_TIMEOUT_MS
          );
          content = resFlash.text;
          usedModel = EFFECTIVE_MODEL_FALLBACK;
          console.log(
            "[advice][main] flash-primary chars=",
            content?.length || 0
          );
        } catch (eFlash) {
          if (!USE_FAST) {
            // Intentar long
            try {
              mainPhase = "long-after-flash-fail";
              const resLong = await withTimeout(
                runModel(EFFECTIVE_MODEL_LONG, MAIN_PROMPT),
                ADVICE_LONG_TIMEOUT_MS
              );
              content = resLong.text;
              usedModel = EFFECTIVE_MODEL_LONG;
              console.log(
                "[advice][main] long-after-flash-fail chars=",
                content?.length || 0
              );
            } catch (eLong) {
              // Prompt reducido
              const shortPrompt =
                MAIN_PROMPT +
                "\n\n(Genera solo los bloques JSON pedidos y muy conciso.)";
              try {
                mainPhase = "short-after-long-fail";
                const resShort = await withTimeout(
                  runModel(EFFECTIVE_MODEL_FALLBACK, shortPrompt),
                  ADVICE_FALLBACK_TIMEOUT_MS
                );
                content = resShort.text;
                usedModel = EFFECTIVE_MODEL_FALLBACK + "-short";
                console.log(
                  "[advice][main] short-after-long-fail chars=",
                  content?.length || 0
                );
              } catch (eShort) {
                // Si en este punto content sigue vacío realmente (todas las ramas IA fallaron) sólo entonces consideramos fallback
                if (!content) {
                  mainPhase = "local-fallback-delay-check";
                  if (!canUseLocalFallback(t0)) {
                    await waitMinWindow(t0);
                  }
                  mainPhase = "local-fallback";
                  const fb = await generateFallbackContent();
                  content = fb.content;
                  usedModel = fb.usedModel;
                  genMs = fb.genMs;
                } else {
                  console.log(
                    "[advice][main] Skip fallback because content already present before fallback path"
                  );
                }
              }
            }
          } else {
            // Fast mode, solo short y fallback local
            const shortPrompt =
              MAIN_PROMPT +
              "\n\n(Genera solo los bloques JSON pedidos y muy conciso.)";
            try {
              mainPhase = "short-fast";
              const resShortFast = await withTimeout(
                runModel(EFFECTIVE_MODEL_FALLBACK, shortPrompt),
                ADVICE_FALLBACK_TIMEOUT_MS
              );
              content = resShortFast.text;
              usedModel = EFFECTIVE_MODEL_FALLBACK + "-short";
              console.log(
                "[advice][main] short-fast chars=",
                content?.length || 0
              );
            } catch (eShortFast) {
              if (!content) {
                mainPhase = "local-fallback-fast-delay-check";
                if (!canUseLocalFallback(t0)) {
                  await waitMinWindow(t0);
                }
                mainPhase = "local-fallback-fast";
                const fbFast = await generateFallbackContent();
                content = fbFast.content;
                usedModel = fbFast.usedModel;
                genMs = fbFast.genMs;
              } else {
                console.log(
                  "[advice][main] Skip fast fallback because content already present"
                );
              }
            }
          }
        }
      }
    } catch (e) {
      // Timeout o error -> intentar fallback más rápido con prompt reducido
      try {
        mainPhase = "catch-short-attempt";
        const shortPrompt =
          MAIN_PROMPT +
          "\n\n(Genera solo los bloques JSON pedidos y un breve análisis; sé conciso.)";
        const res2 = await withTimeout(
          runModel(GEMINI_MODEL_FALLBACK, shortPrompt),
          ADVICE_FALLBACK_TIMEOUT_MS
        );
        content = res2.text;
        usedModel = GEMINI_MODEL_FALLBACK;
        console.log(
          "[advice][main] catch-short-attempt chars=",
          content?.length || 0
        );
      } catch (e2) {
        if (!content) {
          mainPhase = "catch-local-fallback-delay-check";
          if (!canUseLocalFallback(t0)) {
            await waitMinWindow(t0);
          }
          mainPhase = "catch-local-fallback";
          const fallbackResult = await generateFallbackContent();
          content = fallbackResult.content;
          usedModel = fallbackResult.usedModel;
          genMs = fallbackResult.genMs;
        } else {
          console.log(
            "[advice][main] catch block but had content, skip fallback"
          );
        }
      }
    }
    genMs = genMs ?? Date.now() - t0;

    // Intentar extraer JSON_SUMMARY, JSON_MEALS y JSON_HYDRATION del contenido de manera robusta
    let summary = null;
    let meals = null;
    let hydration = null;
    let beveragesPlan = null;
    let mealsVariants = null;
    let weeklyPlanFromJson = null;

    function extractJsonBlock(label, text) {
      if (!text) return null;
      // 1) Buscar bloque etiquetado: JSON_LABEL: { ... }
      const labelIdx = text.indexOf(label + ":");
      if (labelIdx >= 0) {
        const after = text.slice(labelIdx + label.length + 1);
        // saltar espacios y posibles fences
        const startFence = after.match(/\s*```json\s*/i);
        let rest = after;
        if (startFence) rest = after.slice(startFence[0].length);
        // encontrar primer '{' y escanear llaves balanceadas
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
                } catch {}
                break;
              }
            }
          }
        }
      }
      // 2) Buscar code fence independiente con estructura plausible
      const fenceMatches = text.match(/```json\s*([\s\S]*?)```/gi) || [];
      for (const m of fenceMatches) {
        const inner = m.replace(/```json/i, "").replace(/```$/, "");
        try {
          const obj = JSON.parse(inner.trim());
          return obj;
        } catch {}
      }
      // 3) Regex simple como último intento (ojo: es agresivo)
      const simple = text.match(/\{[\s\S]*\}/);
      if (simple) {
        try {
          return JSON.parse(simple[0]);
        } catch {}
      }
      return null;
    }

    try {
      const sObj = extractJsonBlock("JSON_SUMMARY", content);
      if (sObj && typeof sObj === "object") summary = sObj;
      const mObj = extractJsonBlock("JSON_MEALS", content);
      if (Array.isArray(mObj)) {
        meals = { items: mObj };
      } else if (mObj && typeof mObj === "object") {
        if (Array.isArray(mObj.items)) {
          meals = { ...mObj, items: mObj.items };
        } else {
          const converted = convertWeeklyPlanObject(mObj);
          if (converted) {
            meals = { items: converted.items };
            weeklyPlanFromJson = converted.weekly;
          } else {
            meals = mObj;
          }
        }
        if (!weeklyPlanFromJson && Array.isArray(mObj.weekly)) {
          weeklyPlanFromJson = sanitizeWeeklyPlanArray(mObj.weekly);
        }
      }
      const hObj = extractJsonBlock("JSON_HYDRATION", content);
      if (hObj && typeof hObj === "object") hydration = hObj;
      const bObj = extractJsonBlock("JSON_BEVERAGES", content);
      if (bObj && typeof bObj === "object") beveragesPlan = bObj;
      const vObj = extractJsonBlock("JSON_MEALS_VARIANTS", content);
      if (
        vObj &&
        typeof vObj === "object" &&
        vObj.variants &&
        typeof vObj.variants === "object"
      ) {
        mealsVariants = vObj.variants;
      }
    } catch {}

    // Forzar el objetivo diario de proteína si el usuario lo definió/sugirió
    if (
      summary &&
      preferredProteinDaily &&
      typeof preferredProteinDaily === "number"
    ) {
      try {
        summary.proteinas_g = preferredProteinDaily;
      } catch {}
    }

    // Si no se pudo extraer summary o viene vacío, construir uno local
    if (
      !summary ||
      typeof summary !== "object" ||
      Object.keys(summary).length === 0
    ) {
      const localSummary = buildLocalSummary();
      if (localSummary) summary = localSummary;
    }

    sanitizeSummaryTargets(summary);

    if (
      weeklyPlanFromJson &&
      summary &&
      Number.isFinite(Number(summary.proteinas_g))
    ) {
      weeklyPlanFromJson = applyProteinTargets(
        weeklyPlanFromJson,
        Number(summary.proteinas_g)
      );
    }

    // Helper: normaliza un string al tipo estándar o null
    function normalizeTipoComida(raw) {
      if (!raw) return null;
      const s = String(raw).toLowerCase();
      if (/desayuno|breakfast|mañana|morning/.test(s)) return "Desayuno";
      if (/almuerzo|comida|lunch|mediod[ií]a|medio dia/.test(s))
        return "Almuerzo";
      if (/cena|dinner|noche|night/.test(s)) return "Cena";
      if (/snack|merienda|colaci[oó]n|tentempi[eé]|snacks?/.test(s))
        return "Snack";
      return null;
    }

    const DAY_NAME_LOOKUP = {
      lunes: "Lunes",
      monday: "Lunes",
      martes: "Martes",
      tuesday: "Martes",
      miercoles: "Miércoles",
      wednesday: "Miércoles",
      jueves: "Jueves",
      thursday: "Jueves",
      viernes: "Viernes",
      friday: "Viernes",
      sabado: "Sábado",
      saturday: "Sábado",
      domingo: "Domingo",
      sunday: "Domingo",
    };

    function normalizeDayKey(raw) {
      if (!raw) return null;
      const base = String(raw)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
      return DAY_NAME_LOOKUP[base] || null;
    }

    function normalizeMealTextList(raw) {
      if (raw == null) return [];
      if (typeof raw === "string") {
        const trimmed = raw.trim();
        return trimmed ? [trimmed] : [];
      }
      if (Array.isArray(raw)) {
        return raw
          .map((item) => {
            if (typeof item === "string") return item.trim();
            if (item && typeof item === "object") {
              if (typeof item.descripcion === "string")
                return item.descripcion.trim();
              if (typeof item.description === "string")
                return item.description.trim();
              if (typeof item.nombre === "string") return item.nombre.trim();
            }
            if (typeof item === "number") return String(item);
            return "";
          })
          .filter(Boolean);
      }
      if (typeof raw === "object") {
        const pieces = [];
        if (typeof raw.descripcion === "string")
          pieces.push(raw.descripcion.trim());
        if (typeof raw.description === "string")
          pieces.push(raw.description.trim());
        if (Array.isArray(raw.itemsText))
          pieces.push(
            ...raw.itemsText.map((t) => (typeof t === "string" ? t.trim() : ""))
          );
        if (Array.isArray(raw.items)) {
          pieces.push(
            ...raw.items.map((it) => {
              if (typeof it === "string") return it.trim();
              if (
                it &&
                typeof it === "object" &&
                typeof it.nombre === "string"
              ) {
                const qty = it.cantidad || it.qty || it.medida || "";
                return qty ? `${it.nombre} (${qty})` : it.nombre;
              }
              return "";
            })
          );
        }
        if (typeof raw.nombre === "string") pieces.push(raw.nombre.trim());
        if (!pieces.length && typeof raw === "object") {
          const fallback = JSON.stringify(raw);
          if (fallback && fallback.length <= 120) pieces.push(fallback);
        }
        return pieces.filter(Boolean);
      }
      return [];
    }

    function deriveMealTitle(tipo, sampleText, dayLabel) {
      const fallback = dayLabel ? `${tipo} ${dayLabel}` : tipo;
      if (!sampleText) return fallback;
      const cleaned = sampleText
        .replace(/\([^)]*\)/g, "")
        .replace(/[*•]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      if (!cleaned) return fallback;
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    function extractIngredientsFromTexts(textList) {
      const results = [];
      const seen = new Set();
      for (const text of textList || []) {
        const trimmed = (text || "").trim();
        if (!trimmed) continue;
        const regex = /([^,;()]+?)\s*\((\d+(?:[.,]\d+)?)\s*(g|gr|gramos)\)/gi;
        let match;
        while ((match = regex.exec(trimmed)) !== null) {
          const nombre = match[1].replace(/^(?:y|con)\s+/i, "").trim();
          const gramos = Number(match[2].replace(",", "."));
          if (!nombre || !Number.isFinite(gramos)) continue;
          const key = `${nombre.toLowerCase()}-${gramos}`;
          if (seen.has(key)) continue;
          seen.add(key);
          results.push({ nombre, gramos });
        }
      }
      return results;
    }

    function buildMealObject(label, rawValue, dayName) {
      const tipo = normalizeTipoComida(label || (rawValue && rawValue.tipo));
      if (!tipo) return null;
      const textList = normalizeMealTextList(rawValue);
      let fallbackName = null;
      if (rawValue && typeof rawValue === "object") {
        if (typeof rawValue.nombre === "string") fallbackName = rawValue.nombre;
        else if (typeof rawValue.titulo === "string")
          fallbackName = rawValue.titulo;
        else if (typeof rawValue.title === "string")
          fallbackName = rawValue.title;
      }
      const nombre = deriveMealTitle(
        tipo,
        textList[0] || fallbackName,
        dayName
      );
      let ingredientes = [];
      if (
        rawValue &&
        typeof rawValue === "object" &&
        Array.isArray(rawValue.ingredientes)
      ) {
        ingredientes = rawValue.ingredientes
          .map((ing) => {
            const nombreIng = (ing?.nombre || ing?.name || "")
              .toString()
              .trim();
            if (!nombreIng) return null;
            const gramos = Number(ing?.gramos ?? ing?.grams ?? ing?.g);
            return gramos > 0
              ? { nombre: nombreIng, gramos }
              : { nombre: nombreIng };
          })
          .filter(Boolean);
      } else {
        ingredientes = extractIngredientsFromTexts(textList);
      }
      return {
        tipo,
        nombre,
        itemsText: textList,
        ingredientes: ingredientes.length ? ingredientes : undefined,
      };
    }

    function convertWeeklyPlanObject(obj) {
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
      const flattened = [];
      const weekly = [];
      for (const [rawDay, dayValue] of Object.entries(obj)) {
        const dayName = normalizeDayKey(rawDay);
        if (!dayName || !dayValue) continue;
        const dayMeals = [];
        const pushMeal = (label, source) => {
          const meal = buildMealObject(label, source, dayName);
          if (!meal) return;
          flattened.push({
            tipo: meal.tipo,
            nombre: meal.nombre,
            itemsText: meal.itemsText,
            dia: dayName,
            ...(meal.ingredientes ? { ingredientes: meal.ingredientes } : {}),
          });
          dayMeals.push({
            tipo: meal.tipo,
            receta: { nombre: meal.nombre },
            itemsText: meal.itemsText,
            ...(meal.ingredientes ? { ingredientes: meal.ingredientes } : {}),
          });
        };
        if (Array.isArray(dayValue)) {
          for (const entry of dayValue) {
            const label =
              entry?.tipo ||
              entry?.type ||
              entry?.meal ||
              entry?.titulo ||
              entry?.title ||
              entry?.nombre;
            pushMeal(label || "Comida", entry);
          }
        } else if (typeof dayValue === "object") {
          for (const [slot, slotValue] of Object.entries(dayValue)) {
            pushMeal(slot, slotValue);
          }
        }
        if (dayMeals.length) {
          weekly.push({ day: dayName, active: true, meals: dayMeals });
        }
      }
      if (!weekly.length) return null;
      return { items: flattened, weekly };
    }

    function sanitizeWeeklyPlanArray(raw) {
      if (!Array.isArray(raw)) return null;
      const normalized = raw
        .map((entry) => {
          if (!entry) return null;
          const dayName =
            typeof entry.day === "string"
              ? entry.day
              : normalizeDayKey(entry.dia);
          if (!dayName) return null;
          const mealsRaw = Array.isArray(entry.meals) ? entry.meals : [];
          const alreadyStructured =
            mealsRaw.length &&
            mealsRaw.every(
              (m) =>
                m &&
                typeof m.tipo === "string" &&
                m.receta &&
                typeof m.receta.nombre === "string"
            );
          const meals = alreadyStructured
            ? mealsRaw
            : mealsRaw
                .map((meal, idx) => {
                  const label =
                    meal?.tipo ||
                    meal?.type ||
                    meal?.meal ||
                    `Comida ${idx + 1}`;
                  const normalizedMeal = buildMealObject(label, meal, dayName);
                  if (!normalizedMeal) return null;
                  const base = {
                    tipo: normalizedMeal.tipo,
                    receta: { nombre: normalizedMeal.nombre },
                    itemsText: normalizedMeal.itemsText,
                  };
                  if (normalizedMeal.ingredientes)
                    base.ingredientes = normalizedMeal.ingredientes;
                  if (meal?.targetProteinG != null)
                    base.targetProteinG = meal.targetProteinG;
                  return base;
                })
                .filter(Boolean);
          return { day: dayName, active: entry.active !== false, meals };
        })
        .filter(Boolean);
      return normalized.length ? normalized : null;
    }

    function applyProteinTargets(weeklyArr, proteinTarget) {
      if (
        !Array.isArray(weeklyArr) ||
        !Number.isFinite(proteinTarget) ||
        proteinTarget <= 0
      ) {
        return weeklyArr;
      }
      return weeklyArr.map((day) => {
        if (!day || !Array.isArray(day.meals) || !day.meals.length) return day;
        const perMeal = Math.max(
          6,
          Math.round(proteinTarget / day.meals.length)
        );
        const meals = day.meals.map((meal) => {
          if (!meal || meal.targetProteinG != null) return meal;
          return { ...meal, targetProteinG: perMeal };
        });
        return { ...day, meals };
      });
    }

    // Helper: generar items básicos por tipo a partir de alimentos guardados
    async function generateBasicItemsByTypes(userId, types) {
      const saved = await prisma.usuarioAlimento.findMany({
        where: { usuarioId: userId },
        include: { alimento: true },
      });
      const list = saved.map((x) => x.alimento).filter(Boolean);
      const by = (pred) =>
        list.find((a) =>
          pred(
            (a.categoria || "").toLowerCase(),
            (a.nombre || "").toLowerCase()
          )
        );
      const pickProt = () =>
        by(
          (c, n) =>
            c.includes("prote") ||
            /huevo|pollo|carne|pavo|atun|queso|yogur|lomo/.test(n)
        );
      const pickCarb = () =>
        by(
          (c, n) =>
            c.includes("carbo") ||
            /arroz|papa|patata|pan|pasta|avena|quinoa|cereal/.test(n)
        );
      const pickFat = () =>
        by(
          (c, n) =>
            c.includes("grasa") ||
            /aceite|nuez|mani|maní|almendra|aguacate|avellana|semilla|mantequilla/.test(
              n
            )
        );
      const pickFiber = () =>
        by(
          (c, n) =>
            c.includes("fibra") ||
            /brocoli|brócoli|lechuga|espinaca|zanahoria|berenjena|tomate|verdura|ensalada/.test(
              n
            )
        );
      const pickFruit = () =>
        by((c, n) =>
          /banana|platan|plátano|fresa|frutilla|manzana|pera|uva|naranja|fruta/.test(
            n
          )
        );
      const mk = (tipo, nombre, arr) => ({
        tipo,
        nombre,
        porciones: 1,
        ingredientes: arr.filter((x) => x.gramos > 0),
      });
      const p1 = pickProt();
      const c1 = pickCarb();
      const f1 = pickFat();
      const v1 = pickFiber();
      const fr = pickFruit();
      const makeFor = (t) => {
        if (t === "Desayuno")
          return mk(
            "Desayuno",
            "Desayuno básico",
            [
              p1 && { nombre: p1.nombre, gramos: 120 },
              fr && { nombre: fr.nombre, gramos: 100 },
              f1 && { nombre: f1.nombre, gramos: 10 },
            ].filter(Boolean)
          );
        if (t === "Almuerzo")
          return mk(
            "Almuerzo",
            "Almuerzo básico",
            [
              p1 && { nombre: p1.nombre, gramos: 120 },
              c1 && { nombre: c1.nombre, gramos: 120 },
              v1 && { nombre: v1.nombre, gramos: 100 },
              f1 && { nombre: f1.nombre, gramos: 10 },
            ].filter(Boolean)
          );
        if (t === "Cena")
          return mk(
            "Cena",
            "Cena básica",
            [
              p1 && { nombre: p1.nombre, gramos: 100 },
              c1 && { nombre: c1.nombre, gramos: 100 },
              v1 && { nombre: v1.nombre, gramos: 120 },
              f1 && { nombre: f1.nombre, gramos: 10 },
            ].filter(Boolean)
          );
        return mk(
          "Snack",
          "Snack básico",
          [
            fr && { nombre: fr.nombre, gramos: 120 },
            f1 && { nombre: f1.nombre, gramos: 15 },
          ].filter(Boolean)
        );
      };
      return types.map((t) => makeFor(t)).filter((m) => m.ingredientes.length);
    }

    // Fallback inicial si IA no trajo comidas
    if (!meals || !Array.isArray(meals.items) || meals.items.length === 0) {
      const baseTypes = wantTypesOrder.length
        ? wantTypesOrder
        : ["Desayuno", "Almuerzo", "Cena", "Snack"];
      const items = await generateBasicItemsByTypes(userId, baseTypes);
      meals = { items };
    }

    // Enforce: si hay enabledMeals definidos, ajustar a EXACTAMENTE esos tipos/cantidad
    if (wantTypesOrder.length && meals && Array.isArray(meals.items)) {
      // bucket por tipo normalizado
      const buckets = { Desayuno: [], Almuerzo: [], Cena: [], Snack: [] };
      for (const it of meals.items) {
        const t = normalizeTipoComida(it?.tipo);
        if (t && buckets[t]) buckets[t].push(it);
      }
      const resultItems = [];
      for (const t of wantTypesOrder) {
        if (buckets[t] && buckets[t].length) {
          resultItems.push(buckets[t].shift());
        } else {
          // generar básico para el tipo faltante
          const gen = await generateBasicItemsByTypes(userId, [t]);
          if (gen.length) resultItems.push(gen[0]);
        }
      }
      meals = { items: resultItems };
    }

    if (!hydration || !(hydration.litros > 0)) {
      const litros = summary?.kcal_objetivo
        ? Math.max(
            1.5,
            Math.min(4, Math.round((summary.kcal_objetivo / 1000) * 10) / 10)
          )
        : 2.0;
      hydration = { litros };
    }

    // Fallback / generación de plan de bebidas (solo infusiones / bebidas, NUNCA agua) si IA no lo provee o es inválido
    try {
      if (
        !beveragesPlan ||
        !Array.isArray(beveragesPlan.items) ||
        beveragesPlan.items.length === 0
      ) {
        const bevPrefsRaw = Array.isArray(prefs?.beverages)
          ? prefs.beverages
          : [];
        // Excluir agua explícita y duplicados
        const bevPrefs = [
          ...new Set(
            bevPrefsRaw
              .map((v) => (v || "").toString().trim())
              .filter((v) => v && !/^agua(\b|\s|$)/i.test(v))
          ),
        ].slice(0, 8);
        if (bevPrefs.length) {
          // Generar porciones simbólicas (no intentamos cubrir hidratación total). 100–250 ml c/ bebida.
          let items = bevPrefs.map((v) => ({
            nombre: v,
            ml: Math.min(250, Math.max(80, 150)),
            momento: "General",
          }));
          // Limitar a máximo 2 bebidas
          if (items.length > 2) items = items.slice(0, 2);
          beveragesPlan = { items };
        } else {
          beveragesPlan = null; // sin bebidas si solo habría agua
        }
      } else {
        // Sanitizar: asegurar números y nombre
        beveragesPlan.items = beveragesPlan.items
          .map((x) => ({
            nombre: (x?.nombre || "").toString().trim() || "Bebida",
            ml: Math.max(50, Math.min(250, Math.round(Number(x?.ml) || 0))),
            momento: /desayuno|almuerzo|cena|snack/i.test(x?.momento || "")
              ? x.momento
              : "General",
          }))
          // Excluir agua del plan de bebidas
          .filter((x) => x.ml && x.nombre && !/^agua(\b|\s|$)/i.test(x.nombre));
        if (!beveragesPlan.items.length) {
          beveragesPlan = null;
        } else {
          // Limitar a máximo 2, priorizando momentos distintos
          const pickTwo = (arr) => {
            const out = [];
            const moments = new Set();
            for (const it of arr) {
              if (!moments.has((it.momento || "").toLowerCase())) {
                out.push(it);
                moments.add((it.momento || "").toLowerCase());
              }
              if (out.length === 2) break;
            }
            if (out.length < 2) {
              for (const it of arr) {
                if (out.length === 2) break;
                if (!out.includes(it)) out.push(it);
              }
            }
            return out;
          };
          beveragesPlan.items = pickTwo(beveragesPlan.items);
        }
      }
    } catch {}

    // Adjuntar variantes si existen
    if (meals && mealsVariants) {
      try {
        meals.variants = mealsVariants;
      } catch {}
    }

    // Persistir en cache si generación fue exitosa (no fallback minimal) y hay hash
    try {
      if (currentHash && meals && summary && content) {
        const isLocalFallback = (usedModel || "").startsWith("fallback-local");
        if (!isLocalFallback) {
          const cacheObj = {
            advice: content,
            summary,
            meals,
            hydration,
            beverages: beveragesPlan,
            weekly: weeklyPlanFromJson,
            hash: currentHash,
            model: usedModel,
            generated_ms: genMs,
            ts: new Date().toISOString(),
          };
          await prisma.usuario.update({
            where: { id: userId },
            data: { plan_ai: cacheObj },
          });
        }
      }
    } catch {}

    const isFallback = (usedModel || "").startsWith("fallback");
    const baseResponse = {
      advice: content,
      summary,
      meals,
      hydration,
      beverages: beveragesPlan,
      weekly: weeklyPlanFromJson,
      model: usedModel,
      took_ms: genMs,
      fallback: isFallback,
    };
    if (debugMode) {
      baseResponse.debug = {
        mainPhase,
        content_chars: content ? content.length : 0,
        wantTypesOrder,
        forceLong,
        FAST_MODE,
        USE_FAST,
        models: {
          primary_long: EFFECTIVE_MODEL_LONG,
          primary_fast: EFFECTIVE_MODEL_FALLBACK,
          alts: ALT_MODELS,
        },
      };
      if (debugPromptOnly) {
        baseResponse.debug.prompt = MAIN_PROMPT; // incluir el prompt completo si se pide
      }
    } else if (debugPromptOnly) {
      baseResponse.debug = { prompt: MAIN_PROMPT, USE_FAST };
    }
    if (showPrompt && !baseResponse.debug) {
      baseResponse.debug = { prompt: MAIN_PROMPT };
    } else if (showPrompt && baseResponse.debug && !baseResponse.debug.prompt) {
      baseResponse.debug.prompt = MAIN_PROMPT;
    }
    console.log(
      "[advice][response] mainPhase=",
      mainPhase,
      "model=",
      usedModel,
      "chars=",
      content ? content.length : 0,
      "fallback=",
      isFallback
    );
    return NextResponse.json(baseResponse, { status: 200 });
  } catch (e) {
    console.error("/api/account/advice error", e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
