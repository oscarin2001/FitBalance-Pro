"use client";
import React from "react";
import CreateProfessionalForm from "./CreateProfessionalForm";
import { ProfessionalTypeFilter } from "../lib/types";

type Props = {
  open: boolean;
  type?: ProfessionalTypeFilter;
  onClose: () => void;
  onCreated?: () => void;
  onCreate: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    type?: ProfessionalTypeFilter;
  }) => Promise<void> | void;
  orgSlug: string;
};

export default function CreateProfessionalModal({
  open,
  type,
  onClose,
  onCreated,
  onCreate,
  orgSlug,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded shadow p-6 z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {type ? `Agregar ${type}` : "Agregar profesional"}
          </h3>
          <button aria-label="Cerrar" onClick={onClose} className="text-sm">
            Cerrar
          </button>
        </div>

        <CreateProfessionalForm
          orgSlug={orgSlug}
          type={type}
          onCancel={onClose}
          onSubmit={async (payload) => {
            await onCreate(payload);
            onCreated?.();
          }}
        />
      </div>
    </div>
  );
}
