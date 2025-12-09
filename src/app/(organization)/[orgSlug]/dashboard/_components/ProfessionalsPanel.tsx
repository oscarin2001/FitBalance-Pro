"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProRankItem {
  id: number;
  name: string;
  adherenceAvg: number;
  activeClients: number;
  revenue: number;
  plansCount: number;
  notesCount: number;
}

export default function ProfessionalsPanel() {
  const { orgSlug } = useParams() as { orgSlug?: string };
  const [byRevenue, setByRevenue] = useState<ProRankItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgSlug) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/organization/dashboard/professionals?orgSlug=${orgSlug}`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("failed");
        const json = await res.json();
        if (!cancelled) {
          setByRevenue(json.byRevenue || []);
        }
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

  if (loading)
    return (
      <p className="text-sm text-muted-foreground">Cargando profesionales...</p>
    );
  if (!byRevenue.length)
    return (
      <p className="text-sm text-muted-foreground">
        No hay profesionales registrados.
      </p>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top por ingresos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profesional</TableHead>
              <TableHead className="text-right">Clientes</TableHead>
              <TableHead className="text-right">Ingresos</TableHead>
              <TableHead className="text-right">Adherencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byRevenue.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-right">{p.activeClients}</TableCell>
                <TableCell className="text-right text-emerald-600">
                  ${p.revenue.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {p.adherenceAvg?.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
