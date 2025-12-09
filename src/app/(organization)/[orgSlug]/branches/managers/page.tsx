import React from "react";
import prisma from "@/lib/db/prisma";
import BranchManagerCard from "../_components/manager/BranchManagerCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import BackButton from "@/components/onboarding/BackButton";

export default async function Page({
  params,
}: {
  params: { orgSlug: string };
}) {
  const { orgSlug } = params;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });
  if (!org) return <div>Organización no encontrada</div>;

  const branches = await prisma.branch.findMany({
    where: { organizationId: org.id },
    orderBy: { name: "asc" },
    include: {
      managerProfessional: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  const normalized = branches.map((b) => ({
    ...b,
    managerName: b.managerProfessional
      ? `${b.managerProfessional.firstName}${
          b.managerProfessional.lastName
            ? ` ${b.managerProfessional.lastName}`
            : ""
        }`
      : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Encargados de sucursales</h1>
          <p className="text-sm text-muted-foreground">
            Asignar y revisar encargados por cada sucursal de la organización.
          </p>
        </div>
        <BackButton href={`/${org.slug}/branches`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de sucursales</CardTitle>
          <CardDescription>
            Asigna responsables a las sucursales para delegar operaciones y
            permisos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {normalized.map((b) => (
              // @ts-expect-error Server -> Client props
              <BranchManagerCard key={b.id} orgSlug={orgSlug} branch={b} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
