"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CreateClientForm({
  orgSlug,
  onCreated,
}: {
  orgSlug: string;
  onCreated?: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailLocal, setEmailLocal] = useState("");
  const [branches, setBranches] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [coaches, setCoaches] = useState<
    Array<{
      id: number;
      firstName: string;
      lastName?: string;
      branchId?: number;
    }>
  >([]);
  const [branchId, setBranchId] = useState<number | undefined>(undefined);
  const [coachId, setCoachId] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(
          `/api/organization/dashboard/branches?orgSlug=${encodeURIComponent(
            orgSlug
          )}`,
          { credentials: "include" }
        );
        if (r.ok) {
          const j = await r.json();
          if (!mounted) return;
          setBranches(
            (j?.branches || []).map((b: any) => ({ id: b.id, name: b.name }))
          );
        }
      } catch (e) {}
    })();
    (async () => {
      try {
        const r = await fetch(
          `/api/organization/management/v1/professionals/list?orgSlug=${encodeURIComponent(
            orgSlug
          )}`,
          { credentials: "include" }
        );
        if (r.ok) {
          const j = await r.json();
          if (!mounted) return;
          setCoaches(
            (j?.professionals || [])
              .filter((p: any) => (p.type || "").toLowerCase() === "coach")
              .map((p: any) => ({
                id: p.id,
                firstName: p.firstName,
                lastName: p.lastName,
                branchId: p.branchId,
              }))
          );
        }
      } catch (e) {}
    })();
    return () => {
      mounted = false;
    };
  }, [orgSlug]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!firstName) return toast.error("Nombre requerido");
    setSubmitting(true);
    try {
      const payload: any = { firstName, lastName };
      if (emailLocal) payload.email = emailLocal;
      if (branchId) payload.branchId = branchId;
      if (coachId) payload.coachId = coachId;

      const res = await fetch(
        `/api/organization/operations/clients?orgSlug=${encodeURIComponent(
          orgSlug
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j?.error || "Error al crear cliente");
        return;
      }
      toast.success("Cliente creado");
      setFirstName("");
      setLastName("");
      setEmailLocal("");
      setBranchId(undefined);
      setCoachId(undefined);
      onCreated?.();
    } catch (err) {
      console.error(err);
      toast.error("Error de red");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-sm block">Nombre</label>
        <input
          className="mt-1 w-full"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm block">Apellido</label>
        <input
          className="mt-1 w-full"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm block">Email (opcional)</label>
        <input
          className="mt-1 w-full"
          value={emailLocal}
          onChange={(e) => setEmailLocal(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm block">Sucursal (opcional)</label>
        <select
          className="mt-1 w-full"
          value={branchId ?? ""}
          onChange={(e) =>
            setBranchId(e.target.value ? Number(e.target.value) : undefined)
          }
        >
          <option value="">— Ninguna —</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm block">Asignar coach (opcional)</label>
        <select
          className="mt-1 w-full"
          value={coachId ?? ""}
          onChange={(e) =>
            setCoachId(e.target.value ? Number(e.target.value) : undefined)
          }
        >
          <option value="">— Ninguno —</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName ? c.lastName : ""}
              {c.branchId
                ? ` — ${
                    branches.find((b) => b.id === c.branchId)?.name ??
                    "Sucursal"
                  }`
                : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-3 py-1 rounded bg-primary-600 text-white"
          disabled={submitting}
        >
          {submitting ? "Creando..." : "Crear cliente"}
        </button>
      </div>
    </form>
  );
}
