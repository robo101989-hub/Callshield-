-- Pilot-wide cost guard; contains no submitted evidence or user identity.
CREATE TABLE "AiCheckBudget" (
  "day" DATE NOT NULL PRIMARY KEY,
  "requests" INTEGER NOT NULL DEFAULT 0
);
