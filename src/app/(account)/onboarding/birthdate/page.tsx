"use client";

import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { es } from "date-fns/locale"; // Importa la localización en español
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import OnboardingHeader from "@/components/onboarding/OnboardingHeader";
import OnboardingActions from "@/components/onboarding/OnboardingActions";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import BirthdateWheelPicker from "@/components/onboarding/BirthdateWheelPicker";

export default function OnboardingBirthdatePage() {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>();
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const MIN_YEAR = 1950;
  const defaultMonth = useMemo(() => date ?? new Date(2000, 0, 1), [date]);

  async function onNext(e?: React.MouseEvent<HTMLButtonElement>) {
    if (e) e.preventDefault();
    if (!date) {
      toast.error("Selecciona tu fecha de nacimiento");
      return;
    }
    // Validaciones cliente: no futuro y >= 16 años
    const now = new Date();
    if (date > now) {
      toast.error("La fecha no puede ser futura");
      return;
    }
    const age = Math.floor(
      (now.getTime() - date.getTime()) / (365.25 * 24 * 3600 * 1000)
    );
    if (age < 16) {
      toast.error("Debes tener al menos 16 años");
      return;
    }
    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha_nacimiento: date.toISOString(),
          onboarding_step: "birthdate",
        }),
      });
      if (!res.ok) throw new Error();
      router.push("/onboarding/activity");
    } catch {
      toast.error("No se pudo guardar");
    }
  }

  return (
    <OnboardingLayout>
      <OnboardingHeader
        title="Fecha de nacimiento"
        subtitle="Tu edad nos ayuda a personalizar tu plan y recomendaciones. Selecciona tu fecha de nacimiento."
      />
      <OnboardingCard>
        <div className="w-full flex justify-center">
          <div className="w-full max-w-md">
            <BirthdateWheelPicker
              value={date}
              onChange={(next) => setDate(next)}
              minYear={MIN_YEAR}
            />
          </div>
        </div>
      </OnboardingCard>
      <OnboardingActions
        back={{ onClick: () => router.push("/onboarding/metrics") }}
        next={{ onClick: onNext }}
      />
    </OnboardingLayout>
  );
}
