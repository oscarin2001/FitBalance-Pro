import {
  Professional,
  AuditReference,
  InvitationStatus,
  ProfessionalStatus,
  PillVariant,
  ProfessionalTypeFilter,
} from "./types";

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const typeLabels: Record<string, string> = {
  coach: "Coach",
  nutritionist: "Nutricionista",
};

export const typePluralLabels: Record<ProfessionalTypeFilter, string> = {
  coach: "coaches",
  nutritionist: "nutricionistas",
};

export const invitationLabelMap: Record<InvitationStatus, string> = {
  accepted: "Aceptada",
  pending: "Pendiente",
  sent: "Enviada",
  expired: "Expirada",
};

export const statusLabelMap: Record<ProfessionalStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
};

export const invitationVariantMap: Record<InvitationStatus, PillVariant> = {
  accepted: "success",
  pending: "warning",
  sent: "warning",
  expired: "danger",
};

export const statusVariantMap: Record<ProfessionalStatus, PillVariant> = {
  active: "success",
  inactive: "muted",
};

export function formatName(professional: Professional) {
  const first = professional.firstName?.trim() ?? "";
  const last = professional.lastName?.trim() ?? "";
  const fallback = professional.email ?? `ID ${professional.id}`;
  const full = `${first} ${last}`.trim();
  return full.length > 0 ? full : fallback;
}

export function formatActor(actor?: AuditReference) {
  if (!actor) return "Sistema";
  if (typeof actor === "string") return actor;
  return actor.name || actor.email || "Sistema";
}

export function formatDate(value?: string | null) {
  if (!value) return "Sin registro";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sin registro";
  return dateFormatter.format(parsed);
}

export function getInvitationStatus(
  professional: Professional
): InvitationStatus {
  const normalized = (professional.invitationStatus ?? "").toLowerCase();
  if (normalized === "accepted") return "accepted";
  if (normalized === "sent") return "sent";
  if (normalized === "expired") return "expired";
  if (normalized === "pending") return "pending";
  if (
    professional.isActive ||
    (professional.status ?? "").toLowerCase() === "active"
  ) {
    return "accepted";
  }
  return "pending";
}

export function getProfessionalStatus(
  professional: Professional
): ProfessionalStatus {
  if (typeof professional.isActive === "boolean") {
    return professional.isActive ? "active" : "inactive";
  }
  const normalized = (professional.status ?? "").toLowerCase();
  if (normalized === "active") return "active";
  if (normalized === "inactive") return "inactive";
  return getInvitationStatus(professional) === "accepted"
    ? "active"
    : "inactive";
}
