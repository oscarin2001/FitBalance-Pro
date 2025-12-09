"use client";
import { useCallback, useEffect, useState } from "react";
import { Professional, ProfessionalTypeFilter } from "./types";
import { formatName } from "./utils";

export default function useProfessionals(orgSlug: string) {
  const [items, setItems] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [inviteLoadingId, setInviteLoadingId] = useState<number | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [banner, setBanner] = useState<null | {
    tone: "success" | "error";
    text: string;
  }>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/organization/management/v1/professionals/list?orgSlug=${encodeURIComponent(
          orgSlug
        )}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        // If the user is not authorized, avoid showing the intrusive banner
        // near the top controls; let the page handle auth flows. For other
        // errors, show a friendly banner.
        if (res.status === 401) {
          console.warn("fetchList: unauthorized (401)");
          setItems([]);
          setBanner(null);
          return;
        }
        throw new Error("No pudimos cargar los profesionales del espacio.");
      }
      const data = await res.json();
      // Normalize response: API may return an array or an object with `items`/`data` keys.
      if (Array.isArray(data)) {
        setItems(data);
      } else if (data && Array.isArray((data as any).items)) {
        setItems((data as any).items);
      } else if (data && Array.isArray((data as any).data)) {
        setItems((data as any).data);
      } else if (data && Array.isArray((data as any).professionals)) {
        setItems((data as any).professionals);
      } else {
        setItems([]);
      }
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
    if (!orgSlug) return;
    fetchList();
  }, [fetchList, orgSlug]);

  const openEdit = (professional: Professional) => {
    setEditing(professional);
    setFirstName(professional.firstName ?? "");
    setLastName(professional.lastName ?? "");
    setPhone(professional.phone ?? "");
  };

  const closeEdit = () => setEditing(null);

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
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName, lastName, phone }),
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
        { method: "DELETE", credentials: "include" }
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

  const handleSendInvite = async (professional: Professional) => {
    setInviteLoadingId(professional.id);
    try {
      const res = await fetch(
        `/api/organization/management/v1/professionals/${
          professional.id
        }/invite?orgSlug=${encodeURIComponent(orgSlug)}`,
        { method: "POST", credentials: "include" }
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

  const handleCreateSuccess = async (kind: ProfessionalTypeFilter) => {
    await fetchList();
    setBanner({
      tone: "success",
      text:
        kind === "coach"
          ? "Agregamos un coach al directorio."
          : "Agregamos una nutricionista al directorio.",
    });
  };

  const createProfessional = async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    type?: ProfessionalTypeFilter;
  }) => {
    setSavingEdit(true);
    try {
      // Route to role-specific create endpoints when type is provided
      let res: Response;
      if (payload.type === "coach") {
        res = await fetch(
          `/api/organization/create_user_in_organization/coach/create?orgSlug=${encodeURIComponent(
            orgSlug
          )}`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      } else if (payload.type === "nutritionist") {
        res = await fetch(
          `/api/organization/create_user_in_organization/nutritionist/create?orgSlug=${encodeURIComponent(
            orgSlug
          )}`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      } else {
        // fallback: try management endpoint if exists
        res = await fetch(
          `/api/organization/management/v1/professionals?orgSlug=${encodeURIComponent(
            orgSlug
          )}`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "No se pudo crear el profesional.");
      }
      setBanner({
        tone: "success",
        text:
          payload.type === "coach"
            ? "Coach creado correctamente."
            : "Nutricionista creado correctamente.",
      });
      await fetchList();
    } catch (error) {
      console.error(error);
      setBanner({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Error al crear el profesional.",
      });
      throw error;
    } finally {
      setSavingEdit(false);
    }
  };

  return {
    items,
    loading,
    fetchList,
    editing,
    openEdit,
    saveEdit,
    closeEdit,
    onDelete,
    handleSendInvite,
    inviteLoadingId,
    savingEdit,
    banner,
    setBanner,
    firstName,
    lastName,
    phone,
    setFirstName,
    setLastName,
    setPhone,
    searchTerm,
    setSearchTerm,
    handleCreateSuccess,
    createProfessional,
  } as const;
}
