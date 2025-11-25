import Image from "next/image";
import Link from "next/link";

// Place a 1400x900 PNG/JPG at public/assets/landing/hero/app-preview.png to update the hero mockup.
const HERO_IMAGE_SRC = "/assets/landing/hero/app-preview.png";
const HERO_IMAGE_ALT = "Vista previa del panel FitBalance mostrando planes y recordatorios";

const accent = {
  primary: "#2f855a",
  purple: "#5c42d8",
};

export function Hero() {
  const navLinks = [
    { label: "Características", href: "#caracteristicas" },
    { label: "Cómo funciona", href: "#como-funciona" },
    { label: "Roadmap", href: "#roadmap" },
  ];

  return (
    <header className="bg-gradient-to-br from-white via-emerald-50 to-indigo-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <nav className="flex items-center justify-between rounded-full border border-slate-200 bg-white/80 px-6 py-4 shadow-sm">
          <div className="text-lg font-semibold tracking-tight">FitBalance</div>
          <ul className="flex gap-6 text-sm font-medium">
            {navLinks.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="text-slate-500 transition hover:text-slate-900">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="grid gap-10 pb-16 pt-20 text-center md:pb-24">
          <div className="mx-auto inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs uppercase tracking-[0.4em] text-slate-500">
            Lanzamiento beta
          </div>
          <div className="mx-auto max-w-4xl space-y-6">
            <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Inicia como una persona normal y deja que la IA te asesore con planes accesibles.
            </h1>
            <p className="text-base text-slate-600 md:text-lg">
              FitBalance es una PWA pensada para quienes no pueden pagar consultas privadas. Respondes en lenguaje
              cotidiano y el copiloto combina IA con lineamientos clínicos para proponerte alimentación, hidratación y
              recordatorios accionables.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
            <Link
              href="#descargar-app"
              className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
              style={{ ['--accent' as string]: accent.primary }}
            >
              Instalar FitBalance
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex min-w-[220px] items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-600 transition hover:border-slate-400"
            >
              Entrar al panel web
            </Link>
          </div>
          <figure className="mx-auto mt-12 max-w-5xl rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-2xl shadow-emerald-100">
            <Image
              src={HERO_IMAGE_SRC}
              alt={HERO_IMAGE_ALT}
              width={1600}
              height={900}
              className="w-full rounded-2xl border border-slate-100 object-cover"
              priority
            />
          </figure>
        </div>
      </div>
    </header>
  );
}
