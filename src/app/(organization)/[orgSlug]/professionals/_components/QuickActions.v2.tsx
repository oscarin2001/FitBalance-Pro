"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProfessionalTypeFilter } from "./lib/types";

type Props = {
  orgSlug: string;
  typeFilter?: ProfessionalTypeFilter;
  onOpenCreate?: (type?: ProfessionalTypeFilter) => void;
};

export default function QuickActionsV2({
  orgSlug,
  typeFilter,
  onOpenCreate,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-3 shadow-sm">
        <h4 className="text-sm font-medium">Acciones</h4>
        <p className="text-sm text-muted-foreground">Gestiones rápidas</p>
        <div className="mt-2 flex flex-col gap-2">
          {typeFilter ? (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onOpenCreate?.(typeFilter)}
            >
              {typeFilter === "nutritionist"
                ? "Agregar nutricionista"
                : `Agregar ${typeFilter}`}
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                className="w-full"
                onClick={() => onOpenCreate?.("coach")}
              >
                Agregar coach
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full"
                onClick={() => onOpenCreate?.("nutritionist")}
              >
                Agregar nutricionista
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
