import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgSlug = searchParams.get("orgSlug");

    const guard = await requireOrgAccess(req, orgSlug);
    if (guard instanceof NextResponse) return guard;
    const { org, userId } = guard as any;

    const body = (await req.json().catch(() => ({}))) as any;
    const firstName = body?.firstName ? String(body.firstName).trim() : null;
    const lastName = body?.lastName ? String(body.lastName).trim() : null;
    const email = body?.email ? String(body.email).toLowerCase().trim() : null;
    const assignedCoachId = body?.coachId ? Number(body.coachId) : null;

    if (!firstName)
      return NextResponse.json(
        { error: "firstName required" },
        { status: 400 }
      );

    // create user and client profile
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName: lastName || undefined,
      },
    });

    await prisma.clientProfile.create({
      data: { userId: user.id },
    });

    let assignment = null;
    if (assignedCoachId) {
      try {
        assignment = await prisma.clientProfessionalAssignment.create({
          data: {
            userId: user.id,
            professionalId: assignedCoachId,
            type: "COACH",
            assignedAt: new Date(),
          },
        });
      } catch (e) {
        // ignore failures (e.g., duplicate)
      }
    }

    // Audit
    try {
      await prisma.auditLog.create({
        data: {
          entity: "User",
          entityId: user.id,
          action: "create",
          performedById: userId ? Number(userId) : null,
          changes: { payload: body },
          context: `org:${org.slug}`,
        },
      });
    } catch (e) {
      // best-effort
    }

    // return created user and assignment info
    const coach = assignedCoachId
      ? await prisma.professional.findUnique({ where: { id: assignedCoachId } })
      : null;

    return NextResponse.json({ ok: true, user, assignment, coach });
  } catch (e) {
    console.error("POST /api/organization/operations/clients error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
