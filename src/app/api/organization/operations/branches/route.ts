import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgSlug = searchParams.get("orgSlug");

    const guard = await requireOrgAccess(req, orgSlug || undefined);
    if (guard instanceof NextResponse) {
      return guard;
    }
    const { org, userId } = guard as any;

    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const managerProfessionalId = body?.professionalId
      ? Number(body.professionalId)
      : null;
    if (!name) {
      return NextResponse.json(
        { error: "El nombre de la sucursal es obligatorio" },
        { status: 400 }
      );
    }

    // if managerProfessionalId provided, validate belongs to org
    if (managerProfessionalId !== null) {
      const pro = await prisma.professional.findUnique({
        where: { id: managerProfessionalId },
      });
      if (!pro || pro.organizationId !== org.id) {
        return NextResponse.json(
          { error: "professional not found in organization" },
          { status: 404 }
        );
      }
    }

    const branch = await prisma.branch.create({
      data: {
        organizationId: org.id,
        name,
        address: body.address ?? null,
        city: body.city ?? null,
        country: body.country ?? null,
        phone: body.phone ?? null,
        timezone: body.timezone ?? null,
        capacity:
          body.capacity !== undefined && body.capacity !== null
            ? Number(body.capacity)
            : null,
        managerProfessionalId: managerProfessionalId || null,
      },
    });

    // ensure professionalOrganization entry if manager assigned
    if (managerProfessionalId !== null) {
      try {
        await prisma.professionalOrganization.upsert({
          where: {
            professionalId_organizationId: {
              professionalId: managerProfessionalId,
              organizationId: org.id,
            },
          },
          update: { role: "BRANCH_MANAGER" },
          create: {
            professionalId: managerProfessionalId,
            organizationId: org.id,
            role: "BRANCH_MANAGER",
          },
        });
      } catch (e) {
        // best-effort: ignore
      }
    }

    await prisma.organization.update({
      where: { id: org.id },
      data: { branchesCount: { increment: 1 } },
    });

    // Audit: record who created the branch when possible
    try {
      await prisma.auditLog.create({
        data: {
          entity: "Branch",
          entityId: branch.id,
          action: "create",
          performedById: userId ? Number(userId) : null,
          changes: { payload: body },
          context: `org:${org.slug}`,
        },
      });
    } catch (e) {
      // best-effort: don't block branch creation if audit log fails
      console.warn("Failed to write audit log for branch create", e);
    }

    return NextResponse.json({ branch }, { status: 201 });
  } catch (e) {
    console.error("POST /api/organization/operations/branches error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
