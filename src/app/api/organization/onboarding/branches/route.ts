import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// Crea sucursales iniciales para una organización recién creada durante el onboarding PRO.
// Espera body: { orgSlug: string; hasBranches: boolean; branches: { name: string; city: string; country: string; address?: string }[] }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null as any);
    const orgSlug = (body?.orgSlug ?? "").toString().trim();
    const hasBranches = Boolean(body?.hasBranches);
    const branchesInput = Array.isArray(body?.branches) ? body.branches : [];

    if (!orgSlug) {
      return NextResponse.json({ error: "orgSlug requerido" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });
    if (!org) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 404 }
      );
    }

    if (!branchesInput.length) {
      return NextResponse.json({ ok: true, created: 0 }, { status: 200 });
    }

    // Normalizar payload: en modo ONE guardamos solo la principal,
    // en MULTI todas las sucursales enviadas.
    const normalized = branchesInput
      .map((b: any) => ({
        name: (b?.name ?? "").toString().trim(),
        city: (b?.city ?? "").toString().trim() || null,
        country: (b?.country ?? "").toString().trim() || null,
        address: (b?.address ?? "").toString().trim() || null,
      }))
      .filter((b) => b.name);

    if (!normalized.length) {
      return NextResponse.json({ ok: true, created: 0 }, { status: 200 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const toCreate = hasBranches ? normalized : [normalized[0]];

      const createdBranches = await Promise.all(
        toCreate.map((b) =>
          tx.branch.create({
            data: {
              organizationId: org.id,
              name: b.name,
              city: b.city,
              country: b.country,
              address: b.address,
            },
          })
        )
      );

      await tx.organization.update({
        where: { id: org.id },
        data: { branchesCount: { increment: createdBranches.length } },
      });

      return createdBranches.length;
    });

    return NextResponse.json({ ok: true, created }, { status: 201 });
  } catch (e) {
    console.error("POST /api/organization/onboarding/branches error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
