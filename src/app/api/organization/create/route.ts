import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Gone - endpoint moved to /api/organization/management/v1/create",
    },
    { status: 410 }
  );
}
