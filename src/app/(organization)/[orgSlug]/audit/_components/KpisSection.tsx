"use client";
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function KpisSection() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(
          `/api/organization/audit/kpis?orgSlug=${
            window.location.pathname.split("/")[1]
          }`
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
    return <p className="text-sm text-muted-foreground">Cargando KPIs...</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <Card>
        <CardHeader>
          <CardTitle>Total logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{data.totalLogs}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acciones (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{data.recent24h}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de acción</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm">
            {data.actionsSummary?.map((a: any) => (
              <li key={a.action}>
                {a.action}: {a.count}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
