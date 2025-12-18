import { PrismaClient } from "@prisma/client";
// Fuerza uso de SQLite local en desarrollo (ignora Turso)
// Si deseas cambiar a Turso en producción, crea otro archivo e impórtalo explícitamente.
const datasourceUrl = process.env.DATABASE_URL || "file:./dev.db";
// En Prisma 7 la URL de la datasource se preferirá desde `prisma.config.ts`.
// Para garantizar comportamiento idéntico en entornos donde no se cargue
// automáticamente la configuración, pasamos la URL dentro de la opción
// `client.datasources` (la forma esperada por Prisma 7).
const prisma = new PrismaClient({
  __internal: {
    configOverride: (cfg) => {
        // configOverride: merge datasources and ensure engineType consistency
      return {
        ...cfg,
        datasources: { ...(cfg.datasources || {}), db: { url: datasourceUrl } },
        client: {
          ...(cfg.client || {}),
          engineType: "binary",
          datasources: {
            ...(cfg.client?.datasources || {}),
            db: { url: datasourceUrl },
          },
        },
      };
    },
  },
});

export default prisma;
