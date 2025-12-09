"use client";
import React from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusPill from "./StatusPill";
import { Professional } from "../lib/types";
import {
  formatName,
  formatActor,
  formatDate,
  typeLabels,
  invitationLabelMap,
  invitationVariantMap,
  statusLabelMap,
  statusVariantMap,
  getInvitationStatus,
  getProfessionalStatus,
} from "../lib/utils";

export default function ProfessionalRow({
  professional,
  onEdit,
  onDelete,
  onSendInvite,
  inviteLoadingId,
}: {
  professional: Professional;
  onEdit: (p: Professional) => void;
  onDelete: (id: number) => void;
  onSendInvite: (p: Professional) => void;
  inviteLoadingId: number | null;
}) {
  const status = getProfessionalStatus(professional);
  const invitationState = getInvitationStatus(professional);
  const invitationLabel = invitationLabelMap[invitationState];
  const invitationVariant = invitationVariantMap[invitationState];
  const statusVariant = statusVariantMap[status];

  return (
    <tr key={professional.id}>
      <td className="py-4 align-top">
        <p className="font-semibold">{formatName(professional)}</p>
        <p className="text-xs text-muted-foreground">
          {professional.email ?? "Sin correo asignado"}
        </p>
        <p className="text-xs text-muted-foreground">
          {professional.phone ?? "Sin teléfono"}
        </p>
      </td>
      <td className="py-4 align-top">{professional.role ?? "Sin rol"}</td>
      <td className="py-4 align-top">
        {typeLabels[(professional.type ?? "").toLowerCase()] ?? "Sin tipo"}
      </td>
      <td className="py-4 align-top">
        <StatusPill variant={statusVariant}>
          {statusLabelMap[status]}
        </StatusPill>
      </td>
      <td className="py-4 align-top">
        <StatusPill variant={invitationVariant}>{invitationLabel}</StatusPill>
        <p className="mt-1 text-xs text-muted-foreground">
          {invitationState === "accepted"
            ? "El profesional ya inició sesión."
            : "Aún no acepta la invitación."}
        </p>
      </td>
      <td className="py-4 align-top">
        <p className="text-sm font-medium">
          {formatActor(professional.createdBy)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(professional.createdAt)}
        </p>
      </td>
      <td className="py-4 align-top">
        <p className="text-sm font-medium">
          {formatActor(professional.updatedBy)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(professional.updatedAt)}
        </p>
      </td>
      <td className="py-4 align-top">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(professional)}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onSendInvite(professional)}
            disabled={inviteLoadingId === professional.id}
          >
            <Send className="mr-1 h-4 w-4" />
            {invitationState === "accepted" ? "Reenviar" : "Enviar"}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(professional.id)}
          >
            Eliminar
          </Button>
        </div>
      </td>
    </tr>
  );
}
