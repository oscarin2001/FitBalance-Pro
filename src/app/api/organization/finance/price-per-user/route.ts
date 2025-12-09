import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";
import { formatEuroFromCents } from "@/utils/currency/format-eur";
import { formatCurrency as formatBob } from "@/utils/currency/formatCurrency";

const EXCHANGE_RATES_TO_BOB: Record<string, number> = {
  EUR: 7.5, // 1 EUR ~= 7.5 BOB (static approximation)
  USD: 6.9, // 1 USD ~= 6.9 BOB (static approximation)
  BOB: 1,
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgSlug = searchParams.get("orgSlug");

    const guard = await requireOrgAccess(req, orgSlug);
    if (guard instanceof NextResponse) return guard;
    const { org } = guard;

    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        OR: [{ organizationId: org.id }, { organizationId: null }],
        isActive: true,
      },
      orderBy: { priceCents: "asc" },
    });

    const mapped = plans.map((p) => {
      const originalFormatted =
        p.currency === "EUR"
          ? formatEuroFromCents(p.priceCents)
          : p.currency === "BOB"
          ? formatBob(p.priceCents / 100)
          : `${(p.priceCents / 100).toFixed(2)} ${p.currency}`;

      const rate = EXCHANGE_RATES_TO_BOB[p.currency] ?? 1;
      const bobAmount = (p.priceCents / 100) * rate;

      return {
        id: p.id,
        name: p.name,
        priceCents: p.priceCents,
        currency: p.currency,
        original: originalFormatted,
        bob: {
          amount: Math.round(bobAmount * 100) / 100,
          formatted: formatBob(bobAmount),
          rateUsed: rate,
        },
      };
    });

    return NextResponse.json({ plans: mapped });
  } catch (e) {
    console.error("GET /api/organization/finance/price-per-user error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
