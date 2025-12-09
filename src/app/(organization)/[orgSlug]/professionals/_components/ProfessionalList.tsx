"use client";
import React, { useMemo } from "react";
import DirectoryCard from "./DirectoryCard";
import ProfessionalsSidebar from "./ProfessionalsSidebar";
import EditProfessionalDialog from "./EditProfessionalDialog";
import CreateProfessionalModal from "./Forms/CreateProfessionalModal";
import useProfessionals from "./lib/useProfessionals";
import { ProfessionalTypeFilter } from "./lib/types";
import { formatName, typePluralLabels } from "./lib/utils";

// Clean, small orchestrator component. All heavy UI moved to subcomponents.
export default function ProfessionalList({
  orgSlug,
  typeFilter,
}: {
  orgSlug: string;
  typeFilter?: ProfessionalTypeFilter;
}) {
  const {
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
  } = useProfessionals(orgSlug);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [createType, setCreateType] = React.useState<
    ProfessionalTypeFilter | undefined
  >(undefined);

  const handleOpenCreate = (type?: ProfessionalTypeFilter) => {
    setCreateType(type);
    setCreateOpen(true);
  };

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
        const normalized = (pro.invitationStatus ?? "").toLowerCase();
        return (
          normalized === "pending" ||
          normalized === "sent" ||
          (!pro.isActive &&
            (pro.status ?? "").toLowerCase() !== "active" &&
            (pro.invitationStatus ?? "") !== "accepted")
        );
      }),
    [typeFilteredItems]
  );

  const baseHref = `/${orgSlug}/professionals`;
  const showSkeleton = loading && items.length === 0;
  const emptyCopy = typeFilter
    ? `No encontramos ${typePluralLabels[typeFilter]} con la búsqueda aplicada.`
    : "No encontramos profesionales con la búsqueda aplicada.";

  return (
    <div className="space-y-6">
      {/* banner removed: suppress inline error/banner display here */}

      <div className="grid gap-6 lg:grid-cols-[3fr_1.3fr]">
        <DirectoryCard
          orgSlug={orgSlug}
          baseHref={baseHref}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          fetchList={fetchList}
          loading={loading}
          filteredItems={filteredItems}
          openEdit={openEdit}
          onDelete={onDelete}
          handleSendInvite={handleSendInvite}
          inviteLoadingId={inviteLoadingId}
          directoryTitle={
            typeFilter
              ? `Directorio de ${typePluralLabels[typeFilter]}`
              : "Directorio de profesionales"
          }
          directoryDescription={
            typeFilter
              ? `Mostrando únicamente ${typePluralLabels[typeFilter]}.`
              : undefined
          }
          showSkeleton={showSkeleton}
          emptyCopy={emptyCopy}
        />

        <ProfessionalsSidebar
          orgSlug={orgSlug}
          coachHref={`${baseHref}?type=coach`}
          nutritionistHref={`${baseHref}?type=nutritionist`}
          onCreateSuccess={handleCreateSuccess}
          pendingInvites={pendingInvites}
          onResend={handleSendInvite}
          inviteLoadingId={inviteLoadingId}
          typeFilter={typeFilter}
          onOpenCreate={handleOpenCreate}
        />
      </div>

      <EditProfessionalDialog
        editing={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => !open && !savingEdit && closeEdit()}
        firstName={firstName}
        lastName={lastName}
        phone={phone}
        setFirstName={setFirstName}
        setLastName={setLastName}
        setPhone={setPhone}
        onSave={saveEdit}
        saving={savingEdit}
      />

      <CreateProfessionalModal
        open={createOpen}
        type={createType}
        orgSlug={orgSlug}
        onClose={() => setCreateOpen(false)}
        onCreate={async (payload) => {
          await createProfessional(payload);
        }}
        onCreated={() => setCreateOpen(false)}
      />
    </div>
  );
}
