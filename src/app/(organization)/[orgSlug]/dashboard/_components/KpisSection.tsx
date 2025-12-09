"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "../../../_components/cards/KpiCard";

interface KpisResp {
  membersTotal: number;
  professionalsCount: number;
  clientsAttendedThisWeek: number;
  activeSubscriptions: number;
  revenueTotal: number;
  percentClientsWithProgress: number;
  averageAdherence: number | null;
}

export default function KpisSection() {
  const { orgSlug } = useParams() as { orgSlug?: string };
  const [data, setData] = useState<KpisResp | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgSlug) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/organization/dashboard/kpis?orgSlug=${orgSlug}`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [orgSlug]);

  if (!data)
    return <p className="text-sm text-muted-foreground">Sin datos aún.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Miembros totales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KpiCard plain label="" value={data.membersTotal} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Profesionales activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KpiCard plain label="" value={data.professionalsCount} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Clientes esta semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KpiCard plain label="" value={data.clientsAttendedThisWeek} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Suscripciones activas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KpiCard plain label="" value={data.activeSubscriptions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ingresos totales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KpiCard
            plain
            label=""
            value={`$${data.revenueTotal.toLocaleString()}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            % clientes con progreso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KpiCard
            plain
            label=""
            value={`${data.percentClientsWithProgress}%`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Adherencia promedio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KpiCard
            plain
            label=""
            value={
              data.averageAdherence
                ? `${data.averageAdherence.toFixed(1)}%`
                : "-"
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
