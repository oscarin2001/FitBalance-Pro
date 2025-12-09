-- Add nutritionistSubtype column to Professional
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
ALTER TABLE "Professional" ADD COLUMN "nutritionistSubtype" TEXT;
COMMIT;
PRAGMA foreign_keys=ON;
