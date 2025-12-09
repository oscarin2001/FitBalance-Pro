"use client";

import { OrgPageHeader } from "../../_components/org-page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ROLES = [
  {
    name: "Propietario",
    summary: "Control total. Se requiere al menos un asiento por espacio.",
    capabilities: ["Facturacion", "Roles", "Todos los datos"],
    members: 1,
  },
  {
    name: "Admin",
    summary: "Orquestacion diaria entre escuadras.",
    capabilities: ["Miembros", "Programas", "Analitica"],
    members: 3,
  },
  {
    name: "Coach",
    summary: "Gestiona planes de salud y seguimientos.",
    capabilities: ["Clientes", "Tareas", "Notas"],
    members: 12,
  },
  {
    name: "Nutricionista",
    summary: "Disena menus, laboratorios y educacion.",
    capabilities: ["Clientes", "Recetas", "Labs"],
    members: 8,
  },
];

export default function OrganizationRolesPage() {
  return (
    <div className="space-y-6">
      <OrgPageHeader
        title="Roles y accesos"
        description="Cobertura de OrgRole y roles profesionales para esta organizacion."
        actions={<Button>Ajustar politicas</Button>}
      />

      <section className="grid gap-4 md:grid-cols-2">
        {ROLES.map((role) => (
          <Card key={role.name}>
            <CardHeader>
              <CardTitle>{role.name}</CardTitle>
              <CardDescription>{role.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Asientos asignados: {role.members}</p>
              <p>
                Capacidades:{" "}
                <span className="font-medium text-foreground">
                  {role.capabilities.join(", ")}
                </span>
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Lineamientos</CardTitle>
          <CardDescription>
            Usa OrgRole + OrganizationMember para reforzar politicas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>- Ningun propietario puede degradarse sin nombrar sucesion.</p>
          <p>- Cada escuadra de clientes necesita al menos un Admin o Coach.</p>
          <p>
            - Miembros solo-finanzas solo ven facturacion, facturas y recibos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
