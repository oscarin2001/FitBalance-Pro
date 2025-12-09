"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TopPro {
  id: number;
  name: string;
  orgName: string;
  payoutsTotal: number;
  clientsCount: number;
  adherenceScore: number | null;
}

export function TopGlobalProfessionalsTable() {
  const [rows, setRows] = useState<TopPro[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/organization/global/top-professionals");
        if (!res.ok) throw new Error("No se pudieron cargar profesionales");
        const data = await res.json();
        if (!cancelled) setRows(data);
      } catch (err: any) {
        if (!cancelled)
          setError(err?.message || "Error al cargar profesionales globales");
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
      <p className="text-sm text-muted-foreground">Sin datos globales aún.</p>
    );
  }

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <Table>
        <TableHeader className="bg-muted/60">
          <TableRow>
            <TableHead>Profesional</TableHead>
            <TableHead>Organización</TableHead>
            <TableHead className="text-right">Clientes</TableHead>
            <TableHead className="text-right">Payouts</TableHead>
            <TableHead className="text-right">Adherencia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {p.orgName}
              </TableCell>
              <TableCell className="text-right">{p.clientsCount}</TableCell>
              <TableCell className="text-right text-emerald-500">
                ${""}
                {p.payoutsTotal.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {p.adherenceScore != null
                  ? `${p.adherenceScore.toFixed(1)}%`
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
