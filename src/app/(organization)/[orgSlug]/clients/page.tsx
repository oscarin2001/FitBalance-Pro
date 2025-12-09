"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import CreateClientModal from "../clients/_components/CreateClientModal";

type ClientRow = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  coach?: { id: string; name?: string | null; branchId?: string | null } | null;
  branch?: { id: string; name: string } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
  updatedBy?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
};

export default function ClientsPage() {
  const params = useParams();
  const orgSlug = (params as any)?.orgSlug;

  const [rows, setRows] = useState<ClientRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  useEffect(() => {
    if (!orgSlug) return;
    let mounted = true;
    setLoading(true);
    fetch(
      `/api/organization/management/v1/clients/list?orgSlug=${encodeURIComponent(
        orgSlug
      )}`,
      { credentials: "include" }
    )
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setRows(data?.rows || []);
      })
      .catch(() => {
        if (!mounted) return;
        setRows([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [orgSlug]);

  if (!orgSlug) return <div>Org slug missing</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 border-b border-border/80 pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Organizacion
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Clientes</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Gestiona los clientes de la organización, asigna coach y sucursal.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => setOpenCreate(true)}>Agregar cliente</Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Clientes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Listado de clientes y su coach/sucursal asignada.
          </p>
        </CardContent>
        {orgSlug && (
          <CreateClientModal
            orgSlug={orgSlug}
            open={openCreate}
            onClose={() => setOpenCreate(false)}
            onCreated={() => {
              // refresh list after creation
              setLoading(true);
              fetch(
                `/api/organization/management/v1/clients/list?orgSlug=${encodeURIComponent(
                  orgSlug
                )}`,
                { credentials: "include" }
              )
                .then((r) => r.json())
                .then((data) => setRows(data?.rows || []))
                .finally(() => setLoading(false));
            }}
          />
        )}
      </Card>

      <Card>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Coach asignado</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Creado por</TableHead>
                  <TableHead>Actualizado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5}>Cargando clientes…</TableCell>
                  </TableRow>
                )}
                {!loading && (!rows || rows.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5}>No hay clientes</TableCell>
                  </TableRow>
                )}
                {!loading &&
                  rows &&
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">
                          {(r.firstName || "") + " " + (r.lastName || "")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {r.email}
                        </div>
                      </TableCell>
                      <TableCell>{r.coach ? r.coach.name : "—"}</TableCell>
                      <TableCell>{r.branch ? r.branch.name : "—"}</TableCell>
                      <TableCell>
                        {r.createdBy
                          ? r.createdBy.name || r.createdBy.email
                          : "Sistema"}
                      </TableCell>
                      <TableCell>
                        {r.updatedBy
                          ? r.updatedBy.name || r.updatedBy.email
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
