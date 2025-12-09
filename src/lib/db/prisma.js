import { PrismaClient } from "@prisma/client";
// Fuerza uso de SQLite local en desarrollo (ignora Turso)
// Si deseas cambiar a Turso en producción, crea otro archivo e impórtalo explícitamente.
const datasourceUrl = process.env.DATABASE_URL || "file:./dev.db";
const prisma = new PrismaClient({ datasources: { db: { url: datasourceUrl } } });

export default prisma;
