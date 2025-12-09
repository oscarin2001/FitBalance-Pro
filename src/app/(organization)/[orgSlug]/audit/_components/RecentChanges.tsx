"use client";
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

export default function RecentChanges() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const orgSlug = window.location.pathname.split("/")[1];
        const res = await fetch(
          `/api/organization/audit/recent?orgSlug=${orgSlug}&limit=50`
        );
        if (!res.ok) throw new Error("failed");
        const json = await res.json();
        if (mounted) setRows(json);
      } catch (e) {
        console.error(e);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cambios recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Entidad</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {new Date(r.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>{r.performedById}</TableCell>
                  <TableCell>{r.action}</TableCell>
                  <TableCell>{r.entity}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {JSON.stringify(r.changes || r.oldValues || r.newValues)}
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
