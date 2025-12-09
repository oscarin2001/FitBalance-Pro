"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  orgSlug: string;
};

export default function CreateBranchModal({
  open,
  onClose,
  onCreated,
  orgSlug,
}: Props) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [managerId, setManagerId] = useState<number | null>(null);
  const [professionals, setProfessionals] = useState<
    Array<{ id: number; firstName: string; lastName?: string }>
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // load professionals for manager selection
  React.useEffect(() => {
    if (!open) return;
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(
          `/api/organization/management/v1/professionals/list?orgSlug=${encodeURIComponent(
            orgSlug
          )}`,
          { credentials: "include" }
        );
        if (!mounted) return;
        if (!res.ok) return;
        const json = await res.json();
        const list = json?.professionals || json || [];
        setProfessionals(
          (list as any).map((p: any) => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
          }))
        );
      } catch (e) {
        // ignore
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [orgSlug, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) {
      setError("El nombre es obligatorio");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/organization/operations/branches?orgSlug=${encodeURIComponent(
          orgSlug
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name,
            city,
            country,
            address,
            phone,
            professionalId: managerId,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || "Error al crear sucursal";
        setError(msg);
        toast.error(msg);
        return;
      }
      setName("");
      setCity("");
      setCountry("");
      setAddress("");
      setPhone("");
      onCreated?.();
      toast.success("Sucursal creada correctamente");
      onClose();
    } catch (e) {
      const msg = "Error de red al crear sucursal";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded shadow p-6 z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Agregar sucursal</h3>
          <button aria-label="Cerrar" onClick={onClose} className="text-sm">
            Cerrar
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm block">Nombre</label>
            <Input
              className="mt-1 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm block">Ciudad</label>
              <Input
                className="mt-1 w-full"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm block">País</label>
              <Input
                className="mt-1 w-full"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm block">Dirección</label>
            <Input
              className="mt-1 w-full"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm block">Teléfono</label>
            <Input
              className="mt-1 w-full"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm block">Encargado (opcional)</label>
            <select
              className="mt-1 w-full rounded border px-2 py-1"
              value={managerId ?? ""}
              onChange={(e) =>
                setManagerId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">— Ninguno —</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName || ""}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creando..." : "Crear sucursal"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
