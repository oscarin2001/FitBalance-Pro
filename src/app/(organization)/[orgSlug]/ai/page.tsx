import React from "react";
import { OrgPageHeader } from "../../_components/org-page-header";
import AIkpis from "./_components/KpisSection";
import PredictionsPanel from "./_components/PredictionsPanel";
import PatternsPanel from "./_components/PatternsPanel";

export default function OrganizationAiPage() {
  return (
    <div className="space-y-8">
      <OrgPageHeader
        title="IA Predictiva"
        description="Predicciones y señales basadas en progreso, comidas, rutinas e hidratación."
      />

      <section>
        <AIkpis />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="col-span-2 space-y-4">
          <PredictionsPanel />
        </div>
        <div className="space-y-4">
          <PatternsPanel />
        </div>
      </section>
    </div>
  );
}
