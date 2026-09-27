/*
  Warnings:

  - You are about to drop the column `logoUrl` on the `StoreSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "StoreSettings" DROP COLUMN "logoUrl",
ADD COLUMN     "email" TEXT;
