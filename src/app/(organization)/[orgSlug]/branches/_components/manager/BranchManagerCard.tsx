"use client";
import React from "react";
import BranchManagerSelect from "../BranchManagerSelect";

export default function BranchManagerCard({
  orgSlug,
  branch,
  onUpdated,
}: {
  orgSlug: string;
  branch: any;
  onUpdated?: (b: any) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 border rounded">
      <div>
        <div className="font-medium">{branch.name}</div>
        <div className="text-sm text-muted-foreground">
          {branch.city || "—"}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {branch.managerName ? (
            <span className="inline-block rounded px-2 py-0.5 bg-muted/50 text-xs">
              Encargado: {branch.managerName}
            </span>
          ) : (
            <span className="inline-block rounded px-2 py-0.5 bg-muted/20 text-xs">
              Sin encargado
            </span>
          )}
        </div>
      </div>
      <div className="ml-auto">
        <BranchManagerSelect
          orgSlug={orgSlug}
          branchId={Number(branch.id)}
          currentManagerId={branch.managerProfessionalId ?? null}
          onUpdated={(updated) => onUpdated?.(updated)}
        />
      </div>
    </div>
  );
}
