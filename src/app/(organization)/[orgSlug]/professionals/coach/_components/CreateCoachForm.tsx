"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type FeedbackState = {
  tone: "success" | "error";
  text: string;
};

type CreateCoachFormProps = {
  orgSlug: string;
  redirectPath?: string;
  onSuccess?: () => Promise<void> | void;
};

export default function CreateCoachForm({
  orgSlug,
  redirectPath,
  onSuccess,
}: CreateCoachFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [emailLocal, setEmailLocal] = useState("");
  const [domainError, setDomainError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<string | undefined>(undefined);
  const [birthDate, setBirthDate] = useState<string | undefined>(undefined);
  const [branchId, setBranchId] = useState<number | undefined>(undefined);
  const [createWithPassword, setCreateWithPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [branches, setBranches] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  // derive domain from orgSlug, e.g. 'diegogym' -> 'diegogym.com'
  const defaultDomain = (() => {
    if (!orgSlug) return undefined;
    const s = String(orgSlug).toLowerCase().trim();
    const cleaned = s.replace(/[^a-z0-9.-]/g, "");
    if (!cleaned) return undefined;
    if (cleaned.includes(".")) return cleaned;
    return `${cleaned}.com`;
  })();

  const emailInvalid =
    (email.trim().length > 0 && !EMAIL_REGEX.test(email.trim())) ||
    (emailLocal.trim().length > 0 && /\s/.test(emailLocal));
  const firstNameMissing = firstName.trim().length === 0;
  const missingEmailLocal =
    emailLocal.trim().length === 0 && email.trim().length === 0;
  const disableSubmit = loading || firstNameMissing || missingEmailLocal;

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgSlug)
      return setFeedback({
        tone: "error",
        text: "Falta el identificador del espacio.",
      });
    setLoading(true);
    setFeedback(null);
    try {
      // Compose/validate final email using the organization's domain
      let finalEmail = "";
      const trimmed = (emailLocal ?? "").trim();
      if (!trimmed) {
        setDomainError("Introduce la parte local del email antes de enviar.");
        setLoading(false);
        return;
      }
      if (email && email.includes("@")) {
        const parts = email.split("@");
        const domain = parts.slice(1).join("@");
        if (domain.toLowerCase() !== defaultDomain?.toLowerCase()) {
          setDomainError(`El dominio debe ser @${defaultDomain}`);
          setLoading(false);
          return;
        }
        finalEmail = email;
      } else {
        finalEmail = `${trimmed}@${defaultDomain ?? ""}`;
      }
      setDomainError(null);

      const payload: any = { firstName, lastName, email: finalEmail, phone };
      if (gender) payload.gender = gender;
      if (birthDate) payload.birthDate = birthDate;
      if (branchId) payload.branchId = branchId;
      if (createWithPassword && password) payload.password = password;

      const res = await fetch(
        `/api/organization/create_user_in_organization/coach/create?orgSlug=${encodeURIComponent(
          orgSlug
        )}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "failed");
      setFeedback({ tone: "success", text: "Coach creado correctamente" });
      if (onSuccess) {
        await onSuccess();
      }
      if (redirectPath) {
        router.push(redirectPath);
      }
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
    } catch (err: any) {
      console.error(err);
      setFeedback({
        tone: "error",
        text: err?.message || "Error inesperado",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle>Nuevo coach</CardTitle>
        <CardDescription>
          Registra especialistas de entrenamiento, sincroniza permisos y
          habilita el cobro dentro de la organización.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="coach-first-name">Nombre</Label>
              <Input
                id="coach-first-name"
                placeholder="Ariel"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coach-last-name">Apellido</Label>
              <Input
                id="coach-last-name"
                placeholder="Campos"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-sm block">Género</Label>
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
              <Label className="text-sm block">Fecha de nacimiento</Label>
              <input
                type="date"
                className="mt-1 w-full"
                value={birthDate ?? ""}
                onChange={(e) => setBirthDate(e.target.value || undefined)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="coach-email">Email</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  id="coach-email"
                  type="text"
                  placeholder={
                    defaultDomain
                      ? `usuario (se añadirá @${defaultDomain})`
                      : "coach@tudogym.com"
                  }
                  value={emailLocal}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.includes("@")) {
                      setEmail(v);
                      const parts = v.split("@");
                      setEmailLocal(parts[0] ?? "");
                      // validate domain immediately
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
                  autoComplete="email"
                  aria-invalid={emailInvalid}
                  aria-describedby={
                    defaultDomain ? "coach-email-hint" : undefined
                  }
                />
                {defaultDomain ? (
                  <span className="text-sm text-gray-700">
                    @{defaultDomain}
                  </span>
                ) : null}
              </div>
              {emailInvalid && (
                <p className="text-xs text-destructive" role="alert">
                  Introduce un email válido.
                </p>
              )}
              <p id="coach-email-hint" className="text-sm text-gray-600 mt-2">
                {defaultDomain ? (
                  <>
                    El correo se creará con el dominio{" "}
                    <strong>@{defaultDomain}</strong>. No se permiten otros
                    dominios.
                  </>
                ) : (
                  <>
                    Recomendamos usar el email corporativo (p. ej.
                    usuario@tudominio.com) para que el profesional quede ligado
                    al espacio.
                  </>
                )}
              </p>
              {domainError ? (
                <p className="text-sm text-destructive mt-1">{domainError}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coach-phone">Teléfono</Label>
              <Input
                id="coach-phone"
                type="tel"
                placeholder="+34 655 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
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

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                id="create-with-password"
                type="checkbox"
                checked={createWithPassword}
                onChange={(e) => setCreateWithPassword(e.target.checked)}
              />
              <label htmlFor="create-with-password" className="text-sm">
                Crear cuenta con contraseña (si se activa se ignorará la
                invitación)
              </label>
            </div>
            {createWithPassword && (
              <div>
                <Label className="text-sm block">Contraseña</Label>
                <input
                  type="password"
                  className="mt-1 w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button type="submit" disabled={disableSubmit}>
              {loading ? "Guardando..." : "Agregar coach"}
            </Button>
            {feedback && (
              <p
                className={`text-sm ${
                  feedback.tone === "error"
                    ? "text-destructive"
                    : "text-emerald-600"
                }`}
                aria-live="polite"
              >
                {feedback.text}
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
