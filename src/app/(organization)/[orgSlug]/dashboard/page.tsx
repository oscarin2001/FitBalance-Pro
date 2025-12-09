import React from "react";
import { OrgPageHeader } from "../../_components/org-page-header";
import KpisSection from "./_components/KpisSection";
import ClientsPanel from "./_components/ClientsPanel";
import ProfessionalsPanel from "./_components/ProfessionalsPanel";
import BranchesPanel from "./_components/BranchesPanel";

export default function OrganizationDashboardPanel() {
  return (
    <div className="space-y-8">
      <OrgPageHeader
        title="Dashboard de organización"
        description="Métricas operativas y paneles para el equipo del espacio."
      />

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          KPIs
        </h2>
        <KpisSection />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Panel de clientes
          </h2>
          <ClientsPanel />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Panel de profesionales
          </h2>
          <ProfessionalsPanel />
        </div>
        <div className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Panel de sucursales
          </h2>
          <BranchesPanel />
        </div>
      </section>
    </div>
  );
}
