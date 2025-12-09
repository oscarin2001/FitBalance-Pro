"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import ProfessionalTable from "./table/ProfessionalTable";
import QuickActions from "./QuickActions";
import PendingInvites from "./PendingInvites";
import EditProfessionalDialog from "./EditProfessionalDialog";
import useProfessionals from "./lib/useProfessionals";
import { Professional, ProfessionalTypeFilter } from "./lib/types";
import { formatName, typeLabels, typePluralLabels } from "./lib/utils";

type AuditReference =
  | string
  | {
      name?: string | null;
      email?: string | null;
    }
  | null;

type ProfessionalStatus = "active" | "inactive";
type InvitationStatus = "pending" | "sent" | "accepted" | "expired";
type ProfessionalTypeFilterLocal = "coach" | "nutritionist";

type ProfessionalLocal = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  type: string | null;
  role: string | null;
  branchId?: number | null;
};

// Keep the long version as a legacy reference. Export named component to avoid conflicts.
export function ProfessionalListLegacy({
  orgSlug,
  typeFilter,
}: {
  orgSlug: string;
  typeFilter?: ProfessionalTypeFilterLocal;
}) {
  const [items, setItems] = useState<ProfessionalLocal[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<ProfessionalLocal | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [inviteLoadingId, setInviteLoadingId] = useState<number | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [banner, setBanner] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [branchId, setBranchId] = useState<number | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/organization/management/v1/professionals/list?orgSlug=${encodeURIComponent(
          orgSlug
        )}`
      );
      if (!res.ok)
        throw new Error("No pudimos cargar los profesionales del espacio.");
      const data = await res.json();
      const itemsData = data?.professionals || data || [];
      setItems(itemsData);
    } catch (error) {
      console.error(error);
      setBanner({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Hubo un problema al sincronizar la lista.",
      });
    } finally {
      setLoading(false);
    }
  }, [orgSlug]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleCreateSuccess = useCallback(
    async (kind: ProfessionalTypeFilterLocal) => {
      await fetchList();
      setBanner({
        tone: "success",
        text:
          kind === "coach"
            ? "Agregamos un coach al directorio."
            : "Agregamos una nutricionista al directorio.",
      });
    },
    [fetchList]
  );

  const normalizedTypeFilter = typeFilter;

  const typeFilteredItems = useMemo(() => {
    if (!normalizedTypeFilter) return items;
    return items.filter(
      (item) => (item.type ?? "").toLowerCase() === normalizedTypeFilter
    );
  }, [items, normalizedTypeFilter]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return typeFilteredItems;
    return typeFilteredItems.filter((item) =>
      [
        formatName(item).toLowerCase(),
        item.email?.toLowerCase(),
        item.phone?.toLowerCase(),
        String(item.id),
      ].some((value) => value?.includes(normalizedSearch))
    );
  }, [typeFilteredItems, searchTerm]);

  const pendingInvites = useMemo(
    () =>
      typeFilteredItems.filter((pro) => {
        const normalized = (pro as any).invitationStatus ?? "";
        return ["pending", "sent"].includes(String(normalized).toLowerCase());
      }),
    [typeFilteredItems]
  );

  const openEdit = (professional: ProfessionalLocal) => {
    setEditing(professional);
    setFirstName(professional.firstName ?? "");
    setLastName(professional.lastName ?? "");
    setPhone(professional.phone ?? "");
    setBranchId(professional.branchId ?? null);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      const res = await fetch(
        `/api/organization/management/v1/professionals/${
          editing.id
        }?orgSlug=${encodeURIComponent(orgSlug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName, lastName, phone, branchId }),
        }
      );
      if (!res.ok) throw new Error("No pudimos guardar los cambios.");
      setBanner({
        tone: "success",
        text: `Actualizamos a ${formatName(editing)}.`,
      });
      setEditing(null);
      await fetchList();
    } catch (error) {
      console.error(error);
      setBanner({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Error al actualizar el profesional.",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("Eliminar profesional? Esta acción no se puede deshacer."))
      return;
    try {
      const res = await fetch(
        `/api/organization/management/v1/professionals/${id}?orgSlug=${encodeURIComponent(
          orgSlug
        )}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("No se pudo eliminar el profesional.");
      setBanner({
        tone: "success",
        text: "Profesional eliminado correctamente.",
      });
      await fetchList();
    } catch (error) {
      console.error(error);
      setBanner({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Error al eliminar el profesional.",
      });
    }
  };

  const handleSendInvite = async (professional: ProfessionalLocal) => {
    setInviteLoadingId(professional.id);
    try {
      const res = await fetch(
        `/api/organization/management/v1/professionals/${
          professional.id
        }/invite?orgSlug=${encodeURIComponent(orgSlug)}`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("No se pudo enviar la invitación.");
      setBanner({
        tone: "success",
        text: `Invitación enviada a ${professional.email ?? "el profesional"}.`,
      });
      await fetchList();
    } catch (error) {
      console.error(error);
      setBanner({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Error al enviar la invitación.",
      });
    } finally {
      setInviteLoadingId(null);
    }
  };

  const showSkeleton = loading && items.length === 0;
  const baseHref = `/${orgSlug}/professionals`;
  const coachHref = `${baseHref}?type=coach`;
  const nutritionistHref = `${baseHref}?type=nutritionist`;
  const directoryTitle = typeFilter
    ? `Directorio de ${
        typePluralLabels[typeFilter as keyof typeof typePluralLabels]
      }`
    : "Directorio de profesionales";

  return (
    <div className="space-y-6">
      {banner ? (
        <div
          className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${
            banner.tone === "error"
              ? "border-destructive/40 bg-destructive/5 text-destructive"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          <span>{banner.text}</span>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[3fr_1.3fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>{directoryTitle}</CardTitle>
                <CardDescription>Versión legacy del listado</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ProfessionalTable
              items={filteredItems}
              showSkeleton={showSkeleton}
              emptyCopy={"No data"}
              onEdit={openEdit}
              onDelete={onDelete}
              onSendInvite={handleSendInvite}
              inviteLoadingId={inviteLoadingId}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <QuickActions
            orgSlug={orgSlug}
            showCoachForm={Boolean(typeFilter === "coach")}
            showNutritionistForm={Boolean(typeFilter === "nutritionist")}
            coachHref={coachHref}
            nutritionistHref={nutritionistHref}
            onCreateSuccess={handleCreateSuccess}
          />
          <Card>
            <CardHeader>
              <CardTitle>Invitaciones (legacy)</CardTitle>
            </CardHeader>
            <CardContent>
              <PendingInvites
                pendingInvites={pendingInvites}
                onResend={handleSendInvite}
                inviteLoadingId={inviteLoadingId}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <EditProfessionalDialog
        editing={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => !open && !savingEdit && setEditing(null)}
        firstName={firstName}
        lastName={lastName}
        phone={phone}
        setFirstName={setFirstName}
        setLastName={setLastName}
        setPhone={setPhone}
        branchId={branchId}
        setBranchId={setBranchId}
        onSave={saveEdit}
        saving={savingEdit}
        orgSlug={orgSlug}
      />
    </div>
  );
}
