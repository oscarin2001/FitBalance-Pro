import React from "react";
import { OrgPageHeader } from "../../_components/org-page-header";
import "use client";
import ReactClient, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "../../_components/cards/KpiCard";

function KpiWorkTeamGridClient() {
  const [kpis, setKpis] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchKpis() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/organization/work_team/dashboard");
        if (!res.ok) throw new Error("No se pudieron cargar KPIs de work_team");
        const data = await res.json();
        if (!cancelled) setKpis(data);
      } catch (err: any) {
        if (!cancelled)
          setError(err?.message || "Error al cargar métricas work_team");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchKpis();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !kpis)
    return <p className="text-sm text-slate-400">Cargando...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!kpis) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Miembros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KpiCard plain label="" value={kpis.totalMembers ?? 0} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Equipos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KpiCard plain label="" value={kpis.totalTeams ?? 0} />
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
            value={`$${(kpis.revenueMonth ?? 0).toLocaleString()}`}
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
            value={`$${(kpis.revenueYear ?? 0).toLocaleString()}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function WorkTeamPage() {
  return (
    <div className="space-y-8">
      <OrgPageHeader
        title="Work Team"
        description="Métricas por equipo de trabajo."
      />

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          KPIs Work Team
        </h2>
        {/* @ts-ignore */}
        <KpiWorkTeamGridClient />
      </section>
    </div>
  );
}
