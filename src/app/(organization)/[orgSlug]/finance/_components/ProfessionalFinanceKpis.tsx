"use client";
import React, { useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEuroFromCents } from "@/utils/currency/format-eur";

type ProfessionalFinanceKpisProps = {
  orgSlug?: string;
};

type ProfessionalFinanceResponse = {
  earningsThisMonthCents: number;
  pendingCents: number;
  byClient?: Array<{ paymentId: string; _sum: { amountCents: number } }>;
  received?: Array<{ id: string; paidAt: string; amountCents: number }>;
  monthlyComparison?: Array<{
    year: number;
    month: number;
    amountCents: number;
  }>;
};

export default function ProfessionalFinanceKpis({
  orgSlug,
}: ProfessionalFinanceKpisProps) {
  const [professionalId, setProfessionalId] = useState("");
  const [data, setData] = useState<ProfessionalFinanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRequested, setHasRequested] = useState(false);

  const trimmedId = professionalId.trim();

  const fetchData = useCallback(async () => {
    if (!trimmedId) return;
    setLoading(true);
    setError(null);
    setHasRequested(true);
    try {
      const slug =
        orgSlug ?? window.location.pathname.split("/").filter(Boolean)[0];
      if (!slug) throw new Error("No se encontró la organización.");
      const res = await fetch(
        `/api/organization/finance/professional/kpis?orgSlug=${slug}&professionalId=${encodeURIComponent(
          trimmedId
        )}`
      );
      if (!res.ok)
        throw new Error("No pudimos obtener la información del profesional.");
      const json = (await res.json()) as ProfessionalFinanceResponse;
      setData(json);
    } catch (err) {
      console.error(err);
      setData(null);
      setError(
        err instanceof Error ? err.message : "Error inesperado al cargar datos."
      );
    } finally {
      setLoading(false);
    }
  }, [orgSlug, trimmedId]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    fetchData();
  }

  function handleReset() {
    setProfessionalId("");
    setData(null);
    setError(null);
    setHasRequested(false);
  }

  const showEmptyState = hasRequested && !loading && !data && !error;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="grid gap-3 sm:flex sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="professional-id">ID del profesional</Label>
          <Input
            id="professional-id"
            placeholder="pro_01J45Q9PX2"
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Lo encuentras en Organización › Profesionales › Detalle.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading || !trimmedId}>
            {loading ? "Consultando..." : "Consultar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={!professionalId && !data}
          >
            Limpiar
          </Button>
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!hasRequested && !data && !loading ? (
        <p className="text-sm text-muted-foreground">
          Introduce el ID interno del profesional para consultar payouts y pagos
          pendientes.
        </p>
      ) : null}

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton
              key={`professional-skeleton-${idx}`}
              className="h-32 rounded-xl"
            />
          ))}
        </div>
      )}

      {showEmptyState && (
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          No encontramos información para el ID proporcionado.
        </div>
      )}

      {data && !loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Ganancias del mes"
              value={formatEuroFromCents(data.earningsThisMonthCents)}
              helper="Liquidaciones confirmadas"
            />
            <StatCard
              label="Pagos pendientes"
              value={formatEuroFromCents(data.pendingCents)}
              helper="Incluye payouts en cola"
            />
            <StatCard
              label="Clientes con pagos"
              value={formatCount(data.byClient?.length)}
              helper="Últimos 30 días"
            />
            <StatCard
              label="Pagos registrados"
              value={formatCount(data.received?.length)}
              helper="Historial reciente"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Top clientes</CardTitle>
                <CardDescription>
                  Pagos que más aportaron a este profesional.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {data.byClient && data.byClient.length > 0 ? (
                  data.byClient.map((client) => (
                    <div
                      key={client.paymentId}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">Pago {client.paymentId}</p>
                        <p className="text-xs text-muted-foreground">
                          Sumatoria histórica
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatEuroFromCents(client._sum.amountCents)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Sin datos todavía.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Pagos recibidos</CardTitle>
                <CardDescription>
                  Últimas liquidaciones confirmadas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {data.received && data.received.length > 0 ? (
                  data.received.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">
                          {formatDate(payment.paidAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID {payment.id}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatEuroFromCents(payment.amountCents)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    Sin movimientos recientes.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Comparativa mensual</CardTitle>
              <CardDescription>
                Últimos seis cortes registrados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {data.monthlyComparison && data.monthlyComparison.length > 0 ? (
                data.monthlyComparison.map((month) => (
                  <div
                    key={`${month.year}-${month.month}`}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-3 py-2"
                  >
                    <p className="font-medium">
                      {formatMonth(month.year, month.month)}
                    </p>
                    <p className="font-semibold">
                      {formatEuroFromCents(month.amountCents)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">
                  No hay histórico suficiente.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
};

function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="space-y-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold tracking-tight">
          {value}
        </CardTitle>
      </CardHeader>
      {helper ? (
        <CardContent className="text-sm text-muted-foreground">
          {helper}
        </CardContent>
      ) : null}
    </Card>
  );
}

function formatCount(value?: number) {
  return typeof value === "number" && !Number.isNaN(value)
    ? value.toLocaleString("es-ES")
    : "0";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMonth(year: number, month: number) {
  return new Intl.DateTimeFormat("es-ES", {
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}
