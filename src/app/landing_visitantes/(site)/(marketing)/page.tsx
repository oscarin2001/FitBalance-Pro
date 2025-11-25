import type { Metadata } from "next";
import { Hero } from "./sections/Hero";
import { Metrics } from "./sections/Metrics";
import { Highlights } from "./sections/Highlights";
import { AppPreview } from "./sections/AppPreview";
import { HowItWorks } from "./sections/HowItWorks";
import { CoachTeaser } from "./sections/CoachTeaser";
import { CTASection } from "./sections/CTASection";
import { Footer } from "./sections/Footer";

export const metadata: Metadata = {
  title: "FitBalance | Planes de alimentación acompañados",
  description:
    "FitBalance te guía con menús, agua y recordatorios diarios pensados para personas reales y equipos de salud que buscan orden.",
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
      <Footer />
    </main>
  );
}
