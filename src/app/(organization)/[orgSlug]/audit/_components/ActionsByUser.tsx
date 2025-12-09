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

export default function ActionsByUser() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const orgSlug = window.location.pathname.split("/")[1];
        const res = await fetch(
          `/api/organization/audit/by-user?orgSlug=${orgSlug}&limit=50`
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
        <CardTitle>Acciones por usuario</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Emails</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.userId}>
                <TableCell>{r.userId}</TableCell>
                <TableCell>{r.account?.email || "-"}</TableCell>
                <TableCell className="text-right">{r.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
