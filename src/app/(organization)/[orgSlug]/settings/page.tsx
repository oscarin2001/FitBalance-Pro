"use client";

import { OrgPageHeader } from "../../_components/org-page-header";
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

export default function OrganizationSettingsPage() {
  return (
    <div className="space-y-6">
      <OrgPageHeader
        title="Ajustes del espacio"
        description="Marca, notificaciones y parametros de gobernanza que aplican a esta organizacion."
        actions={<Button>Guardar cambios</Button>}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Identidad</CardTitle>
            <CardDescription>
              Visible en tableros, recibos e invitaciones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Nombre de la organizacion</Label>
              <Input
                id="org-name"
                placeholder="Acme Performance"
                defaultValue="Acme Performance"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug">Slug</Label>
              <Input id="org-slug" placeholder="acme" defaultValue="acme" />
              <p className="text-xs text-muted-foreground">
                Usa solo minusculas y caracteres seguros para slug.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-email">Correo de soporte</Label>
              <Input
                id="support-email"
                type="email"
                placeholder="ops@acme.health"
                defaultValue="ops@acme.health"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button size="sm" variant="outline">
              Reiniciar
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notificaciones</CardTitle>
            <CardDescription>
              Cadencia por defecto para invitaciones, facturacion y alertas de
              riesgo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Resumen de riesgos</Label>
              <Input defaultValue="Semanal cada lunes · 07:00" />
            </div>
            <div className="space-y-2">
              <Label>Copias de facturacion a</Label>
              <Input defaultValue="finance@acme.health" />
            </div>
            <div className="space-y-2">
              <Label>SMS para alertas criticas</Label>
              <Input defaultValue="+1 323 555 0195" />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
