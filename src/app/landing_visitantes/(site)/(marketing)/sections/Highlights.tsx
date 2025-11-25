const features = [
  {
    title: "Planes inteligentes",
    description: "Algoritmos propios combinan ETA, velocidad de cambio y preferencias reales para ajustar calorías y macros sin cálculos manuales.",
  },
  {
    title: "Seguimiento integral",
    description: "Peso, perímetros, hidratación, hábito de bebidas y adherencia se unifican en dashboards y reportes PDF listos para compartir.",
  },
  {
    title: "Operación clínica",
    description: "Roles para pacientes y equipo, alertas de cumplimiento y próximos lanzamientos para nutricionistas que desean digitalizar sus consultas.",
  },
];

export function Highlights() {
  return (
    <section id="caracteristicas" className="bg-white py-20 text-slate-900">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Valor inmediato</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold">Una sola plataforma para evaluar, planificar y acompañar</h2>
          <p className="mt-3 text-slate-600">
            FitBalance reemplaza múltiples hojas y apps desconectadas por un flujo científico respaldado por IA.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_20px_50px_rgba(79,209,197,0.15)]"
            >
              <h3 className="font-serif text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
