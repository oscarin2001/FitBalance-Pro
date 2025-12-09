import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const orgSlug = searchParams.get("orgSlug");
    const guard = await requireOrgAccess(req, orgSlug);
    if (guard instanceof NextResponse) return guard;
    const { org, user } = guard as any;

    const id = Number(params.id);
    if (Number.isNaN(id))
      return NextResponse.json({ error: "invalid id" }, { status: 400 });

    // remove relation between professional and organization
    await prisma.professionalOrganization.delete({
      where: {
        professionalId_organizationId: {
          professionalId: id,
          organizationId: org.id,
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: org.id,
        userId: user?.id ?? null,
        action: "professional.remove",
        meta: { professionalId: id },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE professional error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const orgSlug = searchParams.get("orgSlug");
    const guard = await requireOrgAccess(req, orgSlug);
    if (guard instanceof NextResponse) return guard;
    const { org, user } = guard as any;

    const id = Number(params.id);
    if (Number.isNaN(id))
      return NextResponse.json({ error: "invalid id" }, { status: 400 });

    const body = await req.json();
    const { firstName, lastName, phone, branchId } = body;

    const updateData: any = { firstName, lastName, phone };

    if (branchId !== undefined) {
      if (branchId === null) {
        updateData.branchId = null;
      } else {
        const bId = Number(branchId);
        if (Number.isNaN(bId))
          return NextResponse.json(
            { error: "invalid branch id" },
            { status: 400 }
          );
        // ensure branch belongs to org
        const branch = await prisma.branch.findUnique({ where: { id: bId } });
        if (!branch || branch.organizationId !== org.id)
          return NextResponse.json(
            { error: "branch not found in organization" },
            { status: 404 }
          );
        updateData.branchId = bId;
      }
    }

    const updated = await prisma.professional.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        organizationId: org.id,
        userId: user?.id ?? null,
        action: "professional.update",
        meta: { professionalId: id, changes: updateData },
      },
    });

    return NextResponse.json({ professional: updated });
  } catch (e) {
    console.error("PATCH professional error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
