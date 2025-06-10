-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "exclusionWords" TEXT[] DEFAULT ARRAY[]::TEXT[];
