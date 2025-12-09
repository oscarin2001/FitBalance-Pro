import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { resolveProAccountId } from "./resolveUserId";

/**
 * Ensure the request comes from an authenticated user who is an ACTIVE member
 * of the organization identified by orgSlug. Returns NextResponse on failure
 * so callers can `return` it directly, or returns an object with { userId, org, membership }.
 */
export async function requireOrgAccess(
  req: Request,
  orgSlug: string | null,
  allowedRoles?: string[]
) {
  if (!orgSlug)
    return NextResponse.json({ error: "orgSlug required" }, { status: 400 });

  const userId = await resolveProAccountId(req as any, { debug: true });
  if (!userId) {
    console.log(
      "[requireOrgAccess] no PRO account id resolved for orgSlug",
      orgSlug
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });
  if (!org)
    return NextResponse.json(
      { error: "organization not found" },
      { status: 404 }
    );

  const membership = await prisma.organizationMember.findFirst({
    where: { organizationId: org.id, accountId: userId, status: "ACTIVE" },
  });
  if (!membership) {
    console.log("[requireOrgAccess] no membership for account", {
      accountId: userId,
      orgId: org.id,
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(membership.role)
  ) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  return { userId, org, membership };
}
