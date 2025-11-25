const features = [
  {
    title: "Planes hechos a mano",
    description: "Tomamos tus objetivos y gustos para devolverte un menú ya balanceado, sin fórmulas raras ni hojas de cálculo.",
  },
  {
    title: "Todo en un mismo lugar",
    description: "Peso, medidas, agua, bebidas y hábitos se registran con dos toques y se muestran en informes fáciles de leer.",
  },
  {
    title: "Listo para equipos de salud",
    description: "Pacientes y profesionales comparten notas, alertas y materiales con el logo de la clínica, sin correos eternos.",
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
            FitBalance reemplaza hojas sueltas y mensajes dispersos con una guía clara que puedes seguir día a día.
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
