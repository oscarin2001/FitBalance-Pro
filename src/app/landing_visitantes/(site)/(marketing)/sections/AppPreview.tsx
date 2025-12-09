"use client";

import Image from "next/image";
import { useState } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const slides = [
  {
    title: "Plan diario",
    description:
      "Ve qué comer en cada momento con las porciones ya calculadas.",
    image: "/assets/landing/mockups/plan-diario.png",
    tip: "Guarda esta captura como public/assets/landing/mockups/plan-diario.png",
  },
  {
    title: "Registro de hábitos",
    description: "Marca tus vasos de agua, infusiones y logros diarios.",
    image: "/assets/landing/mockups/habitos.png",
    tip: "Guarda esta captura como public/assets/landing/mockups/habitos.png",
  },
  {
    title: "Resumen para compartir",
    description:
      "Descarga un informe bonito para enviarlo por chat o imprimir.",
    image: "/assets/landing/mockups/resumen.png",
    tip: "Guarda esta captura como public/assets/landing/mockups/resumen.png",
  },
];

const previewNotes = [
  {
    title: "Se adapta sola",
    description:
      "Las capturas lucen bien en escritorio y móvil sin ajustar nada.",
  },
  {
    title: "Cero complicaciones",
    description:
      "Solo reemplaza las imágenes en la carpeta indicada; no necesitas tocar código.",
  },
  {
    title: "Cuenta una historia",
    description:
      "Usa distintas pantallas para mostrar desde el plan hasta el seguimiento diario.",
  },
];

export function AppPreview() {
  return (
    <section className="bg-gradient-to-b from-white to-emerald-50/40 py-20 text-slate-900">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
              Producto
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold">
              Muestra tus pantallas reales en un carrusel suave
            </h2>
            <p className="mt-3 text-slate-600">
              Sube capturas en formato PNG o JPG (1400x900) dentro de{" "}
              <code className="mx-1 rounded bg-emerald-100/70 px-1 text-xs">
                /public/assets/landing/mockups
              </code>
              . El carrusel las rota automáticamente para que cualquier persona
              entienda cómo se ve FitBalance.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {previewNotes.map((note) => (
                <div
                  key={note.title}
                  className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm"
                >
                  <p className="font-serif text-base font-semibold">
                    {note.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {note.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl border border-emerald-100 bg-white/70" />
            <div className="relative rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-[0_25px_60px_rgba(46,160,111,0.2)]">
              <Carousel className="w-full">
                <CarouselContent>
                  {slides.map((slide) => (
                    <CarouselItem key={slide.title}>
                      <figure className="space-y-4">
                        <MockupImage slide={slide} />
                        <figcaption className="text-center">
                          <p className="font-serif text-xl font-semibold">
                            {slide.title}
                          </p>
                          <p className="text-sm text-slate-600">
                            {slide.description}
                          </p>
                          <p className="mt-2 text-xs text-slate-400">
                            {slide.tip}
                          </p>
                        </figcaption>
                      </figure>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="bg-white/90 shadow" />
                <CarouselNext className="bg-white/90 shadow" />
              </Carousel>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type Slide = (typeof slides)[number];

function MockupImage({ slide }: { slide: Slide }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 text-center text-sm text-emerald-700">
        <span>Agrega la captura mencionada arriba para verla aquí.</span>
        <span className="text-xs text-emerald-500">{slide.tip}</span>
      </div>
    );
  }

  return (
    <Image
      src={slide.image}
      alt={slide.title}
      width={1400}
      height={900}
      className="h-56 md:h-72 w-full rounded-2xl border border-slate-100 object-cover shadow-lg"
      priority={slide.title === "Plan diario"}
      onError={() => setFailed(true)}
    />
  );
}
