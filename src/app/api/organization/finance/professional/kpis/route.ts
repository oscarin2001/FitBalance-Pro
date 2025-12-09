import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgSlug = searchParams.get("orgSlug");
    const proId = Number(searchParams.get("professionalId"));

    const guard = await requireOrgAccess(req, orgSlug);
    if (guard instanceof NextResponse) return guard;
    const { org } = guard;

    if (!proId)
      return NextResponse.json(
        { error: "missing professionalId" },
        { status: 400 }
      );

    // Monthly earnings (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const earningsAgg = await prisma.payout.aggregate({
      _sum: { amountCents: true },
      where: {
        professionalId: proId,
        paidAt: { gte: startOfMonth },
        status: "PAID",
      },
    });

    // Earnings by client: group payouts by payment->subscription->user
    const byClient = await prisma.payout.groupBy({
      by: ["paymentId"],
      _sum: { amountCents: true },
      where: { professionalId: proId, status: "PAID" },
    });

    // Pending payouts
    const pending = await prisma.payout.aggregate({
      _sum: { amountCents: true },
      where: { professionalId: proId, status: "PENDING" },
    });

    // Payments received historically
    const received = await prisma.payout.findMany({
      where: { professionalId: proId, status: "PAID" },
      orderBy: { paidAt: "desc" },
      take: 50,
    });

    // Monthly comparison: last 6 months total payouts
    const months: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const dNext = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const agg = await prisma.payout.aggregate({
        _sum: { amountCents: true },
        where: {
          professionalId: proId,
          paidAt: { gte: d, lt: dNext },
          status: "PAID",
        },
      });
      months.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        amountCents: agg._sum.amountCents ?? 0,
      });
    }

    return NextResponse.json({
      earningsThisMonthCents: earningsAgg._sum.amountCents ?? 0,
      byClient,
      pendingCents: pending._sum.amountCents ?? 0,
      received,
      monthlyComparison: months,
    });
  } catch (e) {
    console.error("GET /api/organization/finance/professional/kpis error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
