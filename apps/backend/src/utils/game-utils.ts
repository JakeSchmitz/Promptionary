import { gameWords } from '../data/words';
import { Game, PlayerGame, Image, PromptChain, Player, Vote, Prisma } from '@prisma/client';

export const ROUND_DURATION = 60; // 60 seconds per round
export const VOTING_DURATION = 30; // 30 seconds for voting

export type GameWithRelations = Prisma.GameGetPayload<{
  include: {
    playerGames: { include: { player: true } };
    images: { include: { player: true; votes: true } };
    promptChains: true;
  }
}>;

export function getExclusionWords(word: string): string[] {
  const wordData = gameWords.find(w => w.word.toLowerCase() === word?.toLowerCase());
  return wordData?.exclusionWords || [];
}

export function getRandomWord() {
  return gameWords[Math.floor(Math.random() * gameWords.length)];
}

export function formatGameResponse(game: GameWithRelations) {
  const exclusionWords = game.phase === 'PROMPT' && game.currentWord 
    ? getExclusionWords(game.currentWord)
    : game.exclusionWords || [];

  return {
    id: game.id,
    roomId: game.roomId,
    players: game.playerGames.map(pg => pg.player),
    currentRound: game.currentRound,
    maxRounds: game.maxRounds,
    currentWord: game.currentWord,
    exclusionWords,
    rounds: [], // TODO: Populate rounds if needed
    isComplete: game.phase === 'ENDED',
    phase: game.phase,
    images: game.images,
    gameMode: game.gameMode,
    promptChains: game.promptChains,
  };
}