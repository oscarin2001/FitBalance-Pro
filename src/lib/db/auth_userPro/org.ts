export type OrgType =
  | "GYM"
  | "CLINICA"
  | "CONSULTORIO"
  | "EMPRESA_BIENESTAR"
  | "MARCA_SUPLEMENTOS"
  | "OTRA";

export const ORG_TYPES: { code: OrgType; label: string; hint: string }[] = [
  { code: "GYM", label: "Gimnasio", hint: "Gestiona coaches, clases y planes físicos + nutrición." },
  { code: "CLINICA", label: "Clínica / Centro de salud", hint: "Equipo de profesionales con pacientes y protocolos." },
  { code: "CONSULTORIO", label: "Consultorio", hint: "Profesional o pequeño equipo con pacientes propios." },
  { code: "EMPRESA_BIENESTAR", label: "Empresa (bienestar)", hint: "Programas para empleados (nutrición, actividad, retos)." },
  { code: "MARCA_SUPLEMENTOS", label: "Marca de suplementos", hint: "Vende productos y ofrece dietas/seguimientos." },
  { code: "OTRA", label: "Otra", hint: "Personaliza tu flujo para un caso distinto." },
];

export type OrgRole =
  | "OWNER"
  | "ADMIN"
  | "NUTRICIONISTA"
  | "COACH"
  | "STAFF"
  | "VIEWER";

export const DEFAULT_ROLES: OrgRole[] = [
  "OWNER",
  "ADMIN",
  "NUTRICIONISTA",
  "COACH",
  "STAFF",
  "VIEWER",
];

export function orgDefaultMetadata(orgType: OrgType) {
  return {
    type: orgType,
    roles: DEFAULT_ROLES,
    createdAt: new Date().toISOString(),
  } as const;
}
