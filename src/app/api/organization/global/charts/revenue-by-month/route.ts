import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const payments = await prisma.payment.findMany({
      where: { createdAt: { gte: yearStart } },
      select: { amountCents: true, createdAt: true },
    });

    const byMonth = new Map<string, number>();

    for (const p of payments) {
      const key = `${p.createdAt.getFullYear()}-${String(
        p.createdAt.getMonth() + 1
      ).padStart(2, "0")}`;
      byMonth.set(
        key,
        (byMonth.get(key) || 0) + (p.amountCents ? p.amountCents / 100 : 0)
      );
    }

    const result = Array.from(byMonth.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([month, amount]) => ({ month, amount }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error cargando ingresos globales por mes", error);
    return NextResponse.json(
      { error: "No se pudieron cargar los ingresos" },
      { status: 500 }
    );
  }
}
