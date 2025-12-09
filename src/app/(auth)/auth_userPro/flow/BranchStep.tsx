"use client";

import React, { useState } from "react";

type BranchPayload = {
  organizationName: string;
  hasBranches: boolean;
  branches: { name: string; city: string; country: string; address?: string }[];
};

type Props = {
  onSubmit: (payload: BranchPayload) => void;
  loading?: boolean;
};

export default function BranchStep({ onSubmit, loading }: Props) {
  const [organizationName, setOrganizationName] = useState<string>("");
  const [hasBranches, setHasBranches] = useState<"ONE" | "MULTI" | null>(null);
  const [branches, setBranches] = useState<
    { name: string; city: string; country: string; address?: string }[]
  >([{ name: "Sucursal principal", city: "", country: "", address: "" }]);

  function updateBranch(index: number, field: string, value: string) {
    setBranches((prev) => {
      const copy = [...prev];
      // @ts-ignore
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function addBranch() {
    setBranches((prev) => [
      ...prev,
      { name: "", city: "", country: "", address: "" },
    ]);
  }

  function removeBranch(index: number) {
    setBranches((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationName.trim()) return;
    if (!hasBranches) return;

    if (hasBranches === "ONE") {
      const main = branches[0];
      if (!main.name || !main.city || !main.country) return;
      onSubmit({
        organizationName: organizationName.trim(),
        hasBranches: false,
        branches: [main],
      });
      return;
    }

    const cleaned = branches.filter(
      (b) => b.name.trim() || b.city.trim() || b.country.trim()
    );
    if (!cleaned.length) return;
    onSubmit({
      organizationName: organizationName.trim(),
      hasBranches: true,
      branches: cleaned,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Tu organización</h2>
          <p className="text-sm text-slate-600">
            Primero dinos cómo se llama tu espacio principal y luego cuántas
            sedes operan con FitBalance.
          </p>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Nombre de la organización
          </label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Helios Performance Collective, FitBalance Gym Centro, Clínica Vida Norte"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setHasBranches("ONE")}
          className={`rounded-lg border p-4 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            hasBranches === "ONE"
              ? "border-emerald-500 bg-emerald-50"
              : "border-slate-200 hover:border-emerald-400"
          }`}
        >
          <div className="font-medium">Una sola sede</div>
          <p className="mt-1 text-sm text-slate-600">
            Tienes un único local o clínica principal.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setHasBranches("MULTI")}
          className={`rounded-lg border p-4 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            hasBranches === "MULTI"
              ? "border-emerald-500 bg-emerald-50"
              : "border-slate-200 hover:border-emerald-400"
          }`}
        >
          <div className="font-medium">Varias sucursales</div>
          <p className="mt-1 text-sm text-slate-600">
            Operas con dos o más sedes, clínicas, gimnasios o puntos.
          </p>
        </button>
      </div>

      {hasBranches && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Ubicaciones</h3>
            <p className="text-sm text-slate-600">
              Añade al menos la sede principal. Puedes agregar más y editarlas
              luego desde el panel de organización.
            </p>
          </div>
          <div className="space-y-4">
            {branches.map((branch, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-200 p-4 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Sucursal {index + 1}
                  </span>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeBranch(index)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Nombre</label>
                    <input
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Sucursal principal, Clínica Norte, Gym Centro"
                      value={branch.name}
                      onChange={(e) =>
                        updateBranch(index, "name", e.target.value)
                      }
                      required={index === 0}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Ciudad</label>
                    <input
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ciudad"
                      value={branch.city}
                      onChange={(e) =>
                        updateBranch(index, "city", e.target.value)
                      }
                      required={index === 0}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">País</label>
                    <input
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="País"
                      value={branch.country}
                      onChange={(e) =>
                        updateBranch(index, "country", e.target.value)
                      }
                      required={index === 0}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">
                      Dirección (opcional)
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Calle, número, referencia"
                      value={branch.address || ""}
                      onChange={(e) =>
                        updateBranch(index, "address", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {hasBranches === "MULTI" && (
            <div>
              <button
                type="button"
                onClick={addBranch}
                className="text-sm text-emerald-700 hover:underline"
              >
                + Añadir otra sucursal
              </button>
            </div>
          )}
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Continuar"}
        </button>
      </div>
    </form>
  );
}
