-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClientSubscription" (
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
    "branchId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClientSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClientSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClientSubscription_nutritionistId_fkey" FOREIGN KEY ("nutritionistId") REFERENCES "Professional" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ClientSubscription_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Professional" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ClientSubscription_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ClientSubscription" ("canceledAt", "coachId", "createdAt", "endDate", "id", "nextBillingDate", "nutritionistId", "paymentCustomerId", "paymentProvider", "paymentSubscriptionId", "planId", "startDate", "status", "updatedAt", "userId") SELECT "canceledAt", "coachId", "createdAt", "endDate", "id", "nextBillingDate", "nutritionistId", "paymentCustomerId", "paymentProvider", "paymentSubscriptionId", "planId", "startDate", "status", "updatedAt", "userId" FROM "ClientSubscription";
DROP TABLE "ClientSubscription";
ALTER TABLE "new_ClientSubscription" RENAME TO "ClientSubscription";
CREATE UNIQUE INDEX "ClientSubscription_userId_planId_status_key" ON "ClientSubscription"("userId", "planId", "status");
CREATE TABLE "new_Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subscriptionId" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" TEXT NOT NULL,
    "paymentProvider" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" INTEGER,
    CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "ClientSubscription" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amountCents", "createdAt", "currency", "id", "paidAt", "paymentProvider", "providerPaymentId", "status", "subscriptionId") SELECT "amountCents", "createdAt", "currency", "id", "paidAt", "paymentProvider", "providerPaymentId", "status", "subscriptionId" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE TABLE "new_Professional" (
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
    "branchId" INTEGER,
    "clientsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Professional_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Professional_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Professional" ("birthDate", "clientsCount", "country", "createdAt", "deletedAt", "email", "firstName", "gender", "id", "lastName", "modality", "organizationId", "phone", "type", "updatedAt") SELECT "birthDate", "clientsCount", "country", "createdAt", "deletedAt", "email", "firstName", "gender", "id", "lastName", "modality", "organizationId", "phone", "type", "updatedAt" FROM "Professional";
DROP TABLE "Professional";
ALTER TABLE "new_Professional" RENAME TO "Professional";
CREATE UNIQUE INDEX "Professional_email_key" ON "Professional"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
