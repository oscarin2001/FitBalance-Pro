"use client";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ProfessionalRow from "./ProfessionalRow";
import { Professional } from "./types";

export default function ProfessionalTable({
  items,
  showSkeleton,
  emptyCopy,
  onEdit,
  onDelete,
  onSendInvite,
  inviteLoadingId,
}: {
  items: Professional[];
  showSkeleton: boolean;
  emptyCopy: string;
  onEdit: (p: Professional) => void;
  onDelete: (id: number) => void;
  onSendInvite: (p: Professional) => void;
  inviteLoadingId: number | null;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="pb-2">Profesional</th>
            <th className="pb-2">Rol</th>
            <th className="pb-2">Tipo</th>
            <th className="pb-2">Estado</th>
            <th className="pb-2">Invitación</th>
            <th className="pb-2">Creado por</th>
            <th className="pb-2">Actualizado por</th>
            <th className="pb-2 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {showSkeleton
            ? Array.from({ length: 4 }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  <td className="py-4" colSpan={8}>
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))
            : null}

          {!showSkeleton && items.length === 0 ? (
            <tr>
              <td
                className="py-8 text-center text-muted-foreground"
                colSpan={8}
              >
                {emptyCopy}
              </td>
            </tr>
          ) : null}

          {!showSkeleton &&
            items.map((professional) => (
              <ProfessionalRow
                key={professional.id}
                professional={professional}
                onEdit={onEdit}
                onDelete={onDelete}
                onSendInvite={onSendInvite}
                inviteLoadingId={inviteLoadingId}
              />
            ))}
        </tbody>
      </table>
    </div>
  );
}
