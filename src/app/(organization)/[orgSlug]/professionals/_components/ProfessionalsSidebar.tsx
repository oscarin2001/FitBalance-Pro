"use client";
import React from "react";
import QuickActions from "./QuickActions";
import PendingInvites from "./PendingInvites";
import { ProfessionalTypeFilter, Professional } from "./lib/types";

type Props = {
  orgSlug: string;
  coachHref?: string;
  nutritionistHref?: string;
  onCreateSuccess?: (kind: ProfessionalTypeFilter) => void;
  pendingInvites?: Professional[];
  onResend?: (p: Professional) => void;
  inviteLoadingId?: number | null;
  typeFilter?: ProfessionalTypeFilter;
  onOpenCreate?: (type?: ProfessionalTypeFilter) => void;
};

export default function ProfessionalsSidebar({
  orgSlug,
  coachHref,
  nutritionistHref,
  onCreateSuccess,
  pendingInvites,
  onResend,
  inviteLoadingId,
  typeFilter,
  onOpenCreate,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="mb-4">
        {typeFilter === "coach" ? (
          <button
            className="w-full mb-2 px-3 py-2 rounded bg-primary-600 text-white"
            onClick={() => onOpenCreate?.("coach")}
          >
            Agregar coach
          </button>
        ) : typeFilter === "nutritionist" ? (
          <button
            className="w-full mb-2 px-3 py-2 rounded bg-primary-600 text-white"
            onClick={() => onOpenCreate?.("nutritionist")}
          >
            Agregar nutricionista
          </button>
        ) : (
          <div className="space-y-2">
            <button
              className="w-full px-3 py-2 rounded bg-primary-600 text-white"
              onClick={() => onOpenCreate?.()}
            >
              Agregar profesional
            </button>
            <div className="flex gap-2 mt-2">
              <button
                className="flex-1 px-2 py-1 rounded border"
                onClick={() => onOpenCreate?.("coach")}
              >
                Agregar coach
              </button>
              <button
                className="flex-1 px-2 py-1 rounded border"
                onClick={() => onOpenCreate?.("nutritionist")}
              >
                Agregar nutricionista
              </button>
            </div>
          </div>
        )}
      </div>

      <QuickActions
        orgSlug={orgSlug}
        typeFilter={typeFilter}
        onOpenCreate={onOpenCreate}
      />
      <PendingInvites
        pendingInvites={pendingInvites ?? []}
        onResend={onResend ?? (() => {})}
        inviteLoadingId={inviteLoadingId ?? null}
      />
    </div>
  );
}
