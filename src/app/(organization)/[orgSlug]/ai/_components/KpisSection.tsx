"use client";
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AIkpis() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const orgSlug = window.location.pathname.split("/")[1];
        const res = await fetch(
          `/api/organization/ai/summary?orgSlug=${orgSlug}`
        );
        if (!res.ok) throw new Error("failed");
        const json = await res.json();
        if (mounted) setData(json);
      } catch (e) {
        console.error(e);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (!data)
    return (
      <p className="text-sm text-muted-foreground">Cargando señales IA...</p>
    );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Clientes monitorizados</CardTitle>
        </CardHeader>
        <CardContent>{data.userCount}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adherencia (promedio)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.adherenceAvg != null ? `${data.adherenceAvg}%` : "-"}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hidratación media (hoy)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.hydrationAvgLitersToday != null
            ? `${data.hydrationAvgLitersToday} L`
            : "-"}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Patrón calorías</CardTitle>
        </CardHeader>
        <CardContent>{data.caloriesMode ?? "-"} kcal</CardContent>
      </Card>
    </div>
  );
}
