import { NextResponse } from "next/server";
export async function GET(_: Request, { params }: { params: { orgSlug: string } }) {
  return NextResponse.json({ ok: true, scope: `v1/organization/${params.orgSlug}/roles` });
}
