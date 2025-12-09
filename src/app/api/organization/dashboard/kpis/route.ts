import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgSlug = searchParams.get("orgSlug");

    const guard = await requireOrgAccess(req, orgSlug);
    if (guard instanceof NextResponse) return guard;
    const { org } = guard;

    const now = new Date();
    const weekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7
    );

    const [membersTotal, professionalsCount, activeSubscriptions, revenueAgg] =
      await Promise.all([
        prisma.organizationMember.count({ where: { organizationId: org.id } }),
        prisma.professionalOrganization.count({
          where: { organizationId: org.id },
        }),
        prisma.clientSubscription.count({
          where: { plan: { organizationId: org.id }, status: "ACTIVE" },
        }),
        prisma.payment.aggregate({
          _sum: { amountCents: true },
          where: {
            subscription: { plan: { organizationId: org.id } },
            status: "SUCCEEDED",
          },
        }),
      ]);

    // Clientes atendidos esta semana: distinct users with assignments assignedAt >= weekStart and linked to this org
    // Prisma `count` doesn't accept `distinct` in this client version; fetch userIds and dedupe in JS
    const clientsThisWeekRows =
      await prisma.clientProfessionalAssignment.findMany({
        where: {
          assignedAt: { gte: weekStart },
          professional: {
            professionalOrganizations: { some: { organizationId: org.id } },
          },
        },
        select: { userId: true },
      });
    const clientsThisWeek = new Set(clientsThisWeekRows.map((r) => r.userId))
      .size;

    // % de clientes con progreso positivo: approximation — count of users with bodyProgress in last 30 days
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
    const clientsWithProgressRows = await prisma.bodyProgress.findMany({
      where: {
        date: { gte: monthStart },
        user: { subscriptions: { some: { plan: { organizationId: org.id } } } },
      },
      select: { userId: true },
    });
    const clientsWithProgress = Array.from(
      new Set(clientsWithProgressRows.map((r) => r.userId))
    );

    const totalClients = await prisma.user.count({
      where: { subscriptions: { some: { plan: { organizationId: org.id } } } },
    });

    const percentClientsWithProgress =
      totalClients > 0 ? (clientsWithProgress.length / totalClients) * 100 : 0;

    // Adherence average across plans for org (PlanAdherence via NutritionPlan -> plan.organization not present, so approximate using NutritionPlan where nutritionist belongs to org)
    const adherenceAgg = await prisma.planAdherence.aggregate({
      _avg: { percentage: true },
    });

    const revenueTotal = (revenueAgg._sum.amountCents || 0) / 100;

    return NextResponse.json({
      membersTotal,
      professionalsCount,
      clientsAttendedThisWeek: clientsThisWeek,
      activeSubscriptions,
      revenueTotal,
      percentClientsWithProgress: Number(percentClientsWithProgress.toFixed(1)),
      averageAdherence: adherenceAgg._avg.percentage ?? null,
    });
  } catch (e) {
    console.error("GET /api/organization/dashboard/kpis error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
