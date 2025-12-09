"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

type ProfessionalOption = {
  id: number;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
};

export default function BranchManagerSelect({
  orgSlug,
  branchId,
  currentManagerId,
  onUpdated,
}: {
  orgSlug: string;
  branchId: number | string;
  currentManagerId?: number | null;
  onUpdated?: (updated: {
    managerProfessionalId?: number | null;
    managerName?: string | null;
  }) => void;
}) {
  const [options, setOptions] = useState<ProfessionalOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState<string>(
    currentManagerId ? String(currentManagerId) : ""
  );

  useEffect(() => {
    setValue(currentManagerId ? String(currentManagerId) : "");
  }, [currentManagerId]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/organization/management/v1/professionals/list?orgSlug=${encodeURIComponent(
            orgSlug
          )}`,
          { credentials: "include" }
        );
        if (!mounted) return;
        if (!res.ok) {
          console.error("Failed to load professionals", res.status);
          return;
        }
        const json = await res.json();
        const list = json?.professionals || json || [];
        setOptions(
          (list as any).map((p: any) => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            email: p.email,
          }))
        );
      } catch (err) {
        console.error("BranchManagerSelect load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [orgSlug]);

  async function save(newValue: string) {
    setSaving(true);
    try {
      const body: { professionalId: number | null } = { professionalId: null };
      if (newValue) body.professionalId = Number(newValue);

      const res = await fetch(
        `/api/organization/operations/branches/${branchId}/manager?orgSlug=${encodeURIComponent(
          orgSlug
        )}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
        }
      );

      if (!res.ok) {
        let errMsg = "Error al asignar encargado";
        try {
          const j = await res.json();
          errMsg = j?.error || errMsg;
        } catch (_) {}
        toast.error(errMsg);
        return;
      }

      // determine managerName from options if possible
      let managerName: string | null = null;
      if (body.professionalId) {
        const found = options.find((o) => o.id === body.professionalId);
        if (found)
          managerName = `${found.firstName}${
            found.lastName ? ` ${found.lastName}` : ""
          }`;
      }

      toast.success(
        body.professionalId ? "Encargado asignado" : "Encargado desasignado"
      );
      onUpdated?.({ managerProfessionalId: body.professionalId, managerName });
    } catch (err) {
      console.error(err);
      toast.error("Error de red al asignar encargado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="rounded border bg-white px-2 py-1 text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={async (e) => {
          await save(e.currentTarget.value);
        }}
        disabled={loading || saving}
      >
        <option value="">— Ninguno —</option>
        {options.map((o) => (
          <option key={o.id} value={String(o.id)}>
            {o.firstName} {o.lastName ? o.lastName : ""}{" "}
            {o.email ? `(${o.email})` : ""}
          </option>
        ))}
      </select>
      {saving && (
        <span className="text-xs text-muted-foreground">Guardando...</span>
      )}
    </div>
  );
}
