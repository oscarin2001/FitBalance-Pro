"use client";
import React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ProfessionalTable from "./ProfessionalTable";
import { Professional } from "./types";

export default function DirectoryCard({
  orgSlug,
  baseHref,
  searchTerm,
  setSearchTerm,
  fetchList,
  loading,
  filteredItems,
  openEdit,
  onDelete,
  handleSendInvite,
  inviteLoadingId,
  directoryTitle,
  directoryDescription,
  showSkeleton,
  emptyCopy,
}: {
  orgSlug: string;
  baseHref: string;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  fetchList: () => Promise<void> | void;
  loading: boolean;
  filteredItems: Professional[];
  openEdit: (p: Professional) => void;
  onDelete: (id: number) => void;
  handleSendInvite: (p: Professional) => void;
  inviteLoadingId: number | null;
  directoryTitle: string;
  directoryDescription?: string;
  showSkeleton?: boolean;
  emptyCopy: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{directoryTitle}</h3>
          {directoryDescription ? (
            <p className="text-sm text-muted-foreground">
              {directoryDescription}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2" />
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar por nombre, email o ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchList()}
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      <ProfessionalTable
        items={filteredItems}
        showSkeleton={Boolean(showSkeleton)}
        emptyCopy={emptyCopy}
        onEdit={openEdit}
        onDelete={onDelete}
        onSendInvite={handleSendInvite}
        inviteLoadingId={inviteLoadingId}
      />
    </div>
  );
}
