"use client";

import { useRouter } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import OnboardingHeader from "@/components/onboarding/OnboardingHeader";
import OnboardingActions from "@/components/onboarding/OnboardingActions";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";

type Objetivo = "Bajar_grasa" | "Ganar_musculo" | "Mantenimiento" | null;

type Bounds = {
  min: number;
  max: number;
  suggested: number;
  healthy?: { min: number; max: number } | null;
  reason: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function round1(num: number) {
  return Math.round(num * 10) / 10;
}

function deriveBounds(peso: number | null, alturaCm: number | null, objetivo: Objetivo): Bounds {
  const safeMin = 40;
  const safeMax = 200;
  const basePeso = peso ?? 70;
  const healthy = alturaCm && alturaCm >= 120
    ? {
        min: clamp(Math.pow(alturaCm / 100, 2) * 20.5, safeMin, safeMax),
        max: clamp(Math.pow(alturaCm / 100, 2) * 26, safeMin, safeMax),
      }
    : null;

  let min = safeMin;
  let max = safeMax;
  let suggested = basePeso;
  let reason = "Ajusta libremente mientras completamos tus métricas.";

  if (peso != null && objetivo === "Bajar_grasa") {
    min = healthy ? healthy.min : clamp(peso * 0.7, safeMin, peso - 5);
    max = healthy ? Math.min(healthy.max, peso - 1) : clamp(peso - 2, min + 1, safeMax);
    if (min >= max) max = clamp(min + 1, safeMin, safeMax);
    suggested = clamp((min + max) / 2, min, max);
    reason = healthy
      ? `Según tu altura (${alturaCm} cm) apuntamos a un rango saludable (IMC 20.5-26).`
      : "Limitamos hasta 30-35% menos que tu peso actual para bajar grasa de forma segura.";
  } else if (peso != null && objetivo === "Ganar_musculo") {
    const baseMin = peso + 1;
    min = healthy ? Math.max(healthy.max - 1, baseMin) : clamp(baseMin, safeMin, safeMax - 1);
    max = healthy ? clamp(healthy.max + 6, min + 1, safeMax) : clamp(peso * 1.15, min + 1, safeMax);
    suggested = clamp((min + max) / 2, min, max);
    reason = "Permitimos un incremento gradual (≈10-15% sobre tu peso actual) para ganar músculo.";
  } else if (peso != null && objetivo === "Mantenimiento") {
    min = clamp(peso - 2, safeMin, safeMax);
    max = clamp(peso + 2, safeMin, safeMax);
    suggested = clamp(peso, min, max);
    reason = "Para mantenimiento mantenemos ±2 kg alrededor de tu peso actual.";
  } else if (peso != null) {
    min = clamp(peso * 0.8, safeMin, safeMax);
    max = clamp(peso * 1.05, min + 1, safeMax);
    suggested = clamp(peso, min, max);
    reason = "Usamos tu peso actual como referencia inicial.";
  }

  return {
    min: round1(min),
    max: round1(max),
    suggested: round1(suggested),
    healthy,
    reason,
  };
}

export default function OnboardingTargetWeightPage() {
  const router = useRouter();
  const [target, setTarget] = useState<number>(70);
  const [pesoActual, setPesoActual] = useState<number | null>(null);
  const [alturaCm, setAlturaCm] = useState<number | null>(null);
  const [objetivo, setObjetivo] = useState<Objetivo>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/account/profile");
        if (res.status === 401) {
          router.replace("/auth/login");
          return;
        }
        if (!res.ok) return; // handled later
        const { user } = await res.json();
        const peso = user?.peso_kg ?? null;
        const altura = user?.altura_cm ?? null;
        const obj = (user?.objetivo as Objetivo) ?? null;
        setPesoActual(peso);
        setAlturaCm(altura);
        setObjetivo(obj);
        const computedBounds = deriveBounds(peso, altura, obj);
        setBounds(computedBounds);
        const saved = user?.peso_objetivo_kg ?? computedBounds.suggested ?? peso ?? 70;
        setTarget(clamp(saved, computedBounds.min, computedBounds.max));
      } catch {}
    })();
  }, []);

  const sliderBounds = useMemo(() => {
    if (!bounds) return { min: 40, max: 200 };
    return { min: Math.floor(bounds.min), max: Math.ceil(bounds.max) };
  }, [bounds]);

  async function onNext(e?: React.MouseEvent<HTMLButtonElement>) {
    if (e) e.preventDefault();
    if (bounds) {
      if (target < bounds.min || target > bounds.max) {
        toast.error(`El peso objetivo debe estar entre ${bounds.min.toFixed(1)} kg y ${bounds.max.toFixed(1)} kg para el objetivo seleccionado.`);
        return;
      }
    }
    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peso_objetivo_kg: target, onboarding_step: "target-weight" }),
      });
      if (res.status === 401) {
        toast.error("Sesión expirada. Inicia sesión nuevamente.");
        router.replace("/auth/login");
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (j?.error) toast.error(j.error); else throw new Error();
        return;
      }
      router.push("/onboarding/speed");
    } catch {
      toast.error("No se pudo guardar");
    }
  }

  const targetLabel = useMemo(() => `${target.toFixed(1)} kg`, [target]);
  const recommendedLabel = useMemo(() => {
    if (!bounds) return null;
    return `${bounds.min.toFixed(1)} – ${bounds.max.toFixed(1)} kg`;
  }, [bounds]);

  return (
    <OnboardingLayout>
      <OnboardingHeader title="Peso meta" />
      {/* Contexto rápido de la fase sin repetir la palabra "objetivo" varias veces.
          Mapping valores -> etiquetas legibles:
          Bajar_grasa -> Bajar peso
          Ganar_musculo -> Subir masa muscular
          Mantenimiento -> Mantenimiento */}
      {objetivo && (() => {
        const fase = objetivo === "Bajar_grasa" ? "Bajar peso" : objetivo === "Ganar_musculo" ? "Subir masa muscular" : "Mantenimiento";
        return (
          <div className="mb-4 flex justify-center">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              Fase: {fase}
            </span>
          </div>
        );
      })()}
      <OnboardingCard>
        {pesoActual != null && (
          <div className="text-center text-lg font-medium mb-4">Tu peso actual: {pesoActual} kg</div>
        )}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span>{sliderBounds.min}</span>
            <span className="font-medium">{targetLabel}</span>
            <span>{sliderBounds.max}</span>
          </div>
          <Slider
            min={sliderBounds.min}
            max={sliderBounds.max}
            step={0.5}
            value={[target]}
            onValueChange={(v) => setTarget(clamp(v[0], bounds?.min ?? sliderBounds.min, bounds?.max ?? sliderBounds.max))}
          />
        </div>
        {bounds && (
          <div className="mt-3 text-xs text-muted-foreground">
            <div>
              Rango recomendado: <span className="font-medium">{recommendedLabel}</span>
              {alturaCm ? ` (altura ${alturaCm} cm)` : ""}
            </div>
            <div className="mt-1">{bounds.reason}</div>
          </div>
        )}
      </OnboardingCard>
      <OnboardingActions back={{ onClick: () => router.push("/onboarding/objective") }} next={{ onClick: onNext }} />
    </OnboardingLayout>
  );
}
