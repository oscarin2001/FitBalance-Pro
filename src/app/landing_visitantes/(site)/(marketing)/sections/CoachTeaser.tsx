import Link from "next/link";

export function CoachTeaser() {
  return (
    <section id="roadmap" className="bg-gradient-to-b from-white to-indigo-50/40 py-20 text-slate-900">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">Próximamente</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold">Panel para nutricionistas y clínicas</h2>
          <p className="mt-4 text-slate-600">
            Estamos habilitando herramientas para que los profesionales creen pacientes, diseñen dietas manuales, asignen
            alertas y documenten consultas directamente en FitBalance. El objetivo: que los planes generados por IA
            puedan complementarse con la experiencia clínica sin fricción.
          </p>
          <ul className="mt-6 space-y-4 text-slate-600">
            <li>• Gestión de pacientes y firmas digitales.</li>
            <li>• Plantillas editables de menús, suplementos y seguimiento.</li>
            <li>• Exportación PDF con branding de cada centro.</li>
          </ul>
          <Link
            href="mailto:hola@fitbalance.app"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Quiero ser parte del piloto
          </Link>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_25px_70px_rgba(92,66,216,0.18)]">
          <p className="text-sm uppercase tracking-[0.4em] text-indigo-500">Roadmap 2026</p>
          <div className="mt-6 space-y-5 text-slate-700">
            <div>
              <p className="text-xs font-semibold text-slate-400">Q1</p>
              <p className="text-base">Portal para subir planes manuales con librería de alimentos.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Q2</p>
              <p className="text-base">Chat colaborativo paciente-equipo y tareas automáticas.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Q3</p>
              <p className="text-base">Integraciones con balanzas inteligentes y wearables.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
