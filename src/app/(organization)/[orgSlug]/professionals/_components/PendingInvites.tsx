"use client";
import React from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Professional } from "./types";
import { formatName, formatDate } from "./utils";

export default function PendingInvites({
  pendingInvites,
  onResend,
  inviteLoadingId,
  typeFilter,
  typePluralLabel,
}: {
  pendingInvites: Professional[];
  onResend: (p: Professional) => void;
  inviteLoadingId: number | null;
  typeFilter?: string | undefined;
  typePluralLabel?: string | undefined;
}) {
  return (
    <div className="rounded-xl border-border/70">
      {pendingInvites.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {typeFilter
            ? `Sin invitaciones pendientes. Todos los ${typePluralLabel} están activos.`
            : "Sin invitaciones pendientes. Todo el equipo está activo."}
        </p>
      ) : (
        pendingInvites.map((professional) => (
          <div
            key={`pending-${professional.id}`}
            className="rounded-xl border border-border/70 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{formatName(professional)}</p>
                <p className="text-xs text-muted-foreground">
                  {professional.email ?? "Sin correo"}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onResend(professional)}
                disabled={inviteLoadingId === professional.id}
              >
                <Send className="mr-1 h-4 w-4" /> Reenviar
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Última actualización:{" "}
              {formatDate(professional.updatedAt ?? professional.createdAt)}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
