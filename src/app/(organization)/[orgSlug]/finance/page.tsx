import React from "react";
import Link from "next/link";
import { OrgPageHeader } from "../../_components/org-page-header";
import OrgFinanceKpis from "./_components/OrgFinanceKpis";
import ProfessionalFinanceKpis from "./_components/ProfessionalFinanceKpis";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const RECONCILIATION_CHECKLIST = [
  "Valida los depósitos por sucursal contra el reporte del banco.",
  "Cruza comisiones de plataforma con los payouts emitidos desde Stripe Connect.",
  "Etiqueta los ajustes manuales (reembolsos, notas de crédito) antes de cerrar el mes.",
];

const PROFESSIONAL_TIPS = [
  "El ID del profesional se encuentra en Organización › Profesionales › Detalle.",
  "Si el profesional aún no tiene payouts, verás la etiqueta 'Sin liquidaciones'.",
  "Para discrepancias, exporta el log de pagos desde Finanzas › API y adjúntalo al ticket.",
];

export default async function OrganizationFinancePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return (
    <div className="space-y-8">
      <OrgPageHeader
        title="Finanzas"
        description="Panel financiero con ingresos, comisiones y conciliaciones por sucursal y profesional."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="#org-overview">Organización</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="#professional-overview">Profesional</Link>
            </Button>
          </>
        }
      />

      <section id="org-overview" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Panorama general</h2>
            <p className="text-sm text-muted-foreground">
              Seguimiento de ingresos, comisiones y desempeño por sucursal.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border/80 px-3 py-1 uppercase tracking-wide">
              Corte mensual
            </span>
            <span className="rounded-full border border-border/80 px-3 py-1 uppercase tracking-wide">
              EUR
            </span>
          </div>
        </div>
        <OrgFinanceKpis orgSlug={orgSlug} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card className="h-fit border-border/80" id="reconciliation-playbook">
          <CardHeader>
            <CardTitle className="text-base">
              Checklist de conciliación
            </CardTitle>
            <CardDescription>
              Repite este flujo después de cada cierre contable para mantener
              todo alineado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {RECONCILIATION_CHECKLIST.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-fit border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Notas operativas</CardTitle>
            <CardDescription>
              Tips rápidos para soporte, cobranzas y auditoría interna.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="rounded-lg bg-muted/40 px-4 py-3">
              Mantén el orgSlug visible cuando abras tickets de soporte
              financiero. Esto acelera la trazabilidad en el equipo de pagos.
            </p>
            <p className="rounded-lg bg-muted/40 px-4 py-3">
              Las comisiones variables por profesional se calculan cada noche a
              las 02:00 UTC junto al batch de payouts pendientes.
            </p>
            <p className="rounded-lg bg-muted/40 px-4 py-3">
              Recuerda actualizar los porcentajes por sucursal desde
              Organización › Global antes de crear nuevos planes combinados.
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="professional-overview" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">KPIs por profesional</h2>
            <p className="text-sm text-muted-foreground">
              Consulta payouts individuales, pagos pendientes y comparativas mes
              a mes.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <ProfessionalFinanceKpis orgSlug={orgSlug} />
          <Card className="h-fit border-border/80">
            <CardHeader>
              <CardTitle className="text-base">Cómo encontrar el ID</CardTitle>
              <CardDescription>
                Evita errores de consulta siguiendo estos pasos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {PROFESSIONAL_TIPS.map((tip) => (
                <div
                  key={tip}
                  className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3"
                >
                  {tip}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
