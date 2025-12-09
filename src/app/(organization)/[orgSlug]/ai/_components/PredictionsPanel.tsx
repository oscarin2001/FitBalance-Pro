"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

export default function PredictionsPanel() {
  const [rows, setRows] = useState<any[]>([]);

  const { status } = useSession();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (status !== "authenticated") return;
        const orgSlug = window.location.pathname.split("/")[1];
        const res = await fetch(
          `/api/organization/ai/predict?orgSlug=${orgSlug}&limit=100`
        );
        if (!res.ok) throw new Error("failed");
        const json = await res.json();
        if (mounted) setRows(json.predictions || []);
      } catch (e) {
        console.error(e);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [status]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Predicciones y riesgo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Riesgo churn</TableHead>
                <TableHead>Días sin comer</TableHead>
                <TableHead>Adherencia</TableHead>
                <TableHead>Est. fecha objetivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.userId}>
                  <TableCell>{r.userId}</TableCell>
                  <TableCell
                    className={r.churnRisk >= 50 ? "text-rose-600" : ""}
                  >
                    {r.churnRisk}%
                  </TableCell>
                  <TableCell>{r.daysSinceLastMeal}</TableCell>
                  <TableCell>
                    {r.adherenceAvg != null
                      ? `${r.adherenceAvg.toFixed(1)}%`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {r.estimatedDateToTarget
                      ? new Date(r.estimatedDateToTarget).toLocaleDateString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
