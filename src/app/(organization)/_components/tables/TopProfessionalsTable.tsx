"use client";

import React, { useEffect, useState } from "react";

interface TopProfessional {
  id: number;
  name: string;
  orgName: string;
  payoutsTotal: number;
  clientsCount: number;
  adherenceScore: number | null;
}

export function TopProfessionalsTable() {
  const [rows, setRows] = useState<TopProfessional[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          "/api/organization/super-admin/top-professionals"
        );
        if (!res.ok) throw new Error("No se pudieron cargar los profesionales");
        const data = await res.json();
        if (!cancelled) setRows(data);
      } catch (err: any) {
        if (!cancelled)
          setError(err?.message || "Error al cargar profesionales");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !rows.length) {
    return <p className="text-sm text-slate-400">Cargando profesionales...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (!rows.length) {
    return (
      <p className="text-sm text-slate-500">Sin datos de profesionales aún.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-900/80 text-slate-400">
          <tr>
            <th className="px-4 py-2 text-left font-medium">Profesional</th>
            <th className="px-4 py-2 text-left font-medium">Organización</th>
            <th className="px-4 py-2 text-right font-medium">Clientes</th>
            <th className="px-4 py-2 text-right font-medium">Payouts</th>
            <th className="px-4 py-2 text-right font-medium">Adherencia</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-slate-800/80">
              <td className="px-4 py-2 text-slate-50">{p.name}</td>
              <td className="px-4 py-2 text-slate-300">{p.orgName}</td>
              <td className="px-4 py-2 text-right text-slate-100">
                {p.clientsCount}
              </td>
              <td className="px-4 py-2 text-right text-emerald-300">
                ${""}
                {p.payoutsTotal.toLocaleString()}
              </td>
              <td className="px-4 py-2 text-right text-slate-200">
                {p.adherenceScore != null
                  ? `${p.adherenceScore.toFixed(1)}%`
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
