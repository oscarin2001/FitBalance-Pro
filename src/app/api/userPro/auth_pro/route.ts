import { NextResponse } from "next/server";
import { randomBytes, scryptSync } from "crypto";
import prisma from "@/lib/db/prisma";

function badRequest(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function toInt(v: any, def: number | null = null) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const nombre = (body?.nombre ?? "").toString().trim();
    const apellidos = (body?.apellidos ?? "").toString().trim() || null;
    const emailRaw = (body?.email ?? "").toString().trim();
    const email = emailRaw.toLowerCase();
    const password = (body?.password ?? "").toString();
    const genero = (body?.genero ?? "").toString().trim();
    const edad = toInt(body?.edad);
    const tipo_profesional = (body?.tipo_profesional ?? "").toString().trim();
    const pais = (body?.pais ?? "").toString().trim() || null;

    const errors: Record<string, string> = {};
    if (!nombre) errors.nombre = "Nombre requerido";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Email inválido";
    if (!password || password.length < 8)
      errors.password = "Contraseña mínima 8";
    if (!genero) errors.genero = "Género requerido";
    if (edad == null || edad < 16 || edad > 100)
      errors.edad = "Edad entre 16 y 100";
    if (!["NUTRICIONISTA", "COACH"].includes(tipo_profesional))
      errors.tipo_profesional = "Perfil inválido";
    if (Object.keys(errors).length)
      return NextResponse.json({ errors }, { status: 400 });

    const now = new Date();
    const approxYear = now.getFullYear() - (edad as number);
    const fecha_nacimiento = new Date(approxYear, 0, 1);

    const existingAccount = await prisma.account.findUnique({
      where: { email },
    });
    if (existingAccount) return badRequest("Email ya registrado", 409);

    const existingPro = await prisma.professional
      .findUnique({ where: { email } })
      .catch(() => null);
    if (existingPro)
      return badRequest("Email ya asociado a un profesional", 409);

    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    const password_hash = `${salt}:${hash}`;

    const proType =
      tipo_profesional === "NUTRICIONISTA" ? "NUTRITIONIST" : "COACH";

    const result = await prisma.$transaction(async (tx) => {
      const pro = await tx.professional.create({
        data: {
          firstName: nombre,
          lastName: apellidos,
          gender: genero,
          birthDate: fecha_nacimiento,
          type: proType as any,
          modality: "INDEPENDENT",
          email,
          country: pais || undefined,
        },
      });

      const account = await tx.account.create({
        data: {
          email,
          passwordHash: password_hash,
          role: proType,
          accountType: "PROFESSIONAL",
          isVerified: false,
          professional: { connect: { id: pro.id } },
        },
      });

      return { proId: pro.id, authId: account.id };
    });

    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
