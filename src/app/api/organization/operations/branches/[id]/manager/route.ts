import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const orgSlug = searchParams.get("orgSlug");

    const guard = await requireOrgAccess(req, orgSlug || undefined, [
      "OWNER",
      "ADMIN",
    ]);
    if (guard instanceof NextResponse) return guard;
    const { org, userId } = guard as any;

    const branchId = Number(params.id);
    if (!branchId || Number.isNaN(branchId)) {
      return NextResponse.json({ error: "invalid branch id" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as any;
    const professionalId = body?.professionalId
      ? Number(body.professionalId)
      : null;

    // validate branch belongs to org
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch || branch.organizationId !== org.id) {
      return NextResponse.json(
        { error: "branch not found in organization" },
        { status: 404 }
      );
    }

    if (professionalId === null) {
      // unassign manager
      const updated = await prisma.branch.update({
        where: { id: branchId },
        data: { managerProfessionalId: null },
      });
      return NextResponse.json({ ok: true, branch: updated });
    }

    // validate professional belongs to same org
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
    });
    if (!professional || professional.organizationId !== org.id) {
      return NextResponse.json(
        { error: "professional not found in organization" },
        { status: 404 }
      );
    }

    // assign managerProfessionalId on the branch
    const updatedBranch = await prisma.branch.update({
      where: { id: branchId },
      data: { managerProfessionalId: professionalId },
    });

    // ensure professionalOrganization row exists and has role BRANCH_MANAGER (upsert)
    try {
      await prisma.professionalOrganization.upsert({
        where: {
          professionalId_organizationId: {
            professionalId,
            organizationId: org.id,
          },
        },
        update: { role: "BRANCH_MANAGER" },
        create: {
          professionalId,
          organizationId: org.id,
          role: "BRANCH_MANAGER",
        },
      });
    } catch (e) {
      // some Prisma clients may not expose the compound unique name; fallback: try create then update
      try {
        await prisma.professionalOrganization.create({
          data: {
            professionalId,
            organizationId: org.id,
            role: "BRANCH_MANAGER",
          },
        });
      } catch (err) {
        try {
          await prisma.professionalOrganization.updateMany({
            where: { professionalId, organizationId: org.id },
            data: { role: "BRANCH_MANAGER" },
          });
        } catch (ignored) {
          // ignore
        }
      }
    }

    // Audit
    await prisma.auditLog.create({
      data: {
        entity: "Branch",
        entityId: branchId,
        action: "update",
        performedById: Number(userId),
        changes: { managerAssigned: professionalId },
        context: `org:${org.slug}`,
      },
    });

    return NextResponse.json({ ok: true, branch: updatedBranch });
  } catch (e) {
    console.error(
      "PATCH /api/organization/operations/branches/[id]/manager error:",
      e
    );
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
