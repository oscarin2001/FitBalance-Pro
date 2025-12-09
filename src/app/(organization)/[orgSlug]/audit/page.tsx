import React from "react";
import { OrgPageHeader } from "../../_components/org-page-header";
import KpisSection from "./_components/KpisSection";
import RecentChanges from "./_components/RecentChanges";
import CriticalActions from "./_components/CriticalActions";
import ActionsByUser from "./_components/ActionsByUser";
import ActionsByIp from "./_components/ActionsByIp";
import RiskPatterns from "./_components/RiskPatterns";
import EntityAudit from "./_components/EntityAudit";

export default function OrganizationAuditPage() {
  return (
    <div className="space-y-8">
      <OrgPageHeader
        title="Dashboard de Auditoría"
        description="Panel para administración y compliance: actividad, riesgos y trazabilidad."
      />

      <section>
        <KpisSection />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 col-span-2">
          <RecentChanges />
          <EntityAudit />
        </div>

        <div className="space-y-4">
          <CriticalActions />
          <ActionsByUser />
          <ActionsByIp />
          <RiskPatterns />
        </div>
      </section>
    </div>
  );
}
