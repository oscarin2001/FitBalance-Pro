"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEuroFromCents } from "@/utils/currency/format-eur";

type OrgFinanceKpisProps = {
  orgSlug?: string;
};

type OrgFinanceResponse = {
  revenueGrossCents: number;
  platformCommissionsCents: number;
  netGainCents: number;
  branches?: Array<{ id: string | number; name: string; revenueCents: number }>;
  topProfessionalsPayouts?: Array<{
    professionalId: string;
    _sum: { amountCents: number };
  }>;
  plans?: Array<{ id: string | number; name: string; revenueCents: number }>;
};

const integerFormatter = new Intl.NumberFormat("es-ES");

export default function OrgFinanceKpis({ orgSlug }: OrgFinanceKpisProps) {
  const [data, setData] = useState<OrgFinanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const slug =
        orgSlug ?? window.location.pathname.split("/").filter(Boolean)[0];
      if (!slug) throw new Error("No se encontró la organización.");

      const res = await fetch(
        `/api/organization/finance/org/kpis?orgSlug=${slug}`
      );
      if (!res.ok)
        throw new Error("No pudimos cargar la información financiera.");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Error inesperado al cargar datos."
      );
    } finally {
      setLoading(false);
    }
  }, [orgSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton
              key={`metric-skeleton-${idx}`}
              className="h-32 rounded-xl"
            />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((idx) => (
            <Skeleton
              key={`list-skeleton-${idx}`}
              className="h-40 rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        <p>{error}</p>
        <Button variant="outline" size="sm" onClick={fetchData}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const metrics = [
    {
      title: "Ingresos brutos",
      value: formatEuroFromCents(data.revenueGrossCents),
      helper: "Pagos confirmados durante el período.",
    },
    {
      title: "Comisiones de plataforma",
      value: formatEuroFromCents(data.platformCommissionsCents),
      helper: "Fee aplicado por FitBalance.",
    },
    {
      title: "Ganancia neta",
      value: formatEuroFromCents(data.netGainCents),
      helper: "Ingresos menos comisiones.",
    },
    {
      title: "Sucursales con ingresos",
      value: integerFormatter.format(data.branches?.length ?? 0),
      helper: "Registros vinculados al último corte.",
    },
  ];

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Resumen
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchData}
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="border-border/70 shadow-sm">
            <CardHeader className="space-y-1">
              <CardDescription>{metric.title}</CardDescription>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                {metric.value}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {metric.helper}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DataCard
          title="Top sucursales"
          description="Ordenadas por ingresos reportados."
          emptyLabel="Aún no hay sucursales con datos."
          items={
            data.branches?.slice(0, 5).map((branch) => ({
              id: branch.id,
              label: branch.name || `Sucursal ${branch.id}`,
              value: formatEuroFromCents(branch.revenueCents),
              helper: branch.id ? `ID ${branch.id}` : undefined,
            })) || []
          }
        />

        <DataCard
          title="Profesionales que más cobran"
          description="Basado en payouts registrados."
          emptyLabel="Todavía no hay profesionales con cobros."
          items={
            data.topProfessionalsPayouts?.map((pro) => ({
              id: pro.professionalId,
              label: `Pro ${pro.professionalId}`,
              value: formatEuroFromCents(pro?._sum?.amountCents),
            })) || []
          }
        />

        <DataCard
          title="Planes con ingresos"
          description="Planes que generaron cobros en el período."
          emptyLabel="No se registraron pagos por plan."
          items={
            data.plans?.map((plan) => ({
              id: plan.id,
              label: plan.name,
              value: formatEuroFromCents(plan.revenueCents),
            })) || []
          }
        />
      </div>
    </div>
  );
}

type DataCardProps = {
  title: string;
  description: string;
  emptyLabel: string;
  items: Array<{
    id: string | number;
    label: string;
    value: string;
    helper?: string;
  }>;
};

function DataCard({ title, description, items, emptyLabel }: DataCardProps) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium leading-tight">
                  {item.label}
                </p>
                {item.helper ? (
                  <p className="text-xs text-muted-foreground">{item.helper}</p>
                ) : null}
              </div>
              <p className="text-sm font-semibold">{item.value}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
