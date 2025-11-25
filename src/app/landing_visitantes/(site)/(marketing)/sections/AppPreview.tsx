const mockups = [
  {
    title: "Panel diario",
    description: "Calorías, macros y proyección ETA alineadas con el plan clínico.",
  },
  {
    title: "Reporte descargable",
    description: "Documentos PDF con métricas, progreso y recomendaciones lista para compartir.",
  },
  {
    title: "Plan semanal",
    description: "Tablas editables por IA y pronto por nutricionistas para personalizar comidas.",
  },
];

export function AppPreview() {
  return (
    <section className="bg-gradient-to-b from-white to-emerald-50/40 py-20 text-slate-900">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Producto</p>
            <h2 className="mt-4 font-serif text-3xl font-semibold">Diseñada para lucir impecable en escritorio y móvil</h2>
            <p className="mt-3 text-slate-600">
              Reservamos espacio para las capturas oficiales de la app. Mientras tanto, mostramos la distribución exacta
              de secciones para que tu equipo de diseño pueda remplazarlas sin tocar código.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {mockups.map((mock) => (
                <div key={mock.title} className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                  <p className="font-serif text-base font-semibold">{mock.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{mock.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl border border-emerald-100 bg-white/70" />
            <div className="relative grid gap-6">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-64 rounded-3xl border border-slate-100 bg-white shadow-[0_15px_45px_rgba(46,160,111,0.15)]"
                >
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-500">
                    <span className="text-sm uppercase tracking-[0.5em]">Mockup {n}</span>
                    <span className="text-sm">Coloca aquí tu captura de la app (1400x900)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
