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

export default function EntityAudit() {
  const [entity, setEntity] = useState<string>("");
  const [entityId, setEntityId] = useState<string>("");
  const [rows, setRows] = useState<any[]>([]);

  async function load(entityQ?: string, idQ?: string) {
    try {
      const orgSlug = window.location.pathname.split("/")[1];
      const qs = new URLSearchParams();
      qs.set("orgSlug", orgSlug);
      if (entityQ) qs.set("entity", entityQ);
      if (idQ) qs.set("entityId", idQ);
      const res = await fetch(
        `/api/organization/audit/entity?${qs.toString()}`
      );
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      setRows(json);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auditoría por entidad</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <input
            className="input"
            placeholder="Entidad (User, Payment...)"
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
          />
          <input
            className="input"
            placeholder="ID de entidad"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
          />
          <button className="btn" onClick={() => load(entity, entityId)}>
            Buscar
          </button>
        </div>

        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {new Date(r.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>{r.action}</TableCell>
                  <TableCell>{r.performedById}</TableCell>
                  <TableCell className="max-w-md truncate">
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
