"use client";

import React, { useEffect, useState } from "react";
import { KpiCard } from "../cards/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GlobalKpis {
  totalBranches: number;
  totalProfessionals: number;
  totalClients: number;
  activeSubscriptions: number;
  revenueMonth: number;
  revenueYear: number;
  retentionRate: number;
  churnRate: number;
}

export function KpiGlobalGrid() {
  const [kpis, setKpis] = useState<GlobalKpis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchKpis() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/organization/global/dashboard");
        if (!res.ok) throw new Error("No se pudieron cargar KPIs globales");
        const data = await res.json();
        if (!cancelled) setKpis(data);
      } catch (err: any) {
        if (!cancelled)
          setError(err?.message || "Error al cargar métricas globales");
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sucursales creadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KpiCard plain label="" value={kpis.totalBranches} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Profesionales activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KpiCard plain label="" value={kpis.totalProfessionals} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Clientes registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KpiCard plain label="" value={kpis.totalClients} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Suscripciones activas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KpiCard plain label="" value={kpis.activeSubscriptions} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ingresos mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KpiCard
            plain
            label=""
            value={`$${kpis.revenueMonth.toLocaleString()}`}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ingresos año
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KpiCard
            plain
            label=""
            value={`$${kpis.revenueYear.toLocaleString()}`}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Retención usuarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KpiCard plain label="" value={`${kpis.retentionRate.toFixed(1)}%`} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tasa cancelación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KpiCard plain label="" value={`${kpis.churnRate.toFixed(1)}%`} />
        </CardContent>
      </Card>
    </div>
  );
}
