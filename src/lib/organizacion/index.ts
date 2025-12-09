import prisma from "@/lib/db/prisma";
import crypto from "crypto";

type OrgRole = "OWNER" | "ADMIN" | "NUTRITIONIST" | "COACH" | "MEMBER";

export async function crearOrganizacion({
  ownerAccountId,
  name,
  slug,
}: {
  ownerAccountId: number;
  name: string;
  slug?: string;
}) {
  if (!name || name.trim().length < 2)
    throw new Error("Nombre de la organización inválido");
  const slugBase = slug && slug.trim().length ? slug.trim() : slugify(name);
  let candidate = slugBase || `org-${Date.now()}`;
  let idx = 1;

  return prisma.$transaction(async (tx) => {
    while (await tx.organization.findUnique({ where: { slug: candidate } })) {
      candidate = `${slugBase}-${idx++}`;
    }

    const account = await tx.account.findUnique({
      where: { id: ownerAccountId },
    });
    if (!account) throw new Error("Cuenta no encontrada");

    let userId = account.userId ?? null;
    if (!userId) {
      const user = await tx.user.create({
        data: {
          firstName: account.email.split("@")[0],
          lastName: "",
          birthDate: new Date(1970, 0, 1),
          gender: "Otro",
        },
      });
      userId = user.id;
      await tx.account.update({
        where: { id: account.id },
        data: { userId },
      });
    }

    const org = await tx.organization.create({
      data: { name, slug: candidate, ownerId: account.id },
    });

    await tx.organizationMember.create({
      data: {
        organizationId: org.id,
        accountId: account.id,
        role: "OWNER",
        status: "ACTIVE",
        invitedById: null,
        invitationToken: null,
        invitationExpiresAt: null,
        acceptedAt: new Date(),
      },
    });

    return org;
  });
}

export async function invitarMiembro({
  organizationId,
  email,
  role = "MEMBER",
  invitedByAccountId,
  diasValidez = 7,
}: {
  organizationId: number;
  email: string;
  role?: OrgRole | string;
  invitedByAccountId: number;
  diasValidez?: number;
}) {
  if (!email || !email.includes("@")) throw new Error("Email inválido");
  const normalizedRole = normalizeOrgRole(role);
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + diasValidez * 24 * 60 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    let account = await tx.account.findUnique({ where: { email } });
    if (!account) {
      account = await tx.account.create({
        data: {
          email,
          passwordHash: crypto.randomBytes(64).toString("hex"),
          role: "CLIENT",
          accountType: "USER",
          isVerified: false,
        },
      });
    }

    const existing = await tx.organizationMember.findUnique({
      where: {
        organizationId_accountId: {
          organizationId,
          accountId: account.id,
        },
      },
    });

    if (existing) {
      if (existing.status === "INVITED") {
        const updated = await tx.organizationMember.update({
          where: { id: existing.id },
          data: {
            invitationToken: token,
            invitationExpiresAt: expiresAt,
            invitedById: invitedByAccountId,
          },
        });
        return { token: updated.invitationToken, invitedAccountId: account.id };
      }
      throw new Error("La persona ya es miembro de la organización");
    }

    const member = await tx.organizationMember.create({
      data: {
        organizationId,
        accountId: account.id,
        role: normalizedRole,
        status: "INVITED",
        invitedById: invitedByAccountId,
        invitationToken: token,
        invitationExpiresAt: expiresAt,
      },
    });

    return { token: member.invitationToken, invitedAccountId: account.id };
  });
}

function normalizeOrgRole(role?: string): OrgRole {
  const upper = (role || "").toUpperCase();
  if (upper === "OWNER" || upper === "ADMIN") return upper as OrgRole;
  if (upper === "NUTRITIONIST" || upper === "COACH") return upper as OrgRole;
  return "MEMBER";
}

function slugify(input: string) {
  return (input || "")
    .toString()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function obtenerMiembros(organizationId: number) {
  return prisma.organizationMember.findMany({
    where: { organizationId },
    include: {
      account: {
        select: {
          id: true,
          email: true,
          role: true,
          professional: true,
          user: true,
        },
      },
    },
  });
}

export async function aceptarInvitacion({
  token,
  accountId,
}: {
  token: string;
  accountId: number;
}) {
  if (!token) throw new Error("Token de invitación requerido");
  return prisma.$transaction(async (tx) => {
    const member = await tx.organizationMember.findUnique({
      where: { invitationToken: token },
    });
    if (!member) throw new Error("Invitación inválida");
    if (
      member.invitationExpiresAt &&
      member.invitationExpiresAt.getTime() < Date.now()
    ) {
      throw new Error("Invitación expirada");
    }

    const existing = await tx.organizationMember.findUnique({
      where: {
        organizationId_accountId: {
          organizationId: member.organizationId,
          accountId,
        },
      },
    });

    if (existing && existing.id !== member.id) {
      await tx.organizationMember.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          acceptedAt: new Date(),
        },
      });
      await tx.organizationMember.delete({ where: { id: member.id } });
      return { ok: true, memberId: existing.id };
    }

    await tx.organizationMember.update({
      where: { id: member.id },
      data: {
        accountId,
        status: "ACTIVE",
        acceptedAt: new Date(),
        invitationToken: null,
        invitationExpiresAt: null,
      },
    });
    return { ok: true, memberId: member.id };
  });
}
