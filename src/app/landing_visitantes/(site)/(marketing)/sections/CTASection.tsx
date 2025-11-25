import Link from "next/link";

export function CTASection() {
  return (
    <section id="descargar-app" className="bg-gradient-to-br from-emerald-50 to-indigo-50 py-20 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-500">Listo para probar</p>
        <h2 className="mt-4 font-serif text-3xl font-semibold">Instala FitBalance como app o ingresa al panel web</h2>
        <p className="mt-3 text-slate-600">
          Disponible como PWA para Android y escritorio. Desde el navegador verás el botón “Instalar FitBalance” en la
          barra de direcciones o puedes abrir la app en pantalla completa desde aquí.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 md:flex-row">
          <Link
            href="/auth/login"
            className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5"
          >
            Entrar ahora
          </Link>
          <a
            href="https://fitbalance.app/install"
            className="inline-flex min-w-[220px] items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-600 transition hover:border-slate-400"
          >
            Ver guía de instalación
          </a>
        </div>
        <p className="mt-6 text-sm text-slate-500">
          ¿Tienes dudas? Escríbenos a <a className="underline" href="mailto:hola@fitbalance.app">hola@fitbalance.app</a> y
          agenda una demo personalizada.
        </p>
      </div>
    </section>
  );
}
