import type { Metadata } from "next";
import { Hero } from "./sections/Hero";
import { Metrics } from "./sections/Metrics";
import { Highlights } from "./sections/Highlights";
import { AppPreview } from "./sections/AppPreview";
import { HowItWorks } from "./sections/HowItWorks";
import { CoachTeaser } from "./sections/CoachTeaser";
import { CTASection } from "./sections/CTASection";

export const metadata: Metadata = {
  title: "FitBalance | Plataforma nutricional con IA",
  description:
    "FitBalance une IA y nutrición clínica para crear planes personalizados, seguimiento de hidratación y herramientas para profesionales de la salud.",
};

export default function VisitorLandingPage() {
  return (
    <main className="bg-gradient-to-b from-white via-white to-emerald-50 text-slate-900">
      <Hero />
      <Metrics />
      <Highlights />
      <AppPreview />
      <HowItWorks />
      <CoachTeaser />
      <CTASection />
    </main>
  );
}
