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

    // Ingresos brutos: sum of payments for org's plans
    const revenueAgg = await prisma.payment.aggregate({
      _sum: { amountCents: true },
      where: {
        subscription: { plan: { organizationId: org.id } },
        status: "SUCCEEDED",
      },
    });

    // Platform commissions: approximate using payout rules if available
    const payoutRules = await prisma.payoutRule.findMany({
      where: { organizationId: org.id },
    });

    // Net gain = revenue - platform fees (approx)
    const revenueCents = revenueAgg._sum.amountCents ?? 0;
    const platformFeeRate = payoutRules.length
      ? payoutRules[0].platformFeeRate ?? 0
      : 0.05; // fallback 5%
    const platformCommissions = Math.round(revenueCents * platformFeeRate);
    const netGain = revenueCents - platformCommissions;

    // Income by branch
    const branches = await prisma.branch.findMany({
      where: { organizationId: org.id },
    });
    const branchesWithRevenue = await Promise.all(
      branches.map(async (b) => {
        const agg = await prisma.payment.aggregate({
          _sum: { amountCents: true },
          where: {
            branchId: b.id,
            subscription: { plan: { organizationId: org.id } },
            status: "SUCCEEDED",
          },
        });
        return {
          id: b.id,
          name: b.name,
          revenueCents: agg._sum.amountCents ?? 0,
        };
      })
    );

    // Income by professional (top 10)
    const payoutsByPro = await prisma.payout.groupBy({
      by: ["professionalId"],
      _sum: { amountCents: true },
      where: {
        payment: { subscription: { plan: { organizationId: org.id } } },
        status: "PAID",
      },
      orderBy: { _sum: { amountCents: "desc" } },
      take: 10,
    });

    // Income by plan
    const plans = await prisma.subscriptionPlan.findMany({
      where: { organizationId: org.id },
    });
    const plansWithRevenue = await Promise.all(
      plans.map(async (p) => {
        const agg = await prisma.payment.aggregate({
          _sum: { amountCents: true },
          where: { subscription: { planId: p.id }, status: "SUCCEEDED" },
        });
        return {
          id: p.id,
          name: p.name,
          revenueCents: agg._sum.amountCents ?? 0,
        };
      })
    );

    return NextResponse.json({
      revenueGrossCents: revenueCents,
      platformCommissionsCents: platformCommissions,
      netGainCents: netGain,
      branches: branchesWithRevenue,
      topProfessionalsPayouts: payoutsByPro,
      plans: plansWithRevenue,
    });
  } catch (e) {
    console.error("GET /api/organization/finance/org/kpis error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
