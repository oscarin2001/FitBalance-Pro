import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

// Aggregated signals for AI dashboard
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgSlug = searchParams.get("orgSlug");

    const guard = await requireOrgAccess(req, orgSlug);
    if (guard instanceof NextResponse) return guard;
    const { org } = guard;

    // clients in this org (via subscriptions to org plans)
    const clientSubs = await prisma.clientSubscription.findMany({
      where: { plan: { organizationId: org.id } },
      select: { userId: true },
    });
    const userIds = Array.from(new Set(clientSubs.map((s) => s.userId)));

    // Adherence weekly index: average of routine tracking compliance last 7 days
    const weekStart = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
    const routineRows = await prisma.routineTracking.findMany({
      where: { date: { gte: weekStart } },
      select: { compliance: true },
    } as any);
    const adherenceAvg = routineRows.length
      ? routineRows.reduce((s, r) => s + (r.compliance || 0), 0) /
        routineRows.length
      : null;

    // Hydration: average liters today for org users
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const hydrationRows = await prisma.dailyHydration.findMany({
      where: {
        date: { gte: startOfDay },
        user: { subscriptions: { some: { plan: { organizationId: org.id } } } },
      },
      select: { liters: true },
    } as any);
    const hydrationAvg = hydrationRows.length
      ? hydrationRows.reduce((s, r) => s + (r.liters || 0), 0) /
        hydrationRows.length
      : null;

    // Calories pattern: most frequent calories logged in the org (from LoggedMeal where user in userIds)
    const meals = await prisma.loggedMeal.findMany({
      where: { userId: { in: userIds } },
      select: { calories: true },
    });
    const caloriesCounts: Record<number, number> = {};
    meals.forEach((m) => {
      if (m.calories != null) {
        const c = Math.round(m.calories);
        caloriesCounts[c] = (caloriesCounts[c] || 0) + 1;
      }
    });
    const caloriesMode = Object.keys(caloriesCounts).length
      ? Number(Object.entries(caloriesCounts).sort((a, b) => b[1] - a[1])[0][0])
      : null;

    // Favorite foods (top 10) using UserFavoriteFood
    const favs = await prisma.userFavoriteFood.groupBy({
      by: ["foodId"],
      _count: { foodId: true },
      orderBy: { _count: { foodId: "desc" } },
      take: 10,
    });
    const foodIds = favs.map((f) => f.foodId);
    const foods = await prisma.food.findMany({
      where: { id: { in: foodIds } },
      select: { id: true, name: true },
    });
    const favoriteFoods = favs.map((f) => ({
      foodId: f.foodId,
      count: f._count.foodId,
      name: foods.find((x) => x.id === f.foodId)?.name || "-",
    }));

    // Meal times distribution by hour (org scope)
    const hoursCount: Record<number, number> = {};
    // we fetch with date to compute hours
    const mealsWithDate = await prisma.loggedMeal.findMany({
      where: { userId: { in: userIds } },
      select: { date: true },
    });
    mealsWithDate.forEach((m) => {
      if (m.date) {
        const h = new Date(m.date).getHours();
        hoursCount[h] = (hoursCount[h] || 0) + 1;
      }
    });
    const hours = Object.entries(hoursCount)
      .map(([h, c]) => ({ hour: Number(h), count: c }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      userCount: userIds.length,
      adherenceAvg:
        adherenceAvg != null ? Number(adherenceAvg.toFixed(1)) : null,
      hydrationAvgLitersToday:
        hydrationAvg != null ? Number(hydrationAvg.toFixed(2)) : null,
      caloriesMode,
      favoriteFoods,
      topMealHours: hours,
    });
  } catch (e) {
    console.error("GET /api/organization/ai/summary error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
