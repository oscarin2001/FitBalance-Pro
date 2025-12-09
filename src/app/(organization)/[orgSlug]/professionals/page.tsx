import React from "react";
import Link from "next/link";
import ProfessionalList from "./_components/ProfessionalList";
import { OrgPageHeader } from "../../_components/org-page-header";
import { Button } from "@/components/ui/button";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProfessionalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ orgSlug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const rawType = resolvedSearchParams?.type;
  const normalizedType = Array.isArray(rawType) ? rawType[0] : rawType;
  const typeFilter =
    normalizedType === "coach" || normalizedType === "nutritionist"
      ? normalizedType
      : undefined;

  const baseHref = `/${orgSlug}/professionals`;
  const coachHref = `${baseHref}?type=coach`;
  const nutritionistHref = `${baseHref}?type=nutritionist`;

  return (
    <div className="space-y-6">
      <OrgPageHeader
        title="Profesionales"
        description="Gestiona tu equipo de coaches y nutricionistas."
      />

      <ProfessionalList orgSlug={orgSlug} typeFilter={typeFilter} />
    </div>
  );
}
