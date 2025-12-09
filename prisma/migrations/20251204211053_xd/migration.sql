/*
  Warnings:

  - You are about to drop the `Alimento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Auth` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Centro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClienteProfesional` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comida` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CondicionMedica` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CumplimientoComida` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CumplimientoDieta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EjercicioRutina` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HidratacionDia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MiembroOrganizacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NotaMotivacional` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlanAdherencia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlanComida` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlanNutricional` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlanNutricionalComida` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PreferenciaAlimentaria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Profesional` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProgresoCorporal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Receta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RecetaAlimento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RegistroActividad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RestriccionAlimentaria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RutinaBloque` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RutinaEjercicio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SeguimientoRutina` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UsuarioAlimento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UsuarioBebida` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `creadoPorId` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `modificadoPorId` on the `Organization` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Auth_email_key";

-- DropIndex
DROP INDEX "Auth_profesionalId_key";

-- DropIndex
DROP INDEX "Auth_usuarioId_key";

-- DropIndex
DROP INDEX "ClienteProfesional_usuarioId_profesionalId_tipo_key";

-- DropIndex
DROP INDEX "CumplimientoComida_slotId_fecha_idx";

-- DropIndex
DROP INDEX "CumplimientoComida_usuarioId_fecha_idx";

-- DropIndex
DROP INDEX "HidratacionDia_usuarioId_fecha_idx";

-- DropIndex
DROP INDEX "MiembroOrganizacion_organizacionId_authId_key";

-- DropIndex
DROP INDEX "MiembroOrganizacion_tokenInvitacion_key";

-- DropIndex
DROP INDEX "PlanAdherencia_planId_fecha_key";

-- DropIndex
DROP INDEX "PlanComida_usuarioId_orden_idx";

-- DropIndex
DROP INDEX "PlanNutricionalComida_planId_orden_idx";

-- DropIndex
DROP INDEX "Profesional_email_key";

-- DropIndex
DROP INDEX "ProgresoCorporal_usuarioId_fecha_key";

-- DropIndex
DROP INDEX "ProgresoCorporal_profesionalId_idx";

-- DropIndex
DROP INDEX "ProgresoCorporal_usuarioId_fecha_idx";

-- DropIndex
DROP INDEX "Role_slug_key";

-- DropIndex
DROP INDEX "Role_name_key";

-- DropIndex
DROP INDEX "SeguimientoRutina_rutinaId_fecha_key";

-- DropIndex
DROP INDEX "UsuarioAlimento_usuarioId_alimentoId_key";

-- DropIndex
DROP INDEX "UsuarioBebida_usuarioId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Alimento";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Auth";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Centro";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ClienteProfesional";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Comida";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CondicionMedica";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CumplimientoComida";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CumplimientoDieta";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EjercicioRutina";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "HidratacionDia";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MiembroOrganizacion";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "NotaMotivacional";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PlanAdherencia";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PlanComida";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PlanNutricional";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PlanNutricionalComida";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PreferenciaAlimentaria";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Profesional";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProgresoCorporal";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Receta";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RecetaAlimento";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RegistroActividad";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RestriccionAlimentaria";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Role";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RutinaBloque";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RutinaEjercicio";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SeguimientoRutina";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Usuario";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "UsuarioAlimento";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "UsuarioBebida";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "accountType" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "resetToken" TEXT,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "userId" INTEGER,
    "professionalId" INTEGER,
    "permissionRoleId" INTEGER,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Account_permissionRoleId_fkey" FOREIGN KEY ("permissionRoleId") REFERENCES "PermissionRole" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PermissionRole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "permissions" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "heightCm" REAL,
    "weightKg" REAL,
    "country" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "ClientProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "goal" TEXT,
    "activityLevel" TEXT,
    "targetWeightKg" REAL,
    "weightChangeSpeed" TEXT,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" TEXT,
    "targetCalories" REAL,
    "targetProteinG" REAL,
    "targetFatG" REAL,
    "targetCarbsG" REAL,
    "targetWaterLiters" REAL,
    "estimatedWeeksToGoal" REAL,
    "targetDate" DATETIME,
    "aiPlan" JSONB,
    "measurementIntervalWeeks" INTEGER,
    "dietDays" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "invitedById" INTEGER,
    "invitationToken" TEXT,
    "invitationExpiresAt" DATETIME,
    "acceptedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrganizationMember_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrganizationMember_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Professional" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "birthDate" DATETIME,
    "gender" TEXT,
    "type" TEXT NOT NULL,
    "modality" TEXT NOT NULL DEFAULT 'INDEPENDENT',
    "email" TEXT,
    "phone" TEXT,
    "country" TEXT,
    "organizationId" INTEGER,
    "clientsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Professional_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClientProfessionalAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "professionalId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "ClientProfessionalAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClientProfessionalAssignment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NutritionPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "nutritionistId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "totalCalories" INTEGER,
    "proteinG" REAL,
    "carbsG" REAL,
    "fatG" REAL,
    "micronutrients" JSONB,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "NutritionPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NutritionPlan_nutritionistId_fkey" FOREIGN KEY ("nutritionistId") REFERENCES "Professional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NutritionPlanMeal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT,
    "name" TEXT,
    "calories" INTEGER,
    "proteinG" REAL,
    "carbsG" REAL,
    "fatG" REAL,
    "ingredients" JSONB,
    CONSTRAINT "NutritionPlanMeal_planId_fkey" FOREIGN KEY ("planId") REFERENCES "NutritionPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NutritionPlanMealAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planMealId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "nutritionPlanId" INTEGER,
    CONSTRAINT "NutritionPlanMealAssignment_planMealId_fkey" FOREIGN KEY ("planMealId") REFERENCES "NutritionPlanMeal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NutritionPlanMealAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NutritionPlanMealAssignment_nutritionPlanId_fkey" FOREIGN KEY ("nutritionPlanId") REFERENCES "NutritionPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanAdherence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "percentage" REAL,
    "comments" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PARTIAL',
    CONSTRAINT "PlanAdherence_planId_fkey" FOREIGN KEY ("planId") REFERENCES "NutritionPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserDailyMealPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "mealType" TEXT NOT NULL,
    "order" INTEGER,
    "portions" INTEGER NOT NULL DEFAULT 1,
    "overrides" JSONB,
    CONSTRAINT "UserDailyMealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserDailyMealPlan_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Food" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "categoryEnum" TEXT,
    "serving" TEXT,
    "region" TEXT,
    "calories" REAL,
    "proteinG" REAL,
    "carbsG" REAL,
    "fatG" REAL,
    "fiberG" REAL,
    "sugarG" REAL,
    "vitaminA" REAL,
    "vitaminC" REAL,
    "vitaminD" REAL,
    "vitaminE" REAL,
    "vitaminK" REAL,
    "thiamin" REAL,
    "riboflavin" REAL,
    "niacin" REAL,
    "vitaminB6" REAL,
    "folate" REAL,
    "vitaminB12" REAL,
    "calcium" REAL,
    "iron" REAL,
    "magnesium" REAL,
    "phosphorus" REAL,
    "potassium" REAL,
    "sodium" REAL,
    "zinc" REAL,
    "copper" REAL,
    "manganese" REAL,
    "selenium" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "instructions" TEXT,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "mealType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recipeId" INTEGER NOT NULL,
    "foodId" INTEGER NOT NULL,
    "grams" REAL NOT NULL,
    CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RecipeIngredient_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoggedMeal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "mealType" TEXT NOT NULL,
    "label" TEXT,
    "order" INTEGER,
    "recipeId" INTEGER,
    "foodId" INTEGER,
    "grams" REAL,
    "calories" REAL,
    "proteinG" REAL,
    "carbsG" REAL,
    "fatG" REAL,
    "fiberG" REAL,
    "sugarG" REAL,
    "vitaminA" REAL,
    "vitaminC" REAL,
    "vitaminD" REAL,
    "calcium" REAL,
    "iron" REAL,
    "potassium" REAL,
    "magnesium" REAL,
    "sodium" REAL,
    "isFromPlan" BOOLEAN NOT NULL DEFAULT false,
    "planAssignmentId" INTEGER,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LoggedMeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LoggedMeal_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LoggedMeal_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LoggedMeal_planAssignmentId_fkey" FOREIGN KEY ("planAssignmentId") REFERENCES "NutritionPlanMealAssignment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BodyProgress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "professionalId" INTEGER,
    "date" DATETIME NOT NULL,
    "weightKg" REAL,
    "bodyFatPercent" REAL,
    "musclePercent" REAL,
    "waterPercent" REAL,
    "bmi" REAL,
    "waistCm" REAL,
    "hipCm" REAL,
    "neckCm" REAL,
    "chestCm" REAL,
    "armCm" REAL,
    "thighCm" REAL,
    "gluteCm" REAL,
    "photoUrl" TEXT,
    "notes" TEXT,
    "source" TEXT,
    CONSTRAINT "BodyProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BodyProgress_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyHydration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liters" REAL NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "DailyHydration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExerciseRoutine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "coachId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "type" TEXT NOT NULL,
    "weeklyFrequency" INTEGER,
    "weekDays" JSONB,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExerciseRoutine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExerciseRoutine_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Professional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoutineBlock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "routineId" INTEGER NOT NULL,
    "day" TEXT NOT NULL,
    "intensity" TEXT,
    CONSTRAINT "RoutineBlock_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "ExerciseRoutine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoutineExercise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blockId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sets" INTEGER,
    "reps" INTEGER,
    "durationMin" INTEGER,
    "weightKg" REAL,
    "restSeconds" INTEGER,
    CONSTRAINT "RoutineExercise_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "RoutineBlock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoutineTracking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "routineId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "compliance" REAL,
    "comments" TEXT,
    CONSTRAINT "RoutineTracking_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "ExerciseRoutine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MotivationalNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "professionalId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MotivationalNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MotivationalNote_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MedicalCondition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MedicalCondition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DietaryRestriction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DietaryRestriction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FoodPreference" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FoodPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "activityLevel" TEXT,
    "sleepHours" REAL,
    "restrictions" TEXT,
    "injuries" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserFavoriteFood" (
    "userId" INTEGER NOT NULL,
    "foodId" INTEGER NOT NULL,
    "priority" INTEGER,
    CONSTRAINT "UserFavoriteFood_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserFavoriteFood_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserFavoriteDrink" (
    "userId" INTEGER NOT NULL,
    "drinkId" INTEGER NOT NULL,
    "ml" INTEGER NOT NULL,
    "moment" TEXT,

    PRIMARY KEY ("userId", "drinkId"),
    CONSTRAINT "UserFavoriteDrink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserFavoriteDrink_drinkId_fkey" FOREIGN KEY ("drinkId") REFERENCES "Food" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "performedById" INTEGER,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changes" JSONB,
    "oldValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "context" TEXT,
    "reason" TEXT,
    CONSTRAINT "AuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "billingPeriod" TEXT NOT NULL,
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubscriptionPlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClientSubscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "nutritionistId" INTEGER,
    "coachId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "nextBillingDate" DATETIME,
    "canceledAt" DATETIME,
    "paymentProvider" TEXT,
    "paymentCustomerId" TEXT,
    "paymentSubscriptionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClientSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClientSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClientSubscription_nutritionistId_fkey" FOREIGN KEY ("nutritionistId") REFERENCES "Professional" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ClientSubscription_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Professional" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subscriptionId" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" TEXT NOT NULL,
    "paymentProvider" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "ClientSubscription" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayoutRule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER,
    "name" TEXT NOT NULL,
    "professionalRate" REAL NOT NULL,
    "platformFeeRate" REAL NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayoutRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "professionalId" INTEGER NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payout_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payout_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfessionalOrganization" (
    "professionalId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("professionalId", "organizationId"),
    CONSTRAINT "ProfessionalOrganization_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfessionalOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Organization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Organization" ("createdAt", "id", "metadata", "name", "ownerId", "slug", "updatedAt") SELECT "createdAt", "id", "metadata", "name", "ownerId", "slug", "updatedAt" FROM "Organization";
DROP TABLE "Organization";
ALTER TABLE "new_Organization" RENAME TO "Organization";
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_verificationToken_key" ON "Account"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "Account_resetToken_key" ON "Account"("resetToken");

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_key" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_professionalId_key" ON "Account"("professionalId");

-- CreateIndex
CREATE INDEX "Account_email_idx" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionRole_name_key" ON "PermissionRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionRole_slug_key" ON "PermissionRole"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ClientProfile_userId_key" ON "ClientProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_invitationToken_key" ON "OrganizationMember"("invitationToken");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_accountId_key" ON "OrganizationMember"("organizationId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_email_key" ON "Professional"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ClientProfessionalAssignment_userId_professionalId_type_key" ON "ClientProfessionalAssignment"("userId", "professionalId", "type");

-- CreateIndex
CREATE INDEX "NutritionPlanMeal_planId_order_idx" ON "NutritionPlanMeal"("planId", "order");

-- CreateIndex
CREATE INDEX "NutritionPlanMealAssignment_userId_date_idx" ON "NutritionPlanMealAssignment"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionPlanMealAssignment_planMealId_userId_date_key" ON "NutritionPlanMealAssignment"("planMealId", "userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PlanAdherence_planId_date_key" ON "PlanAdherence"("planId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UserDailyMealPlan_userId_date_order_key" ON "UserDailyMealPlan"("userId", "date", "order");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeIngredient_recipeId_foodId_key" ON "RecipeIngredient"("recipeId", "foodId");

-- CreateIndex
CREATE INDEX "LoggedMeal_userId_date_idx" ON "LoggedMeal"("userId", "date");

-- CreateIndex
CREATE INDEX "BodyProgress_userId_date_idx" ON "BodyProgress"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BodyProgress_userId_date_key" ON "BodyProgress"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyHydration_userId_date_key" ON "DailyHydration"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineTracking_routineId_date_key" ON "RoutineTracking"("routineId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UserFavoriteFood_userId_foodId_key" ON "UserFavoriteFood"("userId", "foodId");

-- CreateIndex
CREATE INDEX "UserFavoriteDrink_userId_idx" ON "UserFavoriteDrink"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_performedById_timestamp_idx" ON "AuditLog"("performedById", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_organizationId_slug_key" ON "SubscriptionPlan"("organizationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ClientSubscription_userId_planId_status_key" ON "ClientSubscription"("userId", "planId", "status");
