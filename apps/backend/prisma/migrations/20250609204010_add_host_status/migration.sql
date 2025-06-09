/*
  Warnings:

  - Made the column `currentWord` on table `Game` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "hostId" TEXT,
ALTER COLUMN "currentWord" SET NOT NULL;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "email" TEXT,
ADD COLUMN     "isHost" BOOLEAN NOT NULL DEFAULT false;
