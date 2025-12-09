import type { Metadata } from "next";
import { Hero } from "./sections/Hero";
import { Metrics } from "./sections/Metrics";
import { Highlights } from "./sections/Highlights";
import { AppPreview } from "./sections/AppPreview";
import { HowItWorks } from "./sections/HowItWorks";
import { CoachTeaser } from "./sections/CoachTeaser";
import { CTASection } from "./sections/CTASection";
import { Footer } from "./sections/Footer";
import Link from "next/link";

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
      {/* Apartado de acceso para profesionales y planes familiares */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">¿Eres profesional?</h2>
            <p className="mt-2 text-slate-600">Si eres <strong>Nutricionista</strong> o <strong>Coach</strong>, ingresa aquí para gestionar tus clientes.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/auth_userPro/login" className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-5 py-2.5 text-white text-sm font-medium shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                Soy Nutricionista
              </Link>
              <Link href="/auth_userPro/login" className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-slate-900 text-sm font-medium shadow hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                Soy Coach
              </Link>
            </div>
          </div>
          <div className="mx-auto mt-12 max-w-3xl text-center">
            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">FitBalance adaptado a <span className="text-emerald-600">planes familiares</span></h3>
            <p className="mt-2 text-slate-600">Organiza menús y hábitos para toda la familia desde un solo lugar.</p>
            <div className="mt-6">
              <Link href="/auth_userPro/login" className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-5 py-2.5 text-white text-sm font-medium shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                Ir al login
              </Link>
            </div>
          </div>
        </div>
      </section>
      <CTASection />
      <Footer />
    </main>
  );
}
