"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  orgSlug: string;
};

export default function CreateClientModal({
  open,
  onClose,
  onCreated,
  orgSlug,
}: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailLocal, setEmailLocal] = useState("");
  const [email, setEmail] = useState(""); // full email if user types it
  const [domainError, setDomainError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [coaches, setCoaches] = useState<
    Array<{
      id: number;
      firstName: string;
      lastName?: string;
      branchId?: number;
      type?: string;
    }>
  >([]);
  const [branchId, setBranchId] = useState<number | undefined>(undefined);
  const [coachId, setCoachId] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // derive default domain from orgSlug (like other forms)
  const defaultDomain = (() => {
    if (!orgSlug) return undefined;
    const s = String(orgSlug).toLowerCase().trim();
    const cleaned = s.replace(/[^a-z0-9.-]/g, "");
    if (!cleaned) return undefined;
    if (cleaned.includes(".")) return cleaned;
    return `${cleaned}.com`;
  })();

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(
          `/api/organization/dashboard/branches?orgSlug=${encodeURIComponent(
            orgSlug
          )}`,
          { credentials: "include" }
        );
        if (!r.ok) return;
        const j = await r.json();
        if (!mounted) return;
        setBranches(
          (j?.branches || []).map((b: any) => ({ id: b.id, name: b.name }))
        );
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
        if (!r.ok) return;
        const j = await r.json();
        if (!mounted) return;
        // include both coaches and nutritionists so client can be assigned to either
        setCoaches(
          (j?.professionals || [])
            .filter((p: any) => {
              const t = (p.type || "").toLowerCase();
              return (
                t === "coach" || t === "nutritionist" || t === "nutricionista"
              );
            })
            .map((p: any) => ({
              id: p.id,
              firstName: p.firstName,
              lastName: p.lastName,
              branchId: p.branchId,
              type: p.type,
            }))
        );
      } catch (e) {}
    })();

    return () => {
      mounted = false;
    };
  }, [open, orgSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName) {
      setError("Nombre requerido");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // compose final email using domain rules (if org provides default domain)
      let finalEmail = "";
      const trimmedLocal = (emailLocal ?? "").trim();
      if (email && email.includes("@")) {
        const parts = email.split("@");
        const domain = parts.slice(1).join("@");
        if (
          defaultDomain &&
          domain.toLowerCase() !== defaultDomain.toLowerCase()
        ) {
          setDomainError(`El dominio debe ser @${defaultDomain}`);
          setSubmitting(false);
          return;
        }
        finalEmail = email;
      } else if (trimmedLocal) {
        finalEmail = defaultDomain
          ? `${trimmedLocal}@${defaultDomain}`
          : trimmedLocal;
      }

      const payload: any = { firstName, lastName };
      if (finalEmail) payload.email = finalEmail;
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
        const msg = j?.error || "Error al crear cliente";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Cliente creado");
      setFirstName("");
      setLastName("");
      setEmailLocal("");
      setEmail("");
      setDomainError(null);
      setBranchId(undefined);
      setCoachId(undefined);
      onCreated?.();
      onClose();
    } catch (err) {
      console.error(err);
      const msg = "Error de red";
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
          <h3 className="text-lg font-semibold">Agregar cliente</h3>
          <button aria-label="Cerrar" onClick={onClose} className="text-sm">
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm block">Nombre</label>
            <Input
              className="mt-1 w-full"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm block">Apellido</label>
            <Input
              className="mt-1 w-full"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm block">Email (opcional)</label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                className="w-full"
                type="text"
                placeholder={
                  defaultDomain
                    ? `usuario (se añadirá @${defaultDomain})`
                    : "usuario@tudominio.com"
                }
                value={emailLocal}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.includes("@")) {
                    setEmail(v);
                    const parts = v.split("@");
                    setEmailLocal(parts[0] ?? "");
                    const domain = parts.slice(1).join("@");
                    if (
                      defaultDomain &&
                      domain.toLowerCase() !== defaultDomain.toLowerCase()
                    ) {
                      setDomainError(`El dominio debe ser @${defaultDomain}`);
                    } else {
                      setDomainError(null);
                    }
                  } else {
                    setEmailLocal(v);
                    setEmail("");
                    setDomainError(null);
                  }
                }}
              />
              {defaultDomain ? (
                <span className="text-sm text-gray-700">@{defaultDomain}</span>
              ) : null}
            </div>
            {domainError && (
              <p className="text-xs text-destructive mt-1">{domainError}</p>
            )}
          </div>
          <div>
            <label className="text-sm block">Sucursal (opcional)</label>
            <select
              className="mt-1 w-full rounded border px-2 py-1"
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
            <label className="text-sm block">
              Asignar profesional (coach / nutricionista) (opcional)
            </label>
            <select
              className="mt-1 w-full rounded border px-2 py-1"
              value={coachId ?? ""}
              onChange={(e) =>
                setCoachId(e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">— Ninguno —</option>
              {coaches
                .filter((c) => (branchId ? c.branchId === branchId : true))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName ? c.lastName : ""}{" "}
                    {c.type ? ` — ${c.type}` : ""}
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
              {submitting ? "Creando..." : "Crear cliente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
