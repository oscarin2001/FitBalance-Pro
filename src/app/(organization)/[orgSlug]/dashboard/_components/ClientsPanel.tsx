"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CreateClientForm from "../clients/_components/CreateClientForm";

interface ClientsResp {
  newClientsThisWeek: number;
  clientsInRiskCount: number;
  clientsNoMealsCount: number;
  clientsNoBodyProgressCount: number;
  clientsNoRoutinesCount: number;
}

export default function ClientsPanel() {
  const { orgSlug } = useParams() as { orgSlug?: string };
  const [data, setData] = useState<ClientsResp | null>(null);
  const [branches, setBranches] = useState<
    Array<{ id: number; name: string; clientsCount: number }>
  >([]);

  useEffect(() => {
    if (!orgSlug) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/organization/dashboard/clients?orgSlug=${orgSlug}`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("failed");
        const json = await res.json();
        if (!cancelled)
          setData({
            newClientsThisWeek: json.newClientsThisWeek,
            clientsInRiskCount: json.clientsInRiskCount,
            clientsNoMealsCount: json.clientsNoMealsCount,
            clientsNoBodyProgressCount: json.clientsNoBodyProgressCount,
            clientsNoRoutinesCount: json.clientsNoRoutinesCount,
          });
      } catch (e) {
        console.error(e);
      }
    }
    load();

    // load branches counts
    (async () => {
      try {
        const r2 = await fetch(
          `/api/organization/dashboard/branches?orgSlug=${orgSlug}`,
          { credentials: "include" }
        );
        if (!r2.ok) return;
        const j2 = await r2.json();
        if (!cancelled) return;
        setBranches(
          (j2?.branches || []).map((b: any) => ({
            id: b.id,
            name: b.name,
            clientsCount: b.clientsCount || 0,
          }))
        );
      } catch (err) {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgSlug]);

  if (!data)
    return <p className="text-sm text-muted-foreground">Sin datos aún.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Nuevos clientes (7d)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            {data.newClientsThisWeek}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Clientes en riesgo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-rose-600">
            {data.clientsInRiskCount}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sin registro comidas &gt;3d
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            {data.clientsNoMealsCount}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Crear cliente rápido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreateClientForm
            orgSlug={orgSlug ?? ""}
            onCreated={() => {
              /* no-op: counts refresh on page reload */
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Clientes por sucursal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {branches.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin sucursales</p>
          ) : (
            <ul className="space-y-2">
              {branches.map((b) => (
                <li key={b.id} className="flex items-center justify-between">
                  <span className="text-sm">
                    {b.name || `Sucursal ${b.id}`}
                  </span>
                  <span className="text-lg font-semibold">
                    {b.clientsCount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sin progreso &gt;2w
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            {data.clientsNoBodyProgressCount}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sin rutinas asignadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            {data.clientsNoRoutinesCount}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
