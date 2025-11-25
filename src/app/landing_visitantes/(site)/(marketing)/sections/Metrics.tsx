const stats = [
  { value: "+120", label: "planes generados en beta" },
  { value: "97%", label: "usuarios entienden su meta semanal" },
  { value: "15 min", label: "para tener PDF clínico accionable" },
];

export function Metrics() {
  return (
    <section className="bg-white py-16 text-slate-900">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-6 rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-emerald-50/60 p-10 text-center sm:grid-cols-3 shadow-xl shadow-emerald-100/60">
          {stats.map((item) => (
            <div key={item.label} className="space-y-2">
              <p className="font-serif text-4xl font-semibold tracking-tight text-[var(--primary)]" style={{ ['--primary' as string]: '#2f855a' }}>
                {item.value}
              </p>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
