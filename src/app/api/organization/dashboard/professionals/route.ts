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

    // Find professionals linked to org
    const professionals = await prisma.professional.findMany({
      where: {
        professionalOrganizations: { some: { organizationId: org.id } },
      },
      include: { assignments: true },
    });

    // For each professional compute metrics
    const results = await Promise.all(
      professionals.map(async (p) => {
        const adherenceAgg = await prisma.planAdherence.aggregate({
          _avg: { percentage: true },
          where: { plan: { nutritionistId: p.id } },
        });

        const activeClients = await prisma.clientProfessionalAssignment.count({
          where: { professionalId: p.id, status: "ACTIVE" },
        });

        const revenueAgg = await prisma.payout.aggregate({
          _sum: { amountCents: true },
          where: { professionalId: p.id },
        });

        const plansCount = await prisma.nutritionPlan.count({
          where: { nutritionistId: p.id },
        });

        const notesCount = await prisma.motivationalNote.count({
          where: { professionalId: p.id },
        });

        return {
          id: p.id,
          name: `${p.firstName}${p.lastName ? " " + p.lastName : ""}`,
          adherenceAvg: adherenceAgg._avg.percentage ?? 0,
          activeClients,
          revenue: (revenueAgg._sum.amountCents || 0) / 100,
          plansCount,
          notesCount,
        };
      })
    );

    // Rankings
    const byAdherence = [...results]
      .sort((a, b) => (b.adherenceAvg || 0) - (a.adherenceAvg || 0))
      .slice(0, 10);
    const byActiveClients = [...results]
      .sort((a, b) => b.activeClients - a.activeClients)
      .slice(0, 10);
    const byRevenue = [...results]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    const byPlans = [...results]
      .sort((a, b) => b.plansCount - a.plansCount)
      .slice(0, 10);
    const byNotes = [...results]
      .sort((a, b) => b.notesCount - a.notesCount)
      .slice(0, 10);

    return NextResponse.json({
      byAdherence,
      byActiveClients,
      byRevenue,
      byPlans,
      byNotes,
    });
  } catch (e) {
    console.error("GET /api/organization/dashboard/professionals error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
