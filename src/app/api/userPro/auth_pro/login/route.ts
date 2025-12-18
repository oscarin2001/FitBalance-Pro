import { NextResponse } from "next/server";
import { scryptSync, timingSafeEqual, randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import prisma from "@/lib/db/prisma";

function verifyPassword(password: string, stored: string) {
  const [salt, key] = (stored || "").split(":");
  if (!salt || !key) return false;
  const hashBuffer = Buffer.from(key, "hex");
  const derived = Buffer.from(
    scryptSync(password, salt, 64).toString("hex"),
    "hex"
  );
  try {
    return timingSafeEqual(hashBuffer, derived);
  } catch {
    return false;
  }
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const password = (body?.password ?? "").toString();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Contraseña inválida" },
        { status: 400 }
      );
    }

    let account = await prisma.account.findUnique({ where: { email } });

    if (!account) {
      const passwordHash = hashPassword(password);
      account = await prisma.account.create({
        data: {
          email,
          passwordHash,
          role: "CLIENT",
          accountType: "USER",
          isVerified: false,
        },
      });
    } else {
      if (!verifyPassword(password, account.passwordHash)) {
        return NextResponse.json(
          { error: "Credenciales inválidas" },
          { status: 401 }
        );
      }
    }

    const secret =
      process.env.AUTH_SECRET ||
      (process.env.NODE_ENV !== "production" ? "dev-secret" : "");
    if (!secret) {
      return NextResponse.json(
        { error: "Missing AUTH_SECRET" },
        { status: 500 }
      );
    }

    const payload = {
      sub: String(account.id),
      email: account.email,
      professionalId: account.professionalId ?? null,
    } as const;

    const token = jwt.sign(payload, secret, {
      algorithm: "HS256",
      // Sesión PRO de larga duración; sin expiración explícita en el JWT
    });
    const cookieName =
      process.env.NODE_ENV === "production"
        ? "__Secure-pro.session-token"
        : "pro.session-token";

    const res = NextResponse.json({ message: "Login OK" }, { status: 200 });
    res.cookies.set(cookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      // Cookie persistente (p.ej. ~1 año)
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  } catch (e: any) {
    console.error("POST /api/userPro/auth_pro/login error", e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
