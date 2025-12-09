"use client";
import React from "react";

type Props = {
  onSelect: (role: "NUTRICIONISTA" | "COACH") => void;
};

export default function RoleStep({ onSelect }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Selecciona tu rol profesional</h2>
        <p className="text-sm text-slate-600">Elige si te registrarás como Nutricionista o como Coach.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect("NUTRICIONISTA")}
          className="rounded-lg border border-slate-200 p-5 text-left hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <div className="font-medium">Soy Nutricionista</div>
          <p className="mt-1 text-sm text-slate-600">
            Crea y gestiona planes nutricionales, monitoriza adherencia y progreso de tus pacientes.
          </p>
        </button>
        <button
          type="button"
          onClick={() => onSelect("COACH")}
          className="rounded-lg border border-slate-200 p-5 text-left hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <div className="font-medium">Soy Coach</div>
          <p className="mt-1 text-sm text-slate-600">
            Diseña rutinas, controla hábitos y motiva a tus clientes con recordatorios y seguimiento.
          </p>
        </button>
      </div>
    </div>
  );
}
