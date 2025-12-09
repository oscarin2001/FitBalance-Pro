"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CreateBranchModal from "../../branches/_components/CreateBranchModal";
import BranchManagerSelect from "../../branches/_components/BranchManagerSelect";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

type Branch = {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  clientsCount: number | null;
  professionalsCount: number | null;
  revenue: number | null; // cents
  managerProfessionalId?: number | null;
  managerName?: string | null;
};

export default function BranchesPanel() {
  const { orgSlug } = useParams() as { orgSlug?: string };
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [totals, setTotals] = useState<{
    totalBranches?: number;
    totalClients?: number;
    totalProfessionals?: number;
    totalRevenue?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgSlug) return;
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/organization/dashboard/branches?orgSlug=${encodeURIComponent(
            orgSlug
          )}`,
          { credentials: "include" }
        );
        if (!mounted) return;
        if (!res.ok) {
          setBranches([]);
          return;
        }
        const data = await res.json();
        setBranches(data.branches || []);
        setTotals({
          totalBranches: data.totalBranches,
          totalClients: data.totalClients,
          totalProfessionals: data.totalProfessionals,
          totalRevenue: data.totalRevenue,
        });
      } catch (e) {
        console.error(e);
        setBranches([]);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [orgSlug]);

  async function reloadBranches(currentOrgSlug: string) {
    try {
      const reload = await fetch(
        `/api/organization/dashboard/branches?orgSlug=${encodeURIComponent(
          currentOrgSlug
        )}`,
        { credentials: "include" }
      );
      if (!reload.ok) return;
      const fresh = await reload.json();
      setBranches(fresh.branches || []);
      setTotals({
        totalBranches: fresh.totalBranches,
        totalClients: fresh.totalClients,
        totalProfessionals: fresh.totalProfessionals,
        totalRevenue: fresh.totalRevenue,
      });
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Gestión de sucursales</CardTitle>
            {orgSlug && (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                Agregar sucursal
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Listado de sucursales y métricas por sucursal. Si algunos valores
            aparecen como “—”, es porque algunos registros aún no están
            atribuidos a una sucursal.
          </p>
          {totals && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 bg-muted rounded">
                <div className="text-xs text-muted-foreground">Sucursales</div>
                <div className="text-lg font-semibold">
                  {totals.totalBranches ?? "—"}
                </div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="text-xs text-muted-foreground">Clientes</div>
                <div className="text-lg font-semibold">
                  {totals.totalClients ?? "—"}
                </div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="text-xs text-muted-foreground">
                  Profesionales
                </div>
                <div className="text-lg font-semibold">
                  {totals.totalProfessionals ?? "—"}
                </div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="text-xs text-muted-foreground">Ingresos</div>
                <div className="text-lg font-semibold">
                  {totals.totalRevenue != null
                    ? `€${(totals.totalRevenue / 100).toFixed(2)}`
                    : "—"}
                </div>
              </div>
            </div>
          )}
          {createError && (
            <p className="mt-3 text-xs text-red-600">{createError}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>Profesionales</TableHead>
                  <TableHead>Encargado</TableHead>
                  <TableHead>Ingresos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5}>Cargando...</TableCell>
                  </TableRow>
                )}
                {!loading && (!branches || branches.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5}>No hay sucursales</TableCell>
                  </TableRow>
                )}
                {!loading &&
                  branches &&
                  branches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.name}</TableCell>
                      <TableCell>{b.city || "—"}</TableCell>
                      <TableCell>
                        {b.clientsCount == null ? "—" : b.clientsCount}
                      </TableCell>
                      <TableCell>
                        {b.professionalsCount == null
                          ? "—"
                          : b.professionalsCount}
                      </TableCell>
                      <TableCell>
                        <BranchManagerSelect
                          orgSlug={orgSlug!}
                          branchId={Number(b.id)}
                          currentManagerId={b.managerProfessionalId ?? null}
                          onUpdated={(updated) => {
                            // update local state for this branch (id and name)
                            setBranches((prev) =>
                              (prev || []).map((br) =>
                                String(br.id) === String(b.id)
                                  ? {
                                      ...br,
                                      managerProfessionalId:
                                        updated.managerProfessionalId,
                                      managerName:
                                        updated.managerName ?? br.managerName,
                                    }
                                  : br
                              )
                            );
                          }}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {b.managerName
                            ? `Encargado: ${b.managerName}`
                            : "Sin encargado"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {b.revenue == null
                          ? "—"
                          : `€${(b.revenue / 100).toFixed(2)}`}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {orgSlug && (
        <CreateBranchModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => reloadBranches(orgSlug)}
          orgSlug={orgSlug}
        />
      )}
    </div>
  );
}
