import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import jwt from "jsonwebtoken";
import { LATAM_BY_CODE, normalizePhone } from "@/lib/db/auth_userPro/latam";
import { orgDefaultMetadata } from "@/lib/db/auth_userPro/org";

function getTokenCookie(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const name =
    process.env.NODE_ENV === "production"
      ? "__Secure-pro.session-token"
      : "pro.session-token";
  const m = cookie.split(/;\s*/).find((c) => c.startsWith(name + "="));
  return m ? decodeURIComponent(m.split("=")[1]) : null;
}

function slugify(input: string) {
  return (input || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function POST(req: Request) {
  try {
    const token = getTokenCookie(req);
    if (!token)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    const secret = process.env.AUTH_SECRET;
    if (!secret)
      return NextResponse.json({ error: "Config inválida" }, { status: 500 });
    let payload: any = null;
    try {
      payload = jwt.verify(token, secret);
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const nombre = (body?.nombre ?? "").toString().trim();
    const apellidos = (body?.apellidos ?? "").toString().trim() || null;
    const genero = (body?.genero ?? "").toString().trim();
    const edad = Number(body?.edad ?? NaN);
    const tipo_profesional = (body?.tipo_profesional ?? "").toString().trim();
    const pais_code = (body?.pais_code ?? "").toString().trim().toUpperCase();
    const telefono_raw = (body?.telefono ?? "").toString().trim();
    const usage = (body?.usage ?? "").toString().trim().toUpperCase();
    const organizationName = (body?.organizationName ?? "").toString().trim();
    const orgType = (body?.orgType ?? "").toString().trim();
    const orgRole = (body?.orgRole ?? "").toString().trim().toUpperCase();
    const latam = LATAM_BY_CODE[pais_code];
    const pais = latam ? latam.name : null;
    const telefono = latam
      ? normalizePhone(pais_code, telefono_raw)
      : telefono_raw || null;

    const errors: Record<string, string> = {};
    if (!nombre) errors.nombre = "Nombre requerido";
    if (!genero) errors.genero = "Género requerido";
    if (!Number.isFinite(edad) || edad < 16 || edad > 100)
      errors.edad = "Edad entre 16 y 100";
    if (!["NUTRICIONISTA", "COACH"].includes(tipo_profesional))
      errors.tipo_profesional = "Perfil inválido";
    if (pais_code && !latam) errors.pais_code = "País no soportado";
    if (telefono_raw && latam && !telefono?.startsWith(`+${latam.prefix}`))
      errors.telefono = "Teléfono inválido";
    if (Object.keys(errors).length)
      return NextResponse.json({ errors }, { status: 400 });

    // Validación adicional: si viene usage ORGANIZACION, exigir nombre de la organización
    if (usage === "ORGANIZACION") {
      if (!organizationName || organizationName.toString().trim().length < 2) {
        return NextResponse.json(
          { error: "Nombre de la organización requerido" },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const approxYear = now.getFullYear() - edad;
    const fecha_nacimiento = new Date(approxYear, 0, 1);

    const email = (payload?.email ?? "").toString().toLowerCase();
    if (!email)
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });

    const account = await prisma.account.findUnique({ where: { email } });
    if (!account)
      return NextResponse.json(
        { error: "Cuenta no encontrada" },
        { status: 404 }
      );

    const proType =
      tipo_profesional === "NUTRICIONISTA" ? "NUTRITIONIST" : "COACH";
    const allowedOrgRoles = new Set([
      "OWNER",
      "ADMIN",
      "NUTRITIONIST",
      "COACH",
      "MEMBER",
    ]);

    const result = await prisma.$transaction(async (tx) => {
      const pro = await tx.professional.upsert({
        where: { email },
        update: {
          firstName: nombre,
          lastName: apellidos,
          gender: genero,
          birthDate: fecha_nacimiento,
          type: proType as any,
          country: pais || undefined,
          phone: telefono || undefined,
        },
        create: {
          firstName: nombre,
          lastName: apellidos,
          gender: genero,
          birthDate: fecha_nacimiento,
          type: proType as any,
          modality: "INDEPENDENT",
          email,
          country: pais || undefined,
          phone: telefono || undefined,
        },
      });

      let userId: number | null = account.userId ?? null;
      let organizationId: number | null = null;
      let orgSlugTx: string | null = null;

      if (usage === "ORGANIZACION") {
        if (!userId) {
          const user = await tx.user.create({
            data: {
              firstName: nombre,
              lastName: apellidos || nombre,
              birthDate: fecha_nacimiento,
              gender: genero,
              country: pais || undefined,
            },
          });
          userId = user.id;
        }

        const slugBase =
          slugify(String(organizationName)) || `org-${Date.now()}`;
        let candidate = slugBase;
        let idx = 1;
        while (
          await tx.organization.findUnique({ where: { slug: candidate } })
        ) {
          candidate = `${slugBase}-${idx++}`;
        }
        const slug = candidate;

        const baseMeta: any = orgType ? orgDefaultMetadata(orgType as any) : {};
        const resolvedOrgRole = allowedOrgRoles.has(orgRole)
          ? orgRole
          : proType;

        const org = await tx.organization.create({
          data: {
            name: String(organizationName),
            slug,
            ownerId: account.id,
            metadata: baseMeta,
          },
        });

        await tx.organizationMember.create({
          data: {
            organizationId: org.id,
            accountId: account.id,
            role: resolvedOrgRole as any,
            status: "ACTIVE",
            invitationToken: null,
          },
        });

        await tx.professional.update({
          where: { id: pro.id },
          data: { organizationId: org.id },
        });

        organizationId = org.id;
        orgSlugTx = org.slug;
      } else {
        await tx.professional.update({
          where: { id: pro.id },
          data: { organizationId: null },
        });
      }

      await tx.account.update({
        where: { id: account.id },
        data: {
          professionalId: pro.id,
          userId: userId ?? undefined,
          role: proType,
          accountType: "PROFESSIONAL",
        },
      });

      return { profesional: pro, userId, organizationId, orgSlug: orgSlugTx };
    });

    const orgSlug = result.orgSlug;

    return NextResponse.json({
      ok: true,
      usage,
      orgType: orgType || null,
      orgRole: orgRole || null,
      organizationId: result.organizationId,
      orgSlug,
      usuarioId: result.userId,
      profesional: result.profesional,
    });
  } catch (e: any) {
    console.error("POST /api/userPro/auth_pro/basics error:", e);
    // En desarrollo devolvemos el mensaje de error para ayudar a depurar.
    const msg = e?.message || String(e) || "Error del servidor";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
