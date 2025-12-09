"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function PatternsPanel() {
  const [data, setData] = useState<any | null>(null);

  const { status } = useSession();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (status !== "authenticated") return;
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
  }, [status]);

  if (!data)
    return (
      <p className="text-sm text-muted-foreground">Cargando patrones...</p>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patrones y preferencias</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <strong>Alimentos preferidos:</strong>
            <ul>
              {data.favoriteFoods?.map((f: any) => (
                <li key={f.foodId}>
                  {f.name} ({f.count})
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Horarios top de comida:</strong>
            <ul>
              {data.topMealHours?.map((h: any) => (
                <li key={h.hour}>
                  {h.hour}:00 - {h.count} comidas
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
