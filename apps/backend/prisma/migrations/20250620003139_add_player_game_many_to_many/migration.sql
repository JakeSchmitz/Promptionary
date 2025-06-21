/*
  Warnings:

  - You are about to drop the column `gameId` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `isHost` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `Player` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_gameId_fkey";

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "gameId",
DROP COLUMN "isHost",
DROP COLUMN "score";

-- CreateTable
CREATE TABLE "PlayerGame" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlayerGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerGame_playerId_gameId_key" ON "PlayerGame"("playerId", "gameId");

-- AddForeignKey
ALTER TABLE "PlayerGame" ADD CONSTRAINT "PlayerGame_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGame" ADD CONSTRAINT "PlayerGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
