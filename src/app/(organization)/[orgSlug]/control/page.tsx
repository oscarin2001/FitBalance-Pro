import React from "react";
import { OrgPageHeader } from "../../_components/org-page-header";
import { KpiGlobalGrid } from "../../_components/global/KpiGlobalGrid";
import { GlobalRevenueByMonthChart } from "../../_components/global/GlobalRevenueByMonthChart";
import { TopGlobalProfessionalsTable } from "../../_components/global/TopGlobalProfessionalsTable";

export default function OrganizationGlobalControlPage() {
  return (
    <div className="space-y-8">
      <OrgPageHeader
        title="Control global"
        description="Panel ejecutivo global: sucursales, profesionales, clientes y salud financiera de toda la plataforma."
      />

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          KPIs globales
        </h2>
        <KpiGlobalGrid />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Ingresos por mes
          </h2>
          <GlobalRevenueByMonthChart />
        </div>
        <div className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Profesionales con mejor performance
          </h2>
          <TopGlobalProfessionalsTable />
        </div>
      </section>
    </div>
  );
}
