import { PrismaClient } from "@prisma/client";
// Import del adaptador libsql eliminado a nivel superior para evitar que Next/Webpack
// intente parsear binarios (.node) durante el build. Lo cargamos dinámicamente
// solo cuando realmente existe TURSO_DATABASE_URL en runtime (Node server).

// Mantiene una sola instancia de PrismaClient en desarrollo para evitar múltiples conexiones
const globalForPrisma = globalThis;

// Conditional Turso adapter: if TURSO_DATABASE_URL is present we use LibSQL adapter.
function buildPrisma() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  const debug =
    process.env.DB_DEBUG === "1" || process.env.NODE_ENV === "development";

  if (tursoUrl) {
    try {
      // Usamos eval("require") para que el bundler NO siga este módulo en build.
      // eslint-disable-next-line no-eval
      const { PrismaLibSQL } = eval("require")("@prisma/adapter-libsql");
      const adapter = new PrismaLibSQL({
        url: tursoUrl,
        authToken: tursoToken,
      });
      // debug logs removed for cleaner builds
      // Pasamos también la datasource mediante `__internal.configOverride` para
      // no usar la propiedad top-level inválida `client` en el constructor.
      return new PrismaClient({
        adapter,
        __internal: {
          configOverride: (cfg) => {
            // debug traces removed to avoid noisy output during build
            return {
              ...cfg,
              datasources: {
                ...(cfg.datasources || {}),
                db: { url: tursoUrl },
              },
              client: {
                ...(cfg.client || {}),
                engineType: "binary",
                datasources: {
                  ...(cfg.client?.datasources || {}),
                  db: { url: tursoUrl },
                },
              },
            };
          },
        },
      });
    } catch (e) {
      console.error(
        "[prisma] No se pudo cargar @prisma/adapter-libsql dinámicamente:",
        e
      );
      throw new Error(
        "Fallo cargando adaptador Turso. Verifica dependencias e instalación."
      );
    }
  }

  if (process.env.VERCEL) {
    // En entorno Vercel (preview/prod) exigimos Turso.
    throw new Error(
      "Falta TURSO_DATABASE_URL en entorno Vercel. Configura las variables Turso."
    );
  }

  const datasourceUrl = process.env.DATABASE_URL || "file:./dev.db";
  // local datasource (SQLite)
  // Aplicamos override de configuración para entornos locales donde la
  // `prisma.config.ts` pueda no leerse automáticamente.
  return new PrismaClient({ adapter: { provider: "sqlite" },
    __internal: {
      configOverride: (cfg) => {
        // configOverride: merge datasources and ensure engineType consistency
        return {
          ...cfg,
          datasources: {
            ...(cfg.datasources || {}),
            db: { url: datasourceUrl },
          },
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
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = buildPrisma();
}

const prisma = globalForPrisma.prisma;

export default prisma;
