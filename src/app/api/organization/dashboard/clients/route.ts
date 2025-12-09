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

    // New clients this week: users who started a subscription to org plans in the last 7 days
    const newClientsThisWeek = await prisma.clientSubscription.count({
      where: {
        plan: { organizationId: org.id },
        startDate: { gte: weekStart },
      },
    });

    // Clients in risk: average plan adherence < 40% (approximate)
    const clientsWithLowAdherence = await prisma.user.findMany({
      where: {
        subscriptions: { some: { plan: { organizationId: org.id } } },
        nutritionPlans: {
          some: { dailyAdherence: { some: { percentage: { lt: 40 } } } },
        },
      },
      select: { id: true, firstName: true, lastName: true },
    });

    // Clients without logged meals > 3 days
    const threeDaysAgo = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 3
    );
    const clientsNoMeals = await prisma.user.findMany({
      where: {
        subscriptions: { some: { plan: { organizationId: org.id } } },
        loggedMeals: { none: { date: { gte: threeDaysAgo } } },
      },
      select: { id: true, firstName: true, lastName: true },
    });

    // Clients without body progress > 2 weeks
    const twoWeeksAgo = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 14
    );
    const clientsNoBodyProgress = await prisma.user.findMany({
      where: {
        subscriptions: { some: { plan: { organizationId: org.id } } },
        bodyProgress: { none: { date: { gte: twoWeeksAgo } } },
      },
      select: { id: true, firstName: true, lastName: true },
    });

    // Clients without exercise routines assigned
    const clientsNoRoutines = await prisma.user.findMany({
      where: {
        subscriptions: { some: { plan: { organizationId: org.id } } },
        exerciseRoutines: { none: {} },
      },
      select: { id: true, firstName: true, lastName: true },
    });

    return NextResponse.json({
      newClientsThisWeek,
      clientsInRiskCount: clientsWithLowAdherence.length,
      clientsInRisk: clientsWithLowAdherence,
      clientsNoMealsCount: clientsNoMeals.length,
      clientsNoMeals: clientsNoMeals,
      clientsNoBodyProgressCount: clientsNoBodyProgress.length,
      clientsNoBodyProgress: clientsNoBodyProgress,
      clientsNoRoutinesCount: clientsNoRoutines.length,
      clientsNoRoutines: clientsNoRoutines,
    });
  } catch (e) {
    console.error("GET /api/organization/dashboard/clients error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
