import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const pros = await prisma.professional.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        organization: true,
        payouts: true,
        assignments: true,
      },
    });

    const mapped = pros.map((p) => {
      const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ");
      const payoutsTotal = p.payouts.reduce(
        (acc, cur) => acc + (cur.amount || 0),
        0
      );
      const clientsCount = p.assignments.length;

      return {
        id: p.id,
        name: fullName || "Sin nombre",
        orgName: p.organization?.name || "Independiente",
        payoutsTotal,
        clientsCount,
        adherenceScore: null as number | null,
      };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error cargando profesionales globales", error);
    return NextResponse.json(
      { error: "No se pudieron cargar los profesionales" },
      { status: 500 }
    );
  }
}
