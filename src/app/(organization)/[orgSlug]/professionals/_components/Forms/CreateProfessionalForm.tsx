"use client";
import React, { useState } from "react";
import { ProfessionalTypeFilter } from "../lib/types";

type Props = {
  type?: ProfessionalTypeFilter;
  initial?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  orgSlug: string;
  onSubmit: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    type?: ProfessionalTypeFilter;
  }) => Promise<void> | void;
  onCancel?: () => void;
};

export default function CreateProfessionalForm({
  type,
  initial,
  orgSlug,
  onSubmit,
  onCancel,
}: Props) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [emailLocal, setEmailLocal] = useState(() => {
    const e = initial?.email ?? "";
    if (!e) return "";
    const parts = String(e).split("@");
    return parts[0] ?? "";
  });
  const [domainError, setDomainError] = useState<string | null>(null);
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [gender, setGender] = useState<string | undefined>(undefined);
  const [birthDate, setBirthDate] = useState<string | undefined>(undefined);
  const [branchId, setBranchId] = useState<number | undefined>(undefined);
  const [createWithPassword, setCreateWithPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [nutritionistSubtype, setNutritionistSubtype] = useState<
    string | undefined
  >(undefined);
  const [branches, setBranches] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [submitting, setSubmitting] = useState(false);

  // derive domain from orgSlug, e.g. 'diegogym' -> 'diegogym.com'
  const defaultDomain = (() => {
    if (!orgSlug) return undefined;
    const s = String(orgSlug).toLowerCase().trim();
    const cleaned = s.replace(/[^a-z0-9.-]/g, "");
    if (!cleaned) return undefined;
    if (cleaned.includes(".")) return cleaned;
    return `${cleaned}.com`;
  })();

  // load branches for selection
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/organization/dashboard/branches?orgSlug=${encodeURIComponent(
            orgSlug
          )}`,
          { credentials: "include" }
        );
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setBranches(
          (json?.branches || []).map((b: any) => ({ id: b.id, name: b.name }))
        );
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [orgSlug]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!firstName || !lastName) return;
    setSubmitting(true);
    try {
      // Compose/validate final email using the organization's domain
      let finalEmail = "";
      const trimmed = (emailLocal ?? "").trim();
      if (!trimmed) {
        setDomainError("Introduce la parte local del email antes de enviar.");
        setSubmitting(false);
        return;
      }
      // If user typed a full email into the original `email` (rare), allow it only if domain matches
      if (email && email.includes("@")) {
        const parts = email.split("@");
        const local = parts[0] || "";
        const domain = parts.slice(1).join("@");
        if (!defaultDomain) {
          finalEmail = email;
        } else if (domain.toLowerCase() !== defaultDomain.toLowerCase()) {
          setDomainError(`El dominio debe ser @${defaultDomain}`);
          setSubmitting(false);
          return;
        } else {
          finalEmail = `${local}@${domain}`;
        }
      } else {
        finalEmail = `${trimmed}@${defaultDomain ?? ""}`;
      }
      setDomainError(null);

      const payload: any = {
        firstName,
        lastName,
        email: finalEmail,
        phone,
        type,
      };
      if (gender) payload.gender = gender;
      if (birthDate) payload.birthDate = birthDate;
      if (branchId) payload.branchId = branchId;
      if (createWithPassword && password) payload.password = password;
      if (type === "nutritionist" && nutritionistSubtype)
        payload.nutritionistSubtype = nutritionistSubtype;
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

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
        <label className="text-sm block">Email</label>
        <div className="mt-1 flex items-center gap-2">
          <input
            className="w-full"
            value={emailLocal}
            onChange={(e) => {
              // allow users to paste full emails — capture into `email` if contains @
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
            placeholder={
              defaultDomain
                ? `usuario (se añadirá @${defaultDomain})`
                : "usuario"
            }
            aria-describedby={defaultDomain ? "email-hint" : undefined}
          />
          {defaultDomain ? (
            <span className="text-sm text-gray-700">@{defaultDomain}</span>
          ) : null}
        </div>
        <p id="email-hint" className="text-sm text-gray-600 mt-2">
          {defaultDomain ? (
            <>
              El correo se creará con el dominio{" "}
              <strong>@{defaultDomain}</strong>. No se permiten otros dominios.
            </>
          ) : (
            <>
              Recomendamos usar el email corporativo (p. ej.
              usuario@tudominio.com) para que el profesional quede ligado al
              espacio.
            </>
          )}
        </p>
        {domainError ? (
          <p className="text-sm text-destructive mt-1">{domainError}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm block">Género</label>
          <select
            className="mt-1 w-full"
            value={gender ?? ""}
            onChange={(e) => setGender(e.target.value || undefined)}
          >
            <option value="">--</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
            <option value="O">Otro</option>
          </select>
        </div>
        <div>
          <label className="text-sm block">Fecha de nacimiento</label>
          <input
            type="date"
            className="mt-1 w-full"
            value={birthDate ?? ""}
            onChange={(e) => setBirthDate(e.target.value || undefined)}
          />
        </div>
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
          <option value="">--</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name || `Sucursal ${b.id}`}
            </option>
          ))}
        </select>
      </div>

      {type === "nutritionist" && (
        <div>
          <label className="text-sm block">
            Tipo de nutricionista (opcional)
          </label>
          <select
            className="mt-1 w-full"
            value={nutritionistSubtype ?? ""}
            onChange={(e) =>
              setNutritionistSubtype(e.target.value || undefined)
            }
          >
            <option value="">--</option>
            <option value="CLINICAL">Clínico</option>
            <option value="SPORTS">Deportivo</option>
            <option value="PEDIATRIC">Pediátrico</option>
          </select>
        </div>
      )}

      <div>
        <label className="text-sm block">Teléfono (opcional)</label>
        <input
          className="mt-1 w-full"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            id="create-with-password"
            type="checkbox"
            checked={createWithPassword}
            onChange={(e) => setCreateWithPassword(e.target.checked)}
          />
          <label htmlFor="create-with-password" className="text-sm">
            Crear cuenta con contraseña (si se activa se ignorará la invitación)
          </label>
        </div>
        {createWithPassword && (
          <div>
            <label className="text-sm block">Contraseña</label>
            <input
              type="password"
              className="mt-1 w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}

        <div className="flex gap-2 justify-end">
          {onCancel ? (
            <button
              type="button"
              className="px-3 py-1 rounded bg-gray-100"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancelar
            </button>
          ) : null}
          <button
            type="submit"
            className="px-3 py-1 rounded bg-primary-600 text-white"
            disabled={submitting}
          >
            {submitting
              ? "Creando..."
              : type
              ? `Agregar ${type === "nutritionist" ? "nutricionista" : type}`
              : "Agregar profesional"}
          </button>
        </div>
      </div>
    </form>
  );
}
