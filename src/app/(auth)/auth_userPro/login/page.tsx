"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LoginForm } from "@/components/login-form";
import {
  LATAM_COUNTRIES,
  LATAM_BY_CODE,
  normalizePhone,
} from "@/lib/db/auth_userPro/latam";
import type { LatamCountry } from "@/lib/db/auth_userPro/latam";
import RoleStep from "../flow/RoleStep";
import UsageStep from "../flow/UsageStep";
import BranchStep from "../flow/BranchStep";
import { ORG_TYPES } from "@/lib/db/auth_userPro/org";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [step, setStep] = useState<
    "login" | "usage" | "role" | "branches" | "basics"
  >("login");
  const [tipoProfesional, setTipoProfesional] = useState<
    "NUTRICIONISTA" | "COACH" | null
  >(null);
  const [usage, setUsage] = useState<"PERSONAL" | "ORGANIZACION" | null>(null);
  const [organizationName, setOrganizationName] = useState<string>("");
  const [branchConfig, setBranchConfig] = useState<{
    hasBranches: boolean;
    branches: {
      name: string;
      city: string;
      country: string;
      address?: string;
    }[];
  } | null>(null);
  const [orgType, setOrgType] = useState<string>("GYM");
  const [orgRole, setOrgRole] = useState<string>("OWNER");

  // Credenciales usadas en el login inicial, para poder reloguear al terminar el registro
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");

  const [countryCode, setCountryCode] = useState<string>("BO");
  const [phone, setPhone] = useState<string>("");
  const country = useMemo(() => LATAM_BY_CODE[countryCode], [countryCode]);

  async function onRegisterBasics(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(null);
    const form = e.currentTarget as HTMLFormElement;
    const entries = new FormData(form).entries();
    const data: Record<string, any> = {};
    for (const [k, v] of entries) data[k] = v;
    data.pais_code = countryCode;
    data.telefono = normalizePhone(countryCode, phone);
    try {
      const res = await fetch("/api/userPro/auth_pro/basics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tipo_profesional: tipoProfesional,
          usage,
          organizationName:
            usage === "ORGANIZACION" ? organizationName : undefined,
          orgType: usage === "ORGANIZACION" ? orgType : undefined,
          orgRole: usage === "ORGANIZACION" ? orgRole : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.error || "Error al guardar datos básicos");
      setOk("Datos guardados");
      // Si es organización y tenemos configuración de sucursales, guardarlas ahora
      if (usage === "ORGANIZACION" && json.orgSlug && branchConfig) {
        try {
          const branchesRes = await fetch(
            "/api/organization/onboarding/branches",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orgSlug: json.orgSlug,
                hasBranches: branchConfig.hasBranches,
                branches: branchConfig.branches,
              }),
            }
          );
          if (!branchesRes.ok) {
            const branchesJson = await branchesRes.json().catch(() => null);
            console.error(
              "Error al guardar sucursales",
              branchesJson || (await branchesRes.text())
            );
          }
        } catch (err) {
          console.error("Error de red al guardar sucursales", err);
        }
      }
      // Redirect to dashboards
      if (usage === "ORGANIZACION" && json.orgSlug) {
        router.push(`/${json.orgSlug}/dashboard`);
        return;
      }
      if (tipoProfesional === "NUTRICIONISTA") {
        router.push(`/nutritionist`);
      } else {
        router.push(`/coach`);
      }
    } catch (err: any) {
      setError(err?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function onLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(null);
    const form = e.currentTarget as HTMLFormElement;
    try {
      const email = (form.querySelector("#email") as HTMLInputElement)?.value;
      const password = (form.querySelector("#password") as HTMLInputElement)
        ?.value;
      setLoginEmail(email);
      setLoginPassword(password);
      const res = await fetch("/api/userPro/auth_pro/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Credenciales inválidas");
      // Después de login, comprobar si el usuario ya tiene organización
      try {
        const meRes = await fetch("/api/userPro/auth_pro/me", {
          method: "GET",
          credentials: "include",
        });
        const me = await meRes.json();
        if (
          meRes.ok &&
          me?.authenticated &&
          me?.hasOrganization &&
          me?.defaultOrgSlug
        ) {
          router.push(`/${me.defaultOrgSlug}/dashboard`);
          return;
        }
      } catch {
        // si falla, caemos al flujo normal de onboarding
      }

      setOk("Login exitoso. Indícanos cómo usarás FitBalance.");
      setStep("usage");
    } catch (err: any) {
      setError(err?.message || "Error de login");
    } finally {
      setLoading(false);
    }
  }

  // Paso derivado: después de login, exige elegir uso primero, luego rol, luego básicos
  const derivedStep: "login" | "usage" | "role" | "branches" | "basics" =
    ((): any => {
      if (step === "login") return "login";
      if (!usage) return "usage";
      if (!tipoProfesional) return "role";
      if (usage === "ORGANIZACION" && step !== "basics") return step;
      return "basics";
    })();

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-8 lg:px-12 lg:py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight text-emerald-700"
          >
            <span className="inline-block h-8 w-8 rounded bg-emerald-600" />
            <span>FitBalance</span>
          </Link>
        </div>
        <div className="w-full max-w-md mx-auto">
          {derivedStep !== "login" && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  if (derivedStep === "usage") setStep("login");
                  else if (derivedStep === "role") setStep("usage");
                  else if (derivedStep === "branches") setStep("usage");
                  else if (derivedStep === "basics")
                    setStep(usage === "ORGANIZACION" ? "branches" : "role");
                }}
                className="text-sm text-emerald-700 hover:underline"
              >
                ← Atrás
              </button>
            </div>
          )}
          {derivedStep === "login" && <LoginForm onSubmit={onLoginSubmit} />}

          {derivedStep === "usage" && (
            <UsageStep
              onSelect={(data) => {
                if (data.usage === "PERSONAL") {
                  setUsage("PERSONAL");
                  setOk(null);
                  setStep("role");
                } else {
                  setUsage("ORGANIZACION");
                  if (data.orgRole === "NUTRICIONISTA")
                    setTipoProfesional("NUTRICIONISTA");
                  else if (data.orgRole === "COACH")
                    setTipoProfesional("COACH");
                  else setTipoProfesional("COACH");
                  if (data.orgType) setOrgType(data.orgType);
                  setOk(null);
                  setStep("branches");
                }
              }}
            />
          )}

          {derivedStep === "role" && (
            <RoleStep
              onSelect={(role) => {
                setTipoProfesional(role);
                setStep("basics");
                setOk(null);
              }}
            />
          )}

          {derivedStep === "branches" && usage === "ORGANIZACION" && (
            <BranchStep
              loading={loading}
              onSubmit={async (payload) => {
                setOrganizationName(payload.organizationName);
                setBranchConfig({
                  hasBranches: payload.hasBranches,
                  branches: payload.branches,
                });
                setOk(null);
                setStep("basics");
              }}
            />
          )}

          {derivedStep === "basics" && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-semibold">Datos básicos</h1>
                <p className="text-sm text-slate-600">
                  {usage === "ORGANIZACION"
                    ? "Uso en organización"
                    : "Uso personal"}{" "}
                  ·{" "}
                  {tipoProfesional === "NUTRICIONISTA"
                    ? "Nutricionista"
                    : "Coach"}
                </p>
              </div>
              <form onSubmit={onRegisterBasics} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="nombre" className="text-sm font-medium">
                      Nombre
                    </label>
                    <input
                      id="nombre"
                      name="nombre"
                      required
                      className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="apellidos" className="text-sm font-medium">
                      Apellidos
                    </label>
                    <input
                      id="apellidos"
                      name="apellidos"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="genero" className="text-sm font-medium">
                      Género
                    </label>
                    <select
                      id="genero"
                      name="genero"
                      required
                      className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="edad" className="text-sm font-medium">
                      Edad
                    </label>
                    <input
                      id="edad"
                      name="edad"
                      type="number"
                      min={16}
                      max={100}
                      required
                      className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  {/* Perfil viene del paso anterior */}
                </div>
                {usage === "ORGANIZACION" && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label
                          htmlFor="organizationName"
                          className="text-sm font-medium"
                        >
                          Nombre de la organización
                        </label>
                        <input
                          id="organizationName"
                          name="organizationName"
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          placeholder="Ej. Clínica Vida"
                          className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm font-medium">
                          Tipo de organización
                        </span>
                        <div className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                          {ORG_TYPES.find((o) => o.code === orgType)?.label ||
                            orgType}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1 sm:col-span-2">
                        <span className="text-sm font-medium">
                          Tu rol en la organización
                        </span>
                        <div className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                          {orgRole === "OWNER"
                            ? "Dueño / Propietario"
                            : orgRole === "ADMIN"
                            ? "Administrador"
                            : orgRole === "NUTRICIONISTA"
                            ? "Nutricionista"
                            : "Coach"}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">
                      {ORG_TYPES.find((o) => o.code === orgType)?.hint}
                    </p>
                  </>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label htmlFor="pais_code" className="text-sm font-medium">
                      País
                    </label>
                    <select
                      id="pais_code"
                      name="pais_code"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {LATAM_COUNTRIES.map((c: LatamCountry) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="telefono" className="text-sm font-medium">
                      Teléfono
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-3 text-slate-600">
                        +{country?.prefix}
                      </span>
                      <input
                        id="telefono"
                        name="telefono"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Número"
                        className="w-full rounded-r-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                {ok && <p className="text-sm text-emerald-700">{ok}</p>}
                <button
                  disabled={loading}
                  className="w-full rounded-md bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <div className="relative hidden lg:block">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1964&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-emerald-900/30" />
      </div>
    </div>
  );
}
