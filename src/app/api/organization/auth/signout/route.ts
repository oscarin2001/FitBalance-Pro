import { NextResponse } from "next/server";

// Small helper to build an expired Set-Cookie header value
function expireCookie(name: string, secure = false) {
  const parts = [
    `${name}=; Max-Age=0`,
    "Path=/",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "SameSite=Lax",
    "HttpOnly",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Clear common NextAuth / legacy cookie names used in this app
    const cookiesToExpire = [
      "authjs.session-token",
      "__Secure-authjs.session-token",
      "next-auth.session-token",
    ];

    const headers = new Headers();
    for (const name of cookiesToExpire) {
      // Mark secure flag if the cookie name uses __Secure- prefix
      const secure = name.startsWith("__Secure-");
      headers.append("Set-Cookie", expireCookie(name, secure));
    }

    return NextResponse.json({ ok: true }, { status: 200, headers });
  } catch (e: any) {
    console.error("/api/organization/auth/signout error", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
