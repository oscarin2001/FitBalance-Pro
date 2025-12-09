import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";
import { invitarMiembro } from "@/lib/organizacion";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgSlug = searchParams.get("orgSlug");

    const guard = await requireOrgAccess(req, orgSlug);
    if (guard instanceof NextResponse) return guard;
    const { userId, org } = guard as any;

    const body = (await req.json().catch(() => ({}))) as any;
    const firstName = body?.firstName ? String(body.firstName).trim() : null;
    const lastName = body?.lastName ? String(body.lastName).trim() : null;
    const email = body?.email ? String(body.email).toLowerCase().trim() : null;
    const phone = body?.phone ? String(body.phone).trim() : null;
    const gender = body?.gender ? String(body.gender).trim() : null;
    const birthDate = body?.birthDate ? new Date(String(body.birthDate)) : null;
    const branchId = body?.branchId ? Number(body.branchId) : null;
    const password = body?.password ? String(body.password) : null;

    if (!firstName || firstName.length < 2)
      return NextResponse.json(
        { error: "firstName required (min 2 chars)" },
        { status: 400 }
      );
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return NextResponse.json({ error: "invalid email" }, { status: 400 });

    // If a professional with the same email exists, reuse it; otherwise create
    let professional: any = null;
    if (email) {
      professional = await prisma.professional.findUnique({ where: { email } });
    }

    if (!professional) {
      professional = await prisma.professional.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          gender: gender || undefined,
          birthDate: birthDate || undefined,
          branchId: branchId || undefined,
          type: "COACH",
          organizationId: org.id,
        },
      });
    } else {
      // ensure organization relation exists and update optional fields
      await prisma.professional.update({
        where: { id: professional.id },
        data: {
          organizationId: professional.organizationId || org.id,
          gender: gender || professional.gender,
          birthDate: birthDate || professional.birthDate,
          branchId: branchId || professional.branchId,
        },
      });
      professional = await prisma.professional.findUnique({ where: { id: professional.id } });
    }

    // Create join row (idempotent: ignore if exists)
    try {
      await prisma.professionalOrganization.create({
        data: {
          professionalId: professional.id,
          organizationId: org.id,
          role: "COACH",
        },
      });
    } catch (e) {
      // ignore unique constraint if already linked
    }

    // Handle account creation: if password provided, create/update account with password
    let inviteResult: any = null;
    let accountResult: any = null;
    if (password && email) {
      // create or update account with provided password (hash)
      const { scryptSync, randomBytes } = await import("crypto");
      const salt = randomBytes(16).toString("hex");
      const hash = scryptSync(password, salt, 64).toString("hex");
      const password_hash = `${salt}:${hash}`;

      await prisma.$transaction(async (tx) => {
        let account = await tx.account.findUnique({ where: { email } });
        if (!account) {
          account = await tx.account.create({
            data: {
              email,
              passwordHash: password_hash,
              role: "COACH",
              accountType: "PROFESSIONAL",
              isVerified: false,
              professional: { connect: { id: professional.id } },
            },
          });
        } else {
          account = await tx.account.update({
            where: { id: account.id },
            data: { passwordHash: password_hash, professional: { connect: { id: professional.id } } },
          });
        }

        // Ensure organizationMember is active for this account
        const existing = await tx.organizationMember.findUnique({
          where: { organizationId_accountId: { organizationId: org.id, accountId: account.id } },
        });
        if (!existing) {
          await tx.organizationMember.create({
            data: {
              organizationId: org.id,
              accountId: account.id,
              role: "COACH",
              status: "ACTIVE",
              invitedById: Number(userId),
              acceptedAt: new Date(),
            },
          });
        }
        accountResult = { accountId: account.id };
      });
    } else if (email) {
      try {
        inviteResult = await invitarMiembro({
          organizationId: org.id,
          email,
          role: "COACH",
          invitedByAccountId: Number(userId),
        });
      } catch (err) {
        console.warn("invitarMiembro warning:", err);
      }
    }

    // Audit
    await prisma.auditLog.create({
      data: {
        entity: "ProfessionalOrganization",
        entityId: professional.id,
        action: "create",
        performedById: Number(userId),
        changes: { payload: body, invite: inviteResult, account: accountResult },
        context: `org:${org.slug}`,
      },
    });

    return NextResponse.json({ ok: true, professional, invite: inviteResult, account: accountResult });
  } catch (e) {
    console.error(
      "POST /api/organization/create_user_in_organization/coach/create error:",
      e
    );
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
