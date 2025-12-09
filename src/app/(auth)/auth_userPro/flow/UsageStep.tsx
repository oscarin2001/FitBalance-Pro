"use client";
import React from "react";
import { ORG_TYPES } from "@/lib/db/auth_userPro/org";

type Props = {
  onSelect: (data: { usage: "PERSONAL" | "ORGANIZACION"; orgType?: string; orgRole?: string }) => void;
};

export default function UsageStep({ onSelect }: Props) {
  const [mode, setMode] = React.useState<"CHOOSE" | "ORG">("CHOOSE");
  const [orgType, setOrgType] = React.useState<string>("GYM");
  const [orgRole, setOrgRole] = React.useState<string>("OWNER");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">¿Para quién será el uso?</h2>
        <p className="text-sm text-slate-600">Elige si usarás FitBalance de forma personal o en una organización.</p>
      </div>

      {mode === "CHOOSE" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelect({ usage: "PERSONAL" })}
            className="rounded-lg border border-slate-200 p-5 text-left hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <div className="font-medium">Uso personal</div>
            <p className="mt-1 text-sm text-slate-600">Ideal si gestionas tus propios pacientes o clientes de manera independiente.</p>
          </button>
          <button
            type="button"
            onClick={() => setMode("ORG")}
            className="rounded-lg border border-slate-200 p-5 text-left hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <div className="font-medium">Organización / clínica / gym</div>
            <p className="mt-1 text-sm text-slate-600">Para equipos de salud o programas en centros. Centraliza a tu staff y clientes.</p>
          </button>
        </div>
      )}

      {mode === "ORG" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Tu rol en la organización</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                { code: "OWNER", label: "Dueño / Propietario", hint: "Administra todo el espacio y su facturación." },
                { code: "ADMIN", label: "Administrador", hint: "Gestiona staff, clientes y configuración." },
                { code: "NUTRICIONISTA", label: "Nutricionista", hint: "Crea planes y hace seguimiento nutricional." },
                { code: "COACH", label: "Coach", hint: "Diseña rutinas y acompaña entrenamientos." },
              ].map((r) => (
                <button
                  key={r.code}
                  type="button"
                  onClick={() => setOrgRole(r.code)}
                  className={`rounded-lg border p-4 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 ${orgRole===r.code? 'border-emerald-500 bg-emerald-50':'border-slate-200 hover:border-emerald-400'}`}
                >
                  <div className="font-medium">{r.label}</div>
                  <p className="mt-1 text-sm text-slate-600">{r.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium">Tipo de organización</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {ORG_TYPES.map((o) => (
                <button
                  key={o.code}
                  type="button"
                  onClick={() => setOrgType(o.code)}
                  className={`rounded-lg border p-4 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 ${orgType===o.code? 'border-emerald-500 bg-emerald-50':'border-slate-200 hover:border-emerald-400'}`}
                >
                  <div className="font-medium">{o.label}</div>
                  <p className="mt-1 text-sm text-slate-600">{o.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onSelect({ usage: "ORGANIZACION", orgType, orgRole })}
              className="w-full rounded-md bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
