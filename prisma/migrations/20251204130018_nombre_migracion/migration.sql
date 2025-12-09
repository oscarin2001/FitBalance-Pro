-- CreateTable
CREATE TABLE "Organization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Organization_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Organization_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Role" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "permissions" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Centro" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "direccion" TEXT,
    "clientes_estimados" INTEGER,
    "adminId" INTEGER,
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" DATETIME NOT NULL,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "Centro_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Profesional" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Centro_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Centro_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Profesional" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT,
    "fecha_nacimiento" DATETIME,
    "sexo" TEXT,
    "tipo_profesional" TEXT NOT NULL,
    "modalidad" TEXT NOT NULL DEFAULT 'INDEPENDIENTE',
    "email" TEXT,
    "telefono" TEXT,
    "pais" TEXT,
    "centroId" INTEGER,
    "organizationId" INTEGER,
    "clientes_asignados" INTEGER NOT NULL DEFAULT 0,
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "Profesional_centroId_fkey" FOREIGN KEY ("centroId") REFERENCES "Centro" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Profesional_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Profesional_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Profesional_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClienteProfesional" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "profesionalId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "fecha_asignado" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notas" TEXT,
    CONSTRAINT "ClienteProfesional_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClienteProfesional_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Profesional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CondicionMedica" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "detalle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CondicionMedica_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RestriccionAlimentaria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "detalle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RestriccionAlimentaria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PreferenciaAlimentaria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "detalle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PreferenciaAlimentaria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegistroActividad" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "nivel_actividad" TEXT,
    "horas_sueno" REAL,
    "restricciones" TEXT,
    "lesiones" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistroActividad_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanNutricional" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "nutricionistaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "objetivo" TEXT,
    "fecha_inicio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" DATETIME,
    "calorias_totales" INTEGER,
    "proteinas" REAL,
    "carbohidratos" REAL,
    "grasas" REAL,
    "micronutrientes" JSONB,
    "notas" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "PlanNutricional_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlanNutricional_nutricionistaId_fkey" FOREIGN KEY ("nutricionistaId") REFERENCES "Profesional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlanNutricional_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PlanNutricional_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanNutricionalComida" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planId" INTEGER NOT NULL,
    "orden" INTEGER DEFAULT 0,
    "etiqueta" TEXT,
    "nombre" TEXT,
    "calorias" INTEGER,
    "proteinas" REAL,
    "carbohidratos" REAL,
    "grasas" REAL,
    "ingredientes" JSONB,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "PlanNutricionalComida_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlanNutricional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlanNutricionalComida_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PlanNutricionalComida_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanAdherencia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planId" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "porcentaje" REAL,
    "comentarios" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PARCIAL',
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "PlanAdherencia_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlanNutricional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlanAdherencia_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PlanAdherencia_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RutinaEjercicio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "coachId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "objetivo" TEXT,
    "tipo" TEXT NOT NULL,
    "frecuencia_sem" INTEGER,
    "dias_semana" JSONB,
    "notas" TEXT,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "RutinaEjercicio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RutinaEjercicio_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Profesional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RutinaEjercicio_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RutinaEjercicio_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RutinaBloque" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rutinaId" INTEGER NOT NULL,
    "dia" TEXT NOT NULL,
    "intensidad" TEXT,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "RutinaBloque_rutinaId_fkey" FOREIGN KEY ("rutinaId") REFERENCES "RutinaEjercicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RutinaBloque_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RutinaBloque_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EjercicioRutina" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bloqueId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "series" INTEGER,
    "repeticiones" INTEGER,
    "duracion_min" INTEGER,
    "peso_kg" REAL,
    "descanso_seg" INTEGER,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "EjercicioRutina_bloqueId_fkey" FOREIGN KEY ("bloqueId") REFERENCES "RutinaBloque" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EjercicioRutina_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EjercicioRutina_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeguimientoRutina" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rutinaId" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "cumplimiento" REAL,
    "comentarios" TEXT,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "SeguimientoRutina_rutinaId_fkey" FOREIGN KEY ("rutinaId") REFERENCES "RutinaEjercicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SeguimientoRutina_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SeguimientoRutina_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotaMotivacional" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "profesionalId" INTEGER NOT NULL,
    "mensaje" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "NotaMotivacional_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NotaMotivacional_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Profesional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NotaMotivacional_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "NotaMotivacional_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alimento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT,
    "categoria_enum" TEXT,
    "calorias" REAL,
    "proteinas" REAL,
    "carbohidratos" REAL,
    "grasas" REAL,
    "porcion" TEXT,
    "region" TEXT,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "Alimento_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Alimento_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Alimento" ("calorias", "carbohidratos", "categoria", "categoria_enum", "grasas", "id", "nombre", "porcion", "proteinas", "region") SELECT "calorias", "carbohidratos", "categoria", "categoria_enum", "grasas", "id", "nombre", "porcion", "proteinas", "region" FROM "Alimento";
DROP TABLE "Alimento";
ALTER TABLE "new_Alimento" RENAME TO "Alimento";
CREATE TABLE "new_Auth" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER,
    "profesionalId" INTEGER,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'CLIENTE',
    "roleId" INTEGER,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    "token_verificacion" TEXT,
    "reset_token" TEXT,
    "last_login" DATETIME,
    CONSTRAINT "Auth_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Auth_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Profesional" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Auth_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Auth_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Auth_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Auth" ("email", "id", "last_login", "password_hash", "reset_token", "token_verificacion", "usuarioId", "verificado") SELECT "email", "id", "last_login", "password_hash", "reset_token", "token_verificacion", "usuarioId", "verificado" FROM "Auth";
DROP TABLE "Auth";
ALTER TABLE "new_Auth" RENAME TO "Auth";
CREATE UNIQUE INDEX "Auth_usuarioId_key" ON "Auth"("usuarioId");
CREATE UNIQUE INDEX "Auth_profesionalId_key" ON "Auth"("profesionalId");
CREATE UNIQUE INDEX "Auth_email_key" ON "Auth"("email");
CREATE TABLE "new_Comida" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "comida_tipo" TEXT,
    "etiqueta" TEXT,
    "orden" INTEGER,
    "recetaId" INTEGER,
    "alimentoId" INTEGER,
    "gramos" REAL,
    "calorias" REAL,
    "proteinas" REAL,
    "carbohidratos" REAL,
    "grasas" REAL,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "Comida_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comida_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "Receta" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Comida_alimentoId_fkey" FOREIGN KEY ("alimentoId") REFERENCES "Alimento" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Comida_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Comida_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Comida" ("alimentoId", "calorias", "carbohidratos", "comida_tipo", "fecha", "gramos", "grasas", "id", "proteinas", "recetaId", "usuarioId") SELECT "alimentoId", "calorias", "carbohidratos", "comida_tipo", "fecha", "gramos", "grasas", "id", "proteinas", "recetaId", "usuarioId" FROM "Comida";
DROP TABLE "Comida";
ALTER TABLE "new_Comida" RENAME TO "Comida";
CREATE TABLE "new_CumplimientoComida" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "comida_tipo" TEXT,
    "etiqueta" TEXT,
    "orden" INTEGER,
    "cumplido" BOOLEAN NOT NULL DEFAULT false,
    "hora_real" DATETIME,
    "planNutricionalId" INTEGER,
    "slotId" INTEGER,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "CumplimientoComida_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CumplimientoComida_planNutricionalId_fkey" FOREIGN KEY ("planNutricionalId") REFERENCES "PlanNutricional" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CumplimientoComida_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "PlanNutricionalComida" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CumplimientoComida_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CumplimientoComida_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CumplimientoComida" ("comida_tipo", "cumplido", "fecha", "hora_real", "id", "usuarioId") SELECT "comida_tipo", "cumplido", "fecha", "hora_real", "id", "usuarioId" FROM "CumplimientoComida";
DROP TABLE "CumplimientoComida";
ALTER TABLE "new_CumplimientoComida" RENAME TO "CumplimientoComida";
CREATE INDEX "CumplimientoComida_usuarioId_fecha_idx" ON "CumplimientoComida"("usuarioId", "fecha");
CREATE INDEX "CumplimientoComida_slotId_fecha_idx" ON "CumplimientoComida"("slotId", "fecha");
CREATE TABLE "new_CumplimientoDieta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "cumplido" BOOLEAN NOT NULL,
    "planNutricionalId" INTEGER,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "CumplimientoDieta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CumplimientoDieta_planNutricionalId_fkey" FOREIGN KEY ("planNutricionalId") REFERENCES "PlanNutricional" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CumplimientoDieta_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CumplimientoDieta_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CumplimientoDieta" ("cumplido", "fecha", "id", "usuarioId") SELECT "cumplido", "fecha", "id", "usuarioId" FROM "CumplimientoDieta";
DROP TABLE "CumplimientoDieta";
ALTER TABLE "new_CumplimientoDieta" RENAME TO "CumplimientoDieta";
CREATE TABLE "new_HidratacionDia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "litros" REAL NOT NULL DEFAULT 0,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "HidratacionDia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HidratacionDia_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HidratacionDia_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_HidratacionDia" ("completado", "fecha", "id", "litros", "usuarioId") SELECT "completado", "fecha", "id", "litros", "usuarioId" FROM "HidratacionDia";
DROP TABLE "HidratacionDia";
ALTER TABLE "new_HidratacionDia" RENAME TO "HidratacionDia";
CREATE INDEX "HidratacionDia_usuarioId_fecha_idx" ON "HidratacionDia"("usuarioId", "fecha");
CREATE TABLE "new_PlanComida" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "comida_tipo" TEXT,
    "etiqueta" TEXT,
    "orden" INTEGER,
    "recetaId" INTEGER NOT NULL,
    "porciones" INTEGER NOT NULL DEFAULT 1,
    "overrides" JSONB,
    "planNutricionalId" INTEGER,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "PlanComida_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlanComida_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "Receta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlanComida_planNutricionalId_fkey" FOREIGN KEY ("planNutricionalId") REFERENCES "PlanNutricional" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PlanComida_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PlanComida_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PlanComida" ("comida_tipo", "id", "overrides", "porciones", "recetaId", "usuarioId") SELECT "comida_tipo", "id", "overrides", "porciones", "recetaId", "usuarioId" FROM "PlanComida";
DROP TABLE "PlanComida";
ALTER TABLE "new_PlanComida" RENAME TO "PlanComida";
CREATE INDEX "PlanComida_usuarioId_orden_idx" ON "PlanComida"("usuarioId", "orden");
CREATE TABLE "new_ProgresoCorporal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "profesionalId" INTEGER,
    "fecha" DATETIME NOT NULL,
    "peso_kg" REAL,
    "grasa_percent" REAL,
    "musculo_percent" REAL,
    "agua_percent" REAL,
    "imc" REAL,
    "cintura_cm" REAL,
    "cadera_cm" REAL,
    "cuello_cm" REAL,
    "pecho_cm" REAL,
    "brazo_cm" REAL,
    "muslo_cm" REAL,
    "gluteo_cm" REAL,
    "foto_url" TEXT,
    "notas" TEXT,
    "fuente" TEXT,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "ProgresoCorporal_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProgresoCorporal_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Profesional" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProgresoCorporal_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProgresoCorporal_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProgresoCorporal" ("agua_percent", "brazo_cm", "cadera_cm", "cintura_cm", "cuello_cm", "fecha", "foto_url", "fuente", "gluteo_cm", "grasa_percent", "id", "imc", "musculo_percent", "muslo_cm", "notas", "pecho_cm", "peso_kg", "usuarioId") SELECT "agua_percent", "brazo_cm", "cadera_cm", "cintura_cm", "cuello_cm", "fecha", "foto_url", "fuente", "gluteo_cm", "grasa_percent", "id", "imc", "musculo_percent", "muslo_cm", "notas", "pecho_cm", "peso_kg", "usuarioId" FROM "ProgresoCorporal";
DROP TABLE "ProgresoCorporal";
ALTER TABLE "new_ProgresoCorporal" RENAME TO "ProgresoCorporal";
CREATE INDEX "ProgresoCorporal_usuarioId_fecha_idx" ON "ProgresoCorporal"("usuarioId", "fecha");
CREATE INDEX "ProgresoCorporal_profesionalId_idx" ON "ProgresoCorporal"("profesionalId");
CREATE UNIQUE INDEX "ProgresoCorporal_usuarioId_fecha_key" ON "ProgresoCorporal"("usuarioId", "fecha");
CREATE TABLE "new_Receta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "instrucciones" TEXT,
    "porciones" INTEGER NOT NULL DEFAULT 1,
    "tipo" TEXT,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "Receta_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Receta_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Receta" ("id", "instrucciones", "nombre", "porciones", "tipo") SELECT "id", "instrucciones", "nombre", "porciones", "tipo" FROM "Receta";
DROP TABLE "Receta";
ALTER TABLE "new_Receta" RENAME TO "Receta";
CREATE TABLE "new_RecetaAlimento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recetaId" INTEGER NOT NULL,
    "alimentoId" INTEGER NOT NULL,
    "gramos" REAL NOT NULL,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "RecetaAlimento_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "Receta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RecetaAlimento_alimentoId_fkey" FOREIGN KEY ("alimentoId") REFERENCES "Alimento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RecetaAlimento_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecetaAlimento_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RecetaAlimento" ("alimentoId", "gramos", "id", "recetaId") SELECT "alimentoId", "gramos", "id", "recetaId" FROM "RecetaAlimento";
DROP TABLE "RecetaAlimento";
ALTER TABLE "new_RecetaAlimento" RENAME TO "RecetaAlimento";
CREATE TABLE "new_Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "fecha_nacimiento" DATETIME NOT NULL,
    "sexo" TEXT NOT NULL,
    "altura_cm" REAL,
    "peso_kg" REAL,
    "objetivo" TEXT,
    "nivel_actividad" TEXT,
    "pais" TEXT,
    "peso_objetivo_kg" REAL,
    "velocidad_cambio" TEXT,
    "terminos_aceptados" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_step" TEXT,
    "preferencias_alimentos" JSONB,
    "kcal_objetivo" REAL,
    "proteinas_g_obj" REAL,
    "grasas_g_obj" REAL,
    "carbohidratos_g_obj" REAL,
    "agua_litros_obj" REAL,
    "objetivo_eta_semanas" REAL,
    "objetivo_eta_fecha" DATETIME,
    "plan_ai" JSONB,
    "measurement_interval_weeks" INTEGER,
    "dias_dieta" JSONB,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "Usuario_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Usuario_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Usuario" ("agua_litros_obj", "altura_cm", "apellido", "carbohidratos_g_obj", "dias_dieta", "fecha_creacion", "fecha_nacimiento", "grasas_g_obj", "id", "kcal_objetivo", "measurement_interval_weeks", "nivel_actividad", "nombre", "objetivo", "objetivo_eta_fecha", "objetivo_eta_semanas", "onboarding_completed", "onboarding_step", "pais", "peso_kg", "peso_objetivo_kg", "plan_ai", "preferencias_alimentos", "proteinas_g_obj", "sexo", "terminos_aceptados", "updatedAt", "velocidad_cambio") SELECT "agua_litros_obj", "altura_cm", "apellido", "carbohidratos_g_obj", "dias_dieta", "fecha_creacion", "fecha_nacimiento", "grasas_g_obj", "id", "kcal_objetivo", "measurement_interval_weeks", "nivel_actividad", "nombre", "objetivo", "objetivo_eta_fecha", "objetivo_eta_semanas", "onboarding_completed", "onboarding_step", "pais", "peso_kg", "peso_objetivo_kg", "plan_ai", "preferencias_alimentos", "proteinas_g_obj", "sexo", "terminos_aceptados", "updatedAt", "velocidad_cambio" FROM "Usuario";
DROP TABLE "Usuario";
ALTER TABLE "new_Usuario" RENAME TO "Usuario";
CREATE TABLE "new_UsuarioAlimento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "alimentoId" INTEGER NOT NULL,
    "categoria" TEXT,
    "categoria_enum" TEXT,
    "prioridad" INTEGER,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "UsuarioAlimento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UsuarioAlimento_alimentoId_fkey" FOREIGN KEY ("alimentoId") REFERENCES "Alimento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UsuarioAlimento_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "UsuarioAlimento_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UsuarioAlimento" ("alimentoId", "categoria", "categoria_enum", "id", "prioridad", "usuarioId") SELECT "alimentoId", "categoria", "categoria_enum", "id", "prioridad", "usuarioId" FROM "UsuarioAlimento";
DROP TABLE "UsuarioAlimento";
ALTER TABLE "new_UsuarioAlimento" RENAME TO "UsuarioAlimento";
CREATE UNIQUE INDEX "UsuarioAlimento_usuarioId_alimentoId_key" ON "UsuarioAlimento"("usuarioId", "alimentoId");
CREATE TABLE "new_UsuarioBebida" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "bebidaId" INTEGER NOT NULL,
    "ml" INTEGER NOT NULL,
    "momento" TEXT,
    "creadoPorId" INTEGER,
    "modificadoPorId" INTEGER,
    CONSTRAINT "UsuarioBebida_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UsuarioBebida_bebidaId_fkey" FOREIGN KEY ("bebidaId") REFERENCES "Alimento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UsuarioBebida_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "UsuarioBebida_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UsuarioBebida" ("bebidaId", "id", "ml", "momento", "usuarioId") SELECT "bebidaId", "id", "ml", "momento", "usuarioId" FROM "UsuarioBebida";
DROP TABLE "UsuarioBebida";
ALTER TABLE "new_UsuarioBebida" RENAME TO "UsuarioBebida";
CREATE INDEX "UsuarioBebida_usuarioId_idx" ON "UsuarioBebida"("usuarioId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Profesional_email_key" ON "Profesional"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteProfesional_usuarioId_profesionalId_tipo_key" ON "ClienteProfesional"("usuarioId", "profesionalId", "tipo");

-- CreateIndex
CREATE INDEX "PlanNutricionalComida_planId_orden_idx" ON "PlanNutricionalComida"("planId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "PlanAdherencia_planId_fecha_key" ON "PlanAdherencia"("planId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "SeguimientoRutina_rutinaId_fecha_key" ON "SeguimientoRutina"("rutinaId", "fecha");
