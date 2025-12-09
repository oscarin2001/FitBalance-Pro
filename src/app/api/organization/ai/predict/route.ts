import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

// Predictions: estimated date to reach target, churn risk, intervention candidates
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgSlug = searchParams.get("orgSlug");
    const limit = Number(searchParams.get("limit") || "50");

    const guard = await requireOrgAccess(req, orgSlug);
    if (guard instanceof NextResponse) return guard;
    const { org } = guard;

    // identify clients
    const clientSubs = await prisma.clientSubscription.findMany({
      where: { plan: { organizationId: org.id } },
      select: { userId: true },
    });
    const userIds = Array.from(new Set(clientSubs.map((s) => s.userId))).slice(
      0,
      limit
    );

    const results = await Promise.all(
      userIds.map(async (uid) => {
        // latest body progress
        const progresses = await prisma.bodyProgress.findMany({
          where: { userId: uid },
          orderBy: { date: "asc" },
        });
        const lastProgress = progresses[progresses.length - 1];

        // estimate weight trend: compute avg weekly delta using earliest and latest
        let estimatedDateToTarget: string | null = null;
        if (lastProgress) {
          const profile = await prisma.clientProfile.findUnique({
            where: { userId: uid },
            select: { targetWeightKg: true } as any,
          });
          if (profile?.targetWeightKg != null && progresses.length >= 2) {
            const first = progresses[0];
            const last = progresses[progresses.length - 1];
            const weeks =
              (new Date(last.date).getTime() - new Date(first.date).getTime()) /
              (1000 * 60 * 60 * 24 * 7);
            const delta = (last.weightKg ?? 0) - (first.weightKg ?? 0);
            const weekly = weeks > 0 ? delta / weeks : 0;
            if (weekly !== 0) {
              const remainingKg = profile.targetWeightKg - (last.weightKg ?? 0);
              const weeksNeeded = remainingKg / weekly;
              if (weeksNeeded > 0 && isFinite(weeksNeeded)) {
                const est = new Date();
                est.setDate(est.getDate() + Math.round(weeksNeeded * 7));
                estimatedDateToTarget = est.toISOString();
              }
            }
          }
        }

        // churn risk heuristic: days since last logged meal and average adherence
        const lastMeal = await prisma.loggedMeal.findFirst({
          where: { userId: uid },
          orderBy: { date: "desc" },
          select: { date: true },
        });
        const daysSinceLastMeal = lastMeal
          ? Math.floor(
              (Date.now() - new Date(lastMeal.date).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 999;

        const recentAdherence = await prisma.planAdherence.findMany({
          where: {
            plan: { subscriptions: { some: { userId: uid } } },
            date: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) },
          },
          select: { percentage: true } as any,
        });
        const adherenceAvg = recentAdherence.length
          ? recentAdherence.reduce((s, r) => s + (r.percentage || 0), 0) /
            recentAdherence.length
          : null;

        let churnRisk = 0;
        if (daysSinceLastMeal > 7) churnRisk += 50;
        if (adherenceAvg != null && adherenceAvg < 40) churnRisk += 30;
        if (daysSinceLastMeal > 14) churnRisk += 20;
        churnRisk = Math.min(100, churnRisk);

        return {
          userId: uid,
          estimatedDateToTarget,
          churnRisk,
          daysSinceLastMeal,
          adherenceAvg,
        };
      })
    );

    // clients needing intervention: churnRisk >= 50
    const needIntervention = results.filter((r) => r.churnRisk >= 50);

    return NextResponse.json({ predictions: results, needIntervention });
  } catch (e) {
    console.error("GET /api/organization/ai/predict error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
