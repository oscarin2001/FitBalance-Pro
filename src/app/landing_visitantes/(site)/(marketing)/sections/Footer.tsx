import Link from "next/link";

const footerLinks = [
  { label: "Características", href: "#caracteristicas" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "Instalar", href: "#descargar-app" },
];

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4 md:max-w-sm">
          <p className="text-lg font-semibold">FitBalance</p>
          <p className="text-sm text-slate-300">
            Acompañamos a personas reales a comer mejor con recordatorios sencillos, planes claros y un equipo dispuesto a
            ayudar. Sin tecnicismos, con empatía diaria.
          </p>
          <p className="text-sm text-slate-400">
            ¿Necesitas soporte? Escríbenos a {" "}
            <a className="underline" href="mailto:hola@fitbalance.app">
              hola@fitbalance.app
            </a>
            .
          </p>
        </div>
        <div className="grid gap-8 text-sm md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Explora</p>
            <ul className="mt-3 space-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-slate-300 transition hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Recursos</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/auth/login" className="text-slate-300 transition hover:text-white">
                  Entrar al panel web
                </Link>
              </li>
              <li>
                <a
                  href="https://fitbalance.app/install"
                  className="text-slate-300 transition hover:text-white"
                  target="_blank"
                  rel="noreferrer"
                >
                  Guía para instalar la app
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com"
                  className="text-slate-300 transition hover:text-white"
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram (próximamente)
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} FitBalance. Hecho con paciencia en LATAM.
      </div>
    </footer>
  );
}
