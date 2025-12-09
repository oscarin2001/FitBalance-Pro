"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Professional } from "./types";

export default function EditProfessionalDialog({
  editing,
  open,
  onOpenChange,
  firstName,
  lastName,
  phone,
  setFirstName,
  setLastName,
  setPhone,
  branchId,
  setBranchId,
  onSave,
  saving,
}: {
  editing: Professional | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstName: string;
  lastName: string;
  phone: string;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setPhone: (v: string) => void;
  branchId: number | null;
  setBranchId: (v: number | null) => void;
  onSave: () => Promise<void> | void;
  saving: boolean;
  orgSlug?: string;
}) {
  const [branches, setBranches] = React.useState<
    Array<{ id: number; name: string }>
  >([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!orgSlug) return;
      try {
        const res = await fetch(
          `/api/organization/dashboard/branches?orgSlug=${encodeURIComponent(
            orgSlug
          )}`,
          { credentials: "include" }
        );
        if (!res.ok) return;
        const j = await res.json();
        if (!mounted) return;
        setBranches(
          (j?.branches || []).map((b: any) => ({ id: b.id, name: b.name }))
        );
      } catch (err) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [orgSlug]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar profesional</DialogTitle>
          <DialogDescription>
            Actualiza los datos básicos. Los cambios quedan registrados en el
            historial del modelo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-first-name">Nombre</Label>
            <Input
              id="edit-first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-last-name">Apellido</Label>
            <Input
              id="edit-last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-phone">Teléfono</Label>
            <Input
              id="edit-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm block">Sucursal</Label>
            <select
              className="mt-1 w-full rounded border px-2 py-1"
              value={branchId ?? ""}
              onChange={(e) =>
                setBranchId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">— Ninguna —</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || `Sucursal ${b.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              // call parent onSave which should read updated state
              await onSave();
            }}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
