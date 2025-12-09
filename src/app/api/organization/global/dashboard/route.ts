import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [
      totalBranches,
      totalProfessionals,
      totalClients,
      activeSubscriptions,
      revenueMonthAgg,
      revenueYearAgg,
      activeSubsCount,
      cancelledSubsCount,
    ] = await Promise.all([
      prisma.branch.count(),
      prisma.professional.count(),
      prisma.user.count(),
      prisma.clientSubscription.count({
        where: { status: "ACTIVE" },
      }),
      prisma.payment.aggregate({
        _sum: { amountCents: true },
        where: { createdAt: { gte: monthStart } },
      }),
      prisma.payment.aggregate({
        _sum: { amountCents: true },
        where: { createdAt: { gte: yearStart } },
      }),
      prisma.clientSubscription.count({
        where: { status: "ACTIVE" },
      }),
      prisma.clientSubscription.count({
        where: { status: "CANCELED" },
      }),
    ]);

    const totalSubsForRate = activeSubsCount + cancelledSubsCount;
    const churnRate =
      totalSubsForRate > 0 ? (cancelledSubsCount / totalSubsForRate) * 100 : 0;
    const retentionRate = 100 - churnRate;

    return NextResponse.json({
      totalBranches,
      totalProfessionals,
      totalClients,
      activeSubscriptions,
      revenueMonth: (revenueMonthAgg._sum.amountCents ?? 0) / 100,
      revenueYear: (revenueYearAgg._sum.amountCents ?? 0) / 100,
      retentionRate,
      churnRate,
    });
  } catch (error) {
    console.error("Error cargando KPIs globales", error);
    return NextResponse.json(
      { error: "No se pudieron cargar las métricas globales" },
      { status: 500 }
    );
  }
}
