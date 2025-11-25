const steps = [
  {
    title: "Recolectamos datos",
    detail: "Edad, objetivos, métricas corporales y hábitos actuales ingresan en minutos desde el onboarding guiado.",
  },
  {
    title: "IA valida el plan",
    detail: "Aplicamos límites clínicos propios para ajustar calorías, macros y ritmo de cambio seguro.",
  },
  {
    title: "Acompañamos la adherencia",
    detail: "Dashboard diario, registro de hidratación, PDFs y alertas mantienen al usuario alineado.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-white py-20 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-500">Proceso guiado</p>
        <h2 className="mt-4 font-serif text-3xl font-semibold">De dato crudo a plan clínico en tres pasos</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="relative rounded-2xl border border-emerald-100 bg-white p-6 text-left shadow-lg shadow-emerald-50">
              <span className="text-5xl font-semibold text-emerald-200">0{index + 1}</span>
              <h3 className="mt-4 font-serif text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm text-slate-600">{step.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
