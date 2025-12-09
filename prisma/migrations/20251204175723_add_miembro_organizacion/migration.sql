-- CreateTable
CREATE TABLE "MiembroOrganizacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizacionId" INTEGER NOT NULL,
    "authId" INTEGER NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'MIEMBRO',
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "invitadoPorId" INTEGER,
    "tokenInvitacion" TEXT,
    "expiraEn" DATETIME,
    "aceptadoEn" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MiembroOrganizacion_organizacionId_fkey" FOREIGN KEY ("organizacionId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MiembroOrganizacion_authId_fkey" FOREIGN KEY ("authId") REFERENCES "Auth" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MiembroOrganizacion_invitadoPorId_fkey" FOREIGN KEY ("invitadoPorId") REFERENCES "Auth" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MiembroOrganizacion_tokenInvitacion_key" ON "MiembroOrganizacion"("tokenInvitacion");

-- CreateIndex
CREATE UNIQUE INDEX "MiembroOrganizacion_organizacionId_authId_key" ON "MiembroOrganizacion"("organizacionId", "authId");
