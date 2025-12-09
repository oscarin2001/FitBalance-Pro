export type AuditReference =
  | string
  | {
      name?: string | null;
      email?: string | null;
    }
  | null;

export type ProfessionalStatus = "active" | "inactive";
export type InvitationStatus = "pending" | "sent" | "accepted" | "expired";
export type ProfessionalTypeFilter = "coach" | "nutritionist";

export type Professional = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  type: string | null;
  role: string | null;
  status?: string | null;
  invitationStatus?: string | null;
  isActive?: boolean | null;
  createdBy?: AuditReference;
  updatedBy?: AuditReference;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PillVariant = "success" | "warning" | "muted" | "danger";
