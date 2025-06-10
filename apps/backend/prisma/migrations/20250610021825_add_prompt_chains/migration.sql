-- CreateTable
CREATE TABLE "PromptChain" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "originalWord" TEXT NOT NULL,
    "chain" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptChain_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PromptChain" ADD CONSTRAINT "PromptChain_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
