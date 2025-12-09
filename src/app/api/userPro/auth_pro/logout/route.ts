import { NextResponse } from "next/server";

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

export async function POST(req: Request) {
  try {
    const cookieName =
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token";

    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      expireCookie(cookieName, cookieName.startsWith("__Secure-"))
    );

    // also clear other common names
    headers.append(
      "Set-Cookie",
      expireCookie("next-auth.session-token", false)
    );

    return NextResponse.json({ ok: true }, { status: 200, headers });
  } catch (e: any) {
    console.error("/api/userPro/auth_pro/logout error", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
