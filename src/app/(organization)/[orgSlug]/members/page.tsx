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

const MEMBERS = [
  {
    name: "Camila Ortiz",
    role: "Propietaria",
    status: "Activa",
    lastActive: "Hace 2 minutos",
  },
  {
    name: "Noah Li",
    role: "Admin",
    status: "Activo",
    lastActive: "Hace 18 minutos",
  },
  {
    name: "Sara Menon",
    role: "Coach",
    status: "Ausente",
    lastActive: "Ayer",
  },
  {
    name: "Diego Parks",
    role: "Nutricionista",
    status: "Activo",
    lastActive: "Hace 35 minutos",
  },
  {
    name: "Irene K.",
    role: "Finanzas",
    status: "Pendiente",
    lastActive: "Invitacion enviada",
  },
];

const INVITES = [
  {
    email: "coach.ariel@forge.app",
    role: "Coach",
    invitedBy: "Camila",
    expires: "15 Ago",
  },
  {
    email: "ops@solstice.co",
    role: "Admin",
    invitedBy: "Noah",
    expires: "18 Ago",
  },
];

export default function OrganizationMembersPage() {
  return (
    <div className="space-y-6">
      <OrgPageHeader
        title="Equipo de miembros"
        description="Administra propietarias, admins y especialistas del espacio. Los permisos siguen el nuevo modelo OrgRole."
        actions={
          <>
            <Button variant="outline">Gestionar invitaciones</Button>
            <Button>Nuevo miembro</Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Miembros activos</CardTitle>
          <CardDescription>
            Vista sincronizada desde Account y OrganizationMember.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="pb-2">Nombre</th>
                <th className="pb-2">Rol</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2">Ultima actividad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {MEMBERS.map((member) => (
                <tr key={member.name}>
                  <td className="py-3 font-medium">{member.name}</td>
                  <td className="py-3 text-muted-foreground">{member.role}</td>
                  <td className="py-3">{member.status}</td>
                  <td className="py-3 text-muted-foreground">
                    {member.lastActive}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
        <CardFooter className="justify-end">
          <Button size="sm" variant="ghost">
            Sincronizar directorio
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invitaciones pendientes</CardTitle>
          <CardDescription>
            Tokens generados por el endpoint{" "}
            <code>/api/organization/management/v1/invite</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {INVITES.map((invite) => (
            <div
              key={invite.email}
              className="rounded-xl border border-border/70 px-4 py-3"
            >
              <p className="font-medium">{invite.email}</p>
              <p className="text-sm text-muted-foreground">
                Rol: {invite.role} · Invitado por {invite.invitedBy}
              </p>
              <p className="text-xs text-muted-foreground">
                Expira {invite.expires}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
