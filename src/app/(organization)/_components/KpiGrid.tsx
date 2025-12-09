"use client";

import React, { useEffect, useState } from "react";
import { KpiCard } from "./cards/KpiCard";

interface SuperAdminKpis {
  totalOrganizations: number;
  totalProfessionals: number;
  totalClients: number;
  activeSubscriptions: number;
  revenueMonth: number;
  revenueYear: number;
  retentionRate: number;
  churnRate: number;
}

export function KpiGrid() {
  const [kpis, setKpis] = useState<SuperAdminKpis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchKpis() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/organization/super-admin/dashboard");
        if (!res.ok) {
          throw new Error("No se pudieron cargar los KPIs globales");
        }
        const data = await res.json();
        if (!cancelled) setKpis(data);
      } catch (err: any) {
        if (!cancelled)
          setError(err?.message || "Error al cargar estadísticas globales");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchKpis();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !kpis) {
    return <p className="text-sm text-slate-400">Cargando métricas...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (!kpis) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Organizaciones creadas" value={kpis.totalOrganizations} />
      <KpiCard label="Profesionales activos" value={kpis.totalProfessionals} />
      <KpiCard label="Clientes registrados" value={kpis.totalClients} />
      <KpiCard label="Suscripciones activas" value={kpis.activeSubscriptions} />
      <KpiCard
        label="Ingresos mes"
        value={`$${kpis.revenueMonth.toLocaleString()}`}
      />
      <KpiCard
        label="Ingresos año"
        value={`$${kpis.revenueYear.toLocaleString()}`}
      />
      <KpiCard
        label="Retención usuarios"
        value={`${kpis.retentionRate.toFixed(1)}%`}
      />
      <KpiCard
        label="Tasa cancelación"
        value={`${kpis.churnRate.toFixed(1)}%`}
      />
    </div>
  );
}
