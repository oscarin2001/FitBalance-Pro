import React from "react";
import { OrgPageHeader } from "../../_components/org-page-header";
import BranchesPanel from "../dashboard/_components/BranchesPanel";

type Params = Promise<{ orgSlug: string }>;

export default async function BranchesPage({ params }: { params: Params }) {
  const { orgSlug } = await params;

  return (
    <div className="space-y-6">
      <OrgPageHeader
        title="Sucursales"
        description="Gestiona las sucursales físicas de tu organización y revisa sus métricas."
      />

      <BranchesPanel />
    </div>
  );
}
