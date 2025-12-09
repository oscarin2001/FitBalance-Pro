"use client";
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function RiskPatterns() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const orgSlug = window.location.pathname.split("/")[1];
        const res = await fetch(
          `/api/organization/audit/risk?orgSlug=${orgSlug}`
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
      <p className="text-sm text-muted-foreground">
        Cargando patrones de riesgo...
      </p>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patrones de riesgo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <strong>Usuarios con mucha actividad (24h):</strong>
            <ul>
              {data.heavyUsers?.map((u: any) => (
                <li key={u.performedById}>
                  Usuario {u.performedById}: {u._count.performedById}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <strong>IPs con mucha actividad (24h):</strong>
            <ul>
              {data.heavyIps?.map((i: any) => (
                <li key={i.ipAddress}>
                  IP {i.ipAddress}: {i._count.ipAddress}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
