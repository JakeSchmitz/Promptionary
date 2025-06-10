/*
  Warnings:

  - Added the required column `playerId` to the `PromptChain` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PromptChain" ADD COLUMN     "playerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "PromptChain" ADD CONSTRAINT "PromptChain_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
