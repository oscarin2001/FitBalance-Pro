"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

// Place a 1400x900 PNG/JPG at public/assets/landing/hero/app-preview.png to update the hero mockup.
const HERO_IMAGE_SRC = "/assets/landing/hero/app-preview.png";
const HERO_IMAGE_ALT =
  "Vista previa del panel FitBalance mostrando planes y recordatorios";

const accent = {
  primary: "#2f855a",
  purple: "#5c42d8",
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function detectStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error - iOS Safari exposes this flag
    window.navigator.standalone === true
  );
}

export function Hero() {
  const navLinks = [
    { label: "Características", href: "#caracteristicas" },
    { label: "Cómo funciona", href: "#como-funciona" },
    { label: "Roadmap", href: "#roadmap" },
  ];

  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installNotice, setInstallNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsStandalone(detectStandalone());

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstalling(false);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
      setInstallNotice("La app ya está en el escritorio de tu celular.");
      setTimeout(() => setInstallNotice(null), 6000);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstall as EventListener
    );
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstall as EventListener
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handlePrimaryCta = useCallback(async () => {
    if (isStandalone) {
      // Don't redirect when installed. Show instruction to user instead.
      setInstallNotice("Redirígete a tu pantalla principal para ver la app");
      setTimeout(() => setInstallNotice(null), 6000);
      return;
    }

    if (installPrompt) {
      setInstalling(true);
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice && choice.outcome === "accepted") {
          setInstallNotice("La app ya está en el escritorio de tu celular.");
          setTimeout(() => setInstallNotice(null), 6000);
        }
      } finally {
        setInstalling(false);
        setInstallPrompt(null);
      }
      return;
    }

    window.location.href = "/auth/login";
  }, [installPrompt, isStandalone]);

  const primaryCtaLabel = useMemo(() => {
    if (isStandalone)
      return "Redirígete a tu pantalla principal para ver la app";
    if (installing) return "Abriendo instalación…";
    return "Instalar — Android/iOS";
  }, [isStandalone, installing]);

  const primaryCtaDisabled = installing;

  return (
    <header className="bg-gradient-to-br from-white via-emerald-50 to-indigo-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <nav className="rounded-full border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
          <div className="mx-auto max-w-6xl px-0">
            <div className="grid grid-cols-3 items-center">
              <div className="flex items-center justify-start">
                {/* left slot (kept empty on purpose for balance) */}
              </div>
              <div className="flex items-center justify-center">
                <div className="text-lg font-semibold tracking-tight">
                  FitBalance
                </div>
              </div>
              <div className="hidden md:flex items-center justify-end">
                <ul className="flex gap-6 text-sm font-medium">
                  {navLinks.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        className="text-slate-500 transition hover:text-slate-900"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </nav>
        <div className="grid gap-10 pb-16 pt-20 text-center md:pb-24">
          <div className="mx-auto inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs uppercase tracking-[0.4em] text-slate-500">
            Lanzamiento beta
          </div>
          <div className="mx-auto max-w-4xl space-y-6">
            <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Inicia como una persona normal y deja que la IA te asesore con
              planes accesibles.
            </h1>
            <p className="text-base text-slate-600 md:text-lg">
              FitBalance es una app web ligera pensada para quienes no pueden
              pagar consultas privadas. Respondes en lenguaje cotidiano y
              nuestro acompañamiento digital toma esas respuestas para sugerirte
              comidas, hidratación y recordatorios fáciles de seguir.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
            <button
              type="button"
              onClick={handlePrimaryCta}
              disabled={primaryCtaDisabled}
              className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-70"
              style={{ ["--accent" as string]: accent.primary }}
            >
              {primaryCtaLabel}
            </button>

            <Link
              href="/auth/login"
              className="inline-flex min-w-[220px] items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-600 transition hover:border-slate-400"
            >
              Entrar al panel web
            </Link>
          </div>
          {/* Floating install banner */}
          {installNotice && (
            <div
              role="status"
              aria-live="polite"
              className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-3 text-white shadow-xl flex items-center gap-3 animate-pulse"
              style={{ background: accent.primary }}
            >
              <div className="text-sm font-semibold">App instalada</div>
              <button
                aria-label="Cerrar aviso"
                onClick={() => setInstallNotice(null)}
                className="text-white/90 text-sm rounded px-2 py-1"
              >
                ✕
              </button>
            </div>
          )}
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
