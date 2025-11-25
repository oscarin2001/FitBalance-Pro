-- Add estimated change duration fields to Usuario
ALTER TABLE "Usuario" ADD COLUMN "objetivo_eta_semanas" REAL;
ALTER TABLE "Usuario" ADD COLUMN "objetivo_eta_fecha" DATETIME;
