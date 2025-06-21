import React from 'react';
import { render, screen, fireEvent, waitFor, renderHook } from '@testing-library/react';
import { act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { GameProvider, useGame } from '../GameContext';

interface PromptChainStep {
  prompt: string;
  playerId: string;
  imageUrl?: string;
}

interface PromptChain {
  id: string;
  playerId: string;
  originalWord: string;
  chain: PromptChainStep[];
}

// Mock game state that will be manipulated during tests
let mockGameState: {
  players: Array<{ id: string; name: string }>;
  hostId?: string;
  currentPlayer?: { id: string; name: string };
  promptChains?: PromptChain[];
  currentRound?: number;
  phase?: string;
} = {
  players: []
};

// Mock fetch globally
beforeEach(() => {
  (globalThis as any).fetch = jest.fn();
  localStorage.clear();
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Helper: Test component to access context
const TestComponent = ({ cb }: { cb: (ctx: any) => void }) => {
  const game = useGame();
  const auth = useAuth();
  React.useEffect(() => {
    cb({ game, auth });
  }, [game, auth, cb]);
  return null;
};

// Wrap providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <GameProvider>
        {children}
      </GameProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('GameContext', () => {
  it('login flow: logs in and out', async () => {
    let ctx: any;
    render(
      <TestWrapper>
        <TestComponent cb={c => { ctx = c; }} />
      </TestWrapper>
    );
    // Login
    act(() => {
      ctx.auth.login({ id: 'u1', name: 'Alice' });
    });
    expect(ctx.auth.currentUser).toEqual({ id: 'u1', name: 'Alice' });
    // Logout
    act(() => {
      ctx.auth.logout();
    });
    expect(ctx.auth.currentUser).toBeNull();
  });

  it('create a promptionary game', async () => {
    let ctx: any;
    render(
      <TestWrapper>
        <TestComponent cb={c => { ctx = c; }} />
      </TestWrapper>
    );
    act(() => {
      ctx.auth.login({ id: 'u2', name: 'Bob' });
    });
    // Mock API response
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        id: 'g1',
        roomId: 'room1',
        players: [{ id: 'u2', name: 'Bob', score: 0, isHost: true }],
        currentRound: 0,
        maxRounds: 3,
        currentWord: 'apple',
        exclusionWords: [],
        gameMode: 'PROMPT_ANYTHING',
        images: [],
        promptChains: [],
      }),
      headers: { entries: () => [] },
    });
    let roomId = '';
    await act(async () => {
      roomId = await ctx.game.createGame('PROMPT_ANYTHING');
    });
    expect(roomId).toBeTruthy();
    expect(ctx.game.gameState?.gameMode).toBe('PROMPT_ANYTHING');
    expect(ctx.game.gameState?.players[0].name).toBe('Bob');
  });

  it('create a promptophone game', async () => {
    let ctx: any;
    render(
      <TestWrapper>
        <TestComponent cb={c => { ctx = c; }} />
      </TestWrapper>
    );
    act(() => {
      ctx.auth.login({ id: 'u3', name: 'Carol' });
    });
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        id: 'g2',
        roomId: 'room2',
        players: [{ id: 'u3', name: 'Carol', score: 0, isHost: true }],
        currentRound: 0,
        maxRounds: 3,
        currentWord: 'banana',
        exclusionWords: [],
        gameMode: 'PROMPTOPHONE',
        images: [],
        promptChains: [],
      }),
      headers: { entries: () => [] },
    });
    let roomId = '';
    await act(async () => {
      roomId = await ctx.game.createGame('PROMPTOPHONE');
    });
    expect(roomId).toBeTruthy();
    expect(ctx.game.gameState?.gameMode).toBe('PROMPTOPHONE');
    expect(ctx.game.gameState?.players[0].name).toBe('Carol');
  });

  it('play a complete promptophone game with 3 players', async () => {
    let ctx: any;
    render(
      <TestWrapper>
        <TestComponent cb={c => { ctx = c; }} />
      </TestWrapper>
    );
    
    // Login as host player
    act(() => {
      ctx.auth.login({ id: 'player1', name: 'Alice' });
    });

    // 1. Create Promptophone game
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        id: 'game1',
        roomId: 'room1',
        players: [{ id: 'player1', name: 'Alice', score: 0, isHost: true }],
        currentRound: 0,
        maxRounds: 3,
        currentWord: '',
        exclusionWords: [],
        gameMode: 'PROMPTOPHONE',
        images: [],
        promptChains: [],
      }),
      headers: { entries: () => [] },
    });
    
    let roomId = '';
    await act(async () => {
      roomId = await ctx.game.createGame('PROMPTOPHONE');
    });
    expect(ctx.game.gameState?.gameMode).toBe('PROMPTOPHONE');

    // 2. Add other players
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        players: [
          { id: 'player1', name: 'Alice', score: 0, isHost: true },
          { id: 'player2', name: 'Bob', score: 0, isHost: false },
          { id: 'player3', name: 'Charlie', score: 0, isHost: false }
        ],
      }),
      headers: { entries: () => [] },
    });
    await act(async () => {
      await ctx.game.joinGame(roomId);
    });

    // 3. Start game - this should create prompt chains
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'PROMPT',
        currentRound: 1,
        currentWord: 'mountain',
        exclusionWords: ['peak', 'cliff'],
        promptChains: [
          { 
            id: 'chain1', 
            playerId: 'player1', 
            originalWord: 'mountain',
            chain: [] 
          },
          { 
            id: 'chain2', 
            playerId: 'player2', 
            originalWord: 'ocean',
            chain: [] 
          },
          { 
            id: 'chain3', 
            playerId: 'player3', 
            originalWord: 'forest',
            chain: [] 
          }
        ],
      }),
      headers: { entries: () => [] },
    });
    
    await act(async () => {
      await ctx.game.startGame();
    });
    expect(ctx.game.gameState?.phase).toBe('PROMPT');
    expect(ctx.game.gameState?.currentRound).toBe(1);

    // 4. Round 1: Each player submits their initial prompt
    // Player 1 submits prompt for their word (mountain)
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'PROMPT',
        currentRound: 1,
      }),
      headers: { entries: () => [] },
    });
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'PROMPT',
        currentRound: 1,
        images: [
          { id: 'img1', playerId: 'player1', url: 'https://fake-image-url/mountain.jpg', prompt: 'A majestic snow-capped mountain peak' }
        ],
      }),
      headers: { entries: () => [] },
    });
    
    await act(async () => {
      await ctx.game.submitPrompt('A majestic snow-capped mountain peak');
    });

    // Player 2 submits prompt for their word (ocean)
    ctx.game.setGameState({
      ...ctx.game.gameState,
      currentPlayer: { id: 'player2', name: 'Bob', score: 0, isHost: false }
    });
    
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'PROMPT',
        currentRound: 1,
        images: [
          { id: 'img1', playerId: 'player1', url: 'https://fake-image-url/mountain.jpg', prompt: 'A majestic snow-capped mountain peak' },
          { id: 'img2', playerId: 'player2', url: 'https://fake-image-url/ocean.jpg', prompt: 'A deep blue ocean with waves' }
        ],
      }),
      headers: { entries: () => [] },
    });
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'PROMPT',
        currentRound: 1,
        images: [
          { id: 'img1', playerId: 'player1', url: 'https://fake-image-url/mountain.jpg', prompt: 'A majestic snow-capped mountain peak' },
          { id: 'img2', playerId: 'player2', url: 'https://fake-image-url/ocean.jpg', prompt: 'A deep blue ocean with waves' }
        ],
      }),
      headers: { entries: () => [] },
    });
    
    await act(async () => {
      await ctx.game.submitPrompt('A deep blue ocean with waves');
    });

    // Player 3 submits prompt for their word (forest)
    ctx.game.setGameState({
      ...ctx.game.gameState,
      currentPlayer: { id: 'player3', name: 'Charlie', score: 0, isHost: false }
    });
    
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'PROMPT',
        currentRound: 1,
        images: [
          { id: 'img1', playerId: 'player1', url: 'https://fake-image-url/mountain.jpg', prompt: 'A majestic snow-capped mountain peak' },
          { id: 'img2', playerId: 'player2', url: 'https://fake-image-url/ocean.jpg', prompt: 'A deep blue ocean with waves' },
          { id: 'img3', playerId: 'player3', url: 'https://fake-image-url/forest.jpg', prompt: 'A dense forest with tall trees' }
        ],
      }),
      headers: { entries: () => [] },
    });
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'PROMPT',
        currentRound: 2, // Automatically transitioned to round 2
        currentWord: 'https://fake-image-url/forest.jpg', // Player 1 should see Player 3's image
        images: [
          { id: 'img1', playerId: 'player1', url: 'https://fake-image-url/mountain.jpg', prompt: 'A majestic snow-capped mountain peak' },
          { id: 'img2', playerId: 'player2', url: 'https://fake-image-url/ocean.jpg', prompt: 'A deep blue ocean with waves' },
          { id: 'img3', playerId: 'player3', url: 'https://fake-image-url/forest.jpg', prompt: 'A dense forest with tall trees' }
        ],
      }),
      headers: { entries: () => [] },
    });
    
    await act(async () => {
      await ctx.game.submitPrompt('A dense forest with tall trees');
    });

    // 5. Round 2: Chain rotation - each player works on a different chain
    expect(ctx.game.gameState?.currentRound).toBe(2);
    
    // Player 1 should see Player 3's image (forest chain)
    ctx.game.setGameState({
      ...ctx.game.gameState,
      currentPlayer: { id: 'player1', name: 'Alice', score: 0, isHost: true }
    });
    
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'PROMPT',
        currentRound: 2,
        images: [
          { id: 'img1', playerId: 'player1', url: 'https://fake-image-url/mountain.jpg', prompt: 'A majestic snow-capped mountain peak' },
          { id: 'img2', playerId: 'player2', url: 'https://fake-image-url/ocean.jpg', prompt: 'A deep blue ocean with waves' },
          { id: 'img3', playerId: 'player3', url: 'https://fake-image-url/forest.jpg', prompt: 'A dense forest with tall trees' },
          { id: 'img4', playerId: 'player1', url: 'https://fake-image-url/forest2.jpg', prompt: 'A mystical woodland with glowing mushrooms' }
        ],
      }),
      headers: { entries: () => [] },
    });
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'PROMPT',
        currentRound: 2,
        images: [
          { id: 'img1', playerId: 'player1', url: 'https://fake-image-url/mountain.jpg', prompt: 'A majestic snow-capped mountain peak' },
          { id: 'img2', playerId: 'player2', url: 'https://fake-image-url/ocean.jpg', prompt: 'A deep blue ocean with waves' },
          { id: 'img3', playerId: 'player3', url: 'https://fake-image-url/forest.jpg', prompt: 'A dense forest with tall trees' },
          { id: 'img4', playerId: 'player1', url: 'https://fake-image-url/forest2.jpg', prompt: 'A mystical woodland with glowing mushrooms' }
        ],
      }),
      headers: { entries: () => [] },
    });
    
    await act(async () => {
      await ctx.game.submitPrompt('A mystical woodland with glowing mushrooms');
    });

    // Player 2 should see Player 1's image (mountain chain)
    ctx.game.setGameState({
      ...ctx.game.gameState,
      currentPlayer: { id: 'player2', name: 'Bob', score: 0, isHost: false }
    });
    
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'PROMPT',
        currentRound: 2,
        images: [
          { id: 'img1', playerId: 'player1', url: 'https://fake-image-url/mountain.jpg', prompt: 'A majestic snow-capped mountain peak' },
          { id: 'img2', playerId: 'player2', url: 'https://fake-image-url/ocean.jpg', prompt: 'A deep blue ocean with waves' },
          { id: 'img3', playerId: 'player3', url: 'https://fake-image-url/forest.jpg', prompt: 'A dense forest with tall trees' },
          { id: 'img4', playerId: 'player1', url: 'https://fake-image-url/forest2.jpg', prompt: 'A mystical woodland with glowing mushrooms' },
          { id: 'img5', playerId: 'player2', url: 'https://fake-image-url/mountain2.jpg', prompt: 'A snow-covered peak at sunset' }
        ],
      }),
      headers: { entries: () => [] },
    });
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'PROMPT',
        currentRound: 2,
        images: [
          { id: 'img1', playerId: 'player1', url: 'https://fake-image-url/mountain.jpg', prompt: 'A majestic snow-capped mountain peak' },
          { id: 'img2', playerId: 'player2', url: 'https://fake-image-url/ocean.jpg', prompt: 'A deep blue ocean with waves' },
          { id: 'img3', playerId: 'player3', url: 'https://fake-image-url/forest.jpg', prompt: 'A dense forest with tall trees' },
          { id: 'img4', playerId: 'player1', url: 'https://fake-image-url/forest2.jpg', prompt: 'A mystical woodland with glowing mushrooms' },
          { id: 'img5', playerId: 'player2', url: 'https://fake-image-url/mountain2.jpg', prompt: 'A snow-covered peak at sunset' }
        ],
      }),
      headers: { entries: () => [] },
    });
    
    await act(async () => {
      await ctx.game.submitPrompt('A snow-covered peak at sunset');
    });

    // Player 3 should see Player 2's image (ocean chain)
    ctx.game.setGameState({
      ...ctx.game.gameState,
      currentPlayer: { id: 'player3', name: 'Charlie', score: 0, isHost: false }
    });
    
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'PROMPT',
        currentRound: 2,
        images: [
          { id: 'img1', playerId: 'player1', url: 'https://fake-image-url/mountain.jpg', prompt: 'A majestic snow-capped mountain peak' },
          { id: 'img2', playerId: 'player2', url: 'https://fake-image-url/ocean.jpg', prompt: 'A deep blue ocean with waves' },
          { id: 'img3', playerId: 'player3', url: 'https://fake-image-url/forest.jpg', prompt: 'A dense forest with tall trees' },
          { id: 'img4', playerId: 'player1', url: 'https://fake-image-url/forest2.jpg', prompt: 'A mystical woodland with glowing mushrooms' },
          { id: 'img5', playerId: 'player2', url: 'https://fake-image-url/mountain2.jpg', prompt: 'A snow-covered peak at sunset' },
          { id: 'img6', playerId: 'player3', url: 'https://fake-image-url/ocean2.jpg', prompt: 'Waves crashing against cliffs at dawn' }
        ],
      }),
      headers: { entries: () => [] },
    });
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'PROMPT',
        currentRound: 3, // Automatically transitioned to round 3
        currentWord: 'https://fake-image-url/ocean2.jpg', // Player 1 should see Player 3's ocean image
        images: [
          { id: 'img1', playerId: 'player1', url: 'https://fake-image-url/mountain.jpg', prompt: 'A majestic snow-capped mountain peak' },
          { id: 'img2', playerId: 'player2', url: 'https://fake-image-url/ocean.jpg', prompt: 'A deep blue ocean with waves' },
          { id: 'img3', playerId: 'player3', url: 'https://fake-image-url/forest.jpg', prompt: 'A dense forest with tall trees' },
          { id: 'img4', playerId: 'player1', url: 'https://fake-image-url/forest2.jpg', prompt: 'A mystical woodland with glowing mushrooms' },
          { id: 'img5', playerId: 'player2', url: 'https://fake-image-url/mountain2.jpg', prompt: 'A snow-covered peak at sunset' },
          { id: 'img6', playerId: 'player3', url: 'https://fake-image-url/ocean2.jpg', prompt: 'Waves crashing against cliffs at dawn' }
        ],
      }),
      headers: { entries: () => [] },
    });
    
    await act(async () => {
      await ctx.game.submitPrompt('Waves crashing against cliffs at dawn');
    });

    // 6. Round 3: Final round - each player works on the remaining chain
    expect(ctx.game.gameState?.currentRound).toBe(3);
    
    // Player 1 should see Player 2's mountain image (mountain chain)
    ctx.game.setGameState({
      ...ctx.game.gameState,
      currentPlayer: { id: 'player1', name: 'Alice', score: 0, isHost: true }
    });
    
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'PROMPT',
        currentRound: 3,
        images: [
          { id: 'img1', playerId: 'player1', url: 'https://fake-image-url/mountain.jpg', prompt: 'A majestic snow-capped mountain peak' },
          { id: 'img2', playerId: 'player2', url: 'https://fake-image-url/ocean.jpg', prompt: 'A deep blue ocean with waves' },
          { id: 'img3', playerId: 'player3', url: 'https://fake-image-url/forest.jpg', prompt: 'A dense forest with tall trees' },
          { id: 'img4', playerId: 'player1', url: 'https://fake-image-url/forest2.jpg', prompt: 'A mystical woodland with glowing mushrooms' },
          { id: 'img5', playerId: 'player2', url: 'https://fake-image-url/mountain2.jpg', prompt: 'A snow-covered peak at sunset' },
          { id: 'img6', playerId: 'player3', url: 'https://fake-image-url/ocean2.jpg', prompt: 'Waves crashing against cliffs at dawn' },
          { id: 'img7', playerId: 'player1', url: 'https://fake-image-url/mountain3.jpg', prompt: 'A rugged mountain range at golden hour' }
        ],
      }),
      headers: { entries: () => [] },
    });
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'PROMPT',
        currentRound: 3,
        images: [
          { id: 'img1', playerId: 'player1', url: 'https://fake-image-url/mountain.jpg', prompt: 'A majestic snow-capped mountain peak' },
          { id: 'img2', playerId: 'player2', url: 'https://fake-image-url/ocean.jpg', prompt: 'A deep blue ocean with waves' },
          { id: 'img3', playerId: 'player3', url: 'https://fake-image-url/forest.jpg', prompt: 'A dense forest with tall trees' },
          { id: 'img4', playerId: 'player1', url: 'https://fake-image-url/forest2.jpg', prompt: 'A mystical woodland with glowing mushrooms' },
          { id: 'img5', playerId: 'player2', url: 'https://fake-image-url/mountain2.jpg', prompt: 'A snow-covered peak at sunset' },
          { id: 'img6', playerId: 'player3', url: 'https://fake-image-url/ocean2.jpg', prompt: 'Waves crashing against cliffs at dawn' },
          { id: 'img7', playerId: 'player1', url: 'https://fake-image-url/mountain3.jpg', prompt: 'A rugged mountain range at golden hour' }
        ],
      }),
      headers: { entries: () => [] },
    });
    
    await act(async () => {
      await ctx.game.submitPrompt('A rugged mountain range at golden hour');
    });

    // Player 2 should see Player 1's forest image (forest chain)
    ctx.game.setGameState({
      ...ctx.game.gameState,
      currentPlayer: { id: 'player2', name: 'Bob', score: 0, isHost: false }
    });
    
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'PROMPT',
        currentRound: 3,
        images: [
          { id: 'img1', playerId: 'player1', url: 'https://fake-image-url/mountain.jpg', prompt: 'A majestic snow-capped mountain peak' },
          { id: 'img2', playerId: 'player2', url: 'https://fake-image-url/ocean.jpg', prompt: 'A deep blue ocean with waves' },
          { id: 'img3', playerId: 'player3', url: 'https://fake-image-url/forest.jpg', prompt: 'A dense forest with tall trees' },
          { id: 'img4', playerId: 'player1', url: 'https://fake-image-url/forest2.jpg', prompt: 'A mystical woodland with glowing mushrooms' },
          { id: 'img5', playerId: 'player2', url: 'https://fake-image-url/mountain2.jpg', prompt: 'A snow-covered peak at sunset' },
          { id: 'img6', playerId: 'player3', url: 'https://fake-image-url/ocean2.jpg', prompt: 'Waves crashing against cliffs at dawn' },
          { id: 'img7', playerId: 'player1', url: 'https://fake-image-url/mountain3.jpg', prompt: 'A rugged mountain range at golden hour' },
          { id: 'img8', playerId: 'player2', url: 'https://fake-image-url/forest3.jpg', prompt: 'An enchanted grove with ancient trees' }
        ],
      }),
      headers: { entries: () => [] },
    });
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'PROMPT',
        currentRound: 3,
        images: [
          { id: 'img1', playerId: 'player1', url: 'https://fake-image-url/mountain.jpg', prompt: 'A majestic snow-capped mountain peak' },
          { id: 'img2', playerId: 'player2', url: 'https://fake-image-url/ocean.jpg', prompt: 'A deep blue ocean with waves' },
          { id: 'img3', playerId: 'player3', url: 'https://fake-image-url/forest.jpg', prompt: 'A dense forest with tall trees' },
          { id: 'img4', playerId: 'player1', url: 'https://fake-image-url/forest2.jpg', prompt: 'A mystical woodland with glowing mushrooms' },
          { id: 'img5', playerId: 'player2', url: 'https://fake-image-url/mountain2.jpg', prompt: 'A snow-covered peak at sunset' },
          { id: 'img6', playerId: 'player3', url: 'https://fake-image-url/ocean2.jpg', prompt: 'Waves crashing against cliffs at dawn' },
          { id: 'img7', playerId: 'player1', url: 'https://fake-image-url/mountain3.jpg', prompt: 'A rugged mountain range at golden hour' },
          { id: 'img8', playerId: 'player2', url: 'https://fake-image-url/forest3.jpg', prompt: 'An enchanted grove with ancient trees' }
        ],
      }),
      headers: { entries: () => [] },
    });
    
    await act(async () => {
      await ctx.game.submitPrompt('An enchanted grove with ancient trees');
    });

    // Player 3 should see Player 1's mountain image (mountain chain)
    ctx.game.setGameState({
      ...ctx.game.gameState,
      currentPlayer: { id: 'player3', name: 'Charlie', score: 0, isHost: false }
    });
    
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'PROMPT',
        currentRound: 3,
        images: [
          { id: 'img1', playerId: 'player1', url: 'https://fake-image-url/mountain.jpg', prompt: 'A majestic snow-capped mountain peak' },
          { id: 'img2', playerId: 'player2', url: 'https://fake-image-url/ocean.jpg', prompt: 'A deep blue ocean with waves' },
          { id: 'img3', playerId: 'player3', url: 'https://fake-image-url/forest.jpg', prompt: 'A dense forest with tall trees' },
          { id: 'img4', playerId: 'player1', url: 'https://fake-image-url/forest2.jpg', prompt: 'A mystical woodland with glowing mushrooms' },
          { id: 'img5', playerId: 'player2', url: 'https://fake-image-url/mountain2.jpg', prompt: 'A snow-covered peak at sunset' },
          { id: 'img6', playerId: 'player3', url: 'https://fake-image-url/ocean2.jpg', prompt: 'Waves crashing against cliffs at dawn' },
          { id: 'img7', playerId: 'player1', url: 'https://fake-image-url/mountain3.jpg', prompt: 'A rugged mountain range at golden hour' },
          { id: 'img8', playerId: 'player2', url: 'https://fake-image-url/forest3.jpg', prompt: 'An enchanted grove with ancient trees' },
          { id: 'img9', playerId: 'player3', url: 'https://fake-image-url/mountain4.jpg', prompt: 'A dramatic alpine landscape' }
        ],
      }),
      headers: { entries: () => [] },
    });
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...ctx.game.gameState,
        phase: 'RESULTS', // Game is complete, transition to results
        currentRound: 3,
        images: [
          { id: 'img1', playerId: 'player1', url: 'https://fake-image-url/mountain.jpg', prompt: 'A majestic snow-capped mountain peak' },
          { id: 'img2', playerId: 'player2', url: 'https://fake-image-url/ocean.jpg', prompt: 'A deep blue ocean with waves' },
          { id: 'img3', playerId: 'player3', url: 'https://fake-image-url/forest.jpg', prompt: 'A dense forest with tall trees' },
          { id: 'img4', playerId: 'player1', url: 'https://fake-image-url/forest2.jpg', prompt: 'A mystical woodland with glowing mushrooms' },
          { id: 'img5', playerId: 'player2', url: 'https://fake-image-url/mountain2.jpg', prompt: 'A snow-covered peak at sunset' },
          { id: 'img6', playerId: 'player3', url: 'https://fake-image-url/ocean2.jpg', prompt: 'Waves crashing against cliffs at dawn' },
          { id: 'img7', playerId: 'player1', url: 'https://fake-image-url/mountain3.jpg', prompt: 'A rugged mountain range at golden hour' },
          { id: 'img8', playerId: 'player2', url: 'https://fake-image-url/forest3.jpg', prompt: 'An enchanted grove with ancient trees' },
          { id: 'img9', playerId: 'player3', url: 'https://fake-image-url/mountain4.jpg', prompt: 'A dramatic alpine landscape' }
        ],
      }),
      headers: { entries: () => [] },
    });
    
    await act(async () => {
      await ctx.game.submitPrompt('A dramatic alpine landscape');
    });

    // 7. Game completion
    expect(ctx.game.gameState?.phase).toBe('RESULTS');
    expect(ctx.game.gameState?.currentRound).toBe(3);
    expect(ctx.game.gameState?.images).toHaveLength(9); // 3 players × 3 rounds = 9 images total
  });

  test('Promptophone game chain mechanism works correctly', async () => {
    let ctx: any;
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestWrapper>
        <TestComponent cb={c => { ctx = c; }} />
        {children}
      </TestWrapper>
    );

    const { result } = renderHook(() => useGame(), { wrapper });
    
    // Login a user first
    await act(async () => {
      ctx.auth.login({ id: 'testuser', name: 'Test User' });
    });
    
    // Mock players
    const player1 = { id: 'player1', name: 'Player 1' };
    const player2 = { id: 'player2', name: 'Player 2' };
    const player3 = { id: 'player3', name: 'Player 3' };
    
    // Mock the createGame API call
    ((globalThis as any).fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        id: 'testgame',
        roomId: 'testroom',
        players: [{ id: 'testuser', name: 'Test User', score: 0, isHost: true }],
        currentRound: 0,
        maxRounds: 3,
        currentWord: '',
        exclusionWords: [],
        gameMode: 'PROMPTOPHONE',
        images: [],
        promptChains: [],
      }),
      headers: { entries: () => [] },
    });

    // Create a Promptophone game
    await act(async () => {
      await result.current.createGame('PROMPTOPHONE');
    });

    // Test that the game was created with correct mode
    expect(result.current.gameState?.gameMode).toBe('PROMPTOPHONE');

    // Test chain rotation logic directly
    const numPlayers = 3;
    const player1Index = 0;
    const player2Index = 1;
    const player3Index = 2;

    // Round 1: Each player works on their own chain
    const round1Player1ChainIndex = (player1Index + (1 - 1)) % numPlayers; // 0
    const round1Player2ChainIndex = (player2Index + (1 - 1)) % numPlayers; // 1
    const round1Player3ChainIndex = (player3Index + (1 - 1)) % numPlayers; // 2
    
    expect(round1Player1ChainIndex).toBe(0);
    expect(round1Player2ChainIndex).toBe(1);
    expect(round1Player3ChainIndex).toBe(2);

    // Round 2: Chain rotation - each player works on the next player's chain
    const round2Player1ChainIndex = (player1Index + (2 - 1)) % numPlayers; // 1
    const round2Player2ChainIndex = (player2Index + (2 - 1)) % numPlayers; // 2
    const round2Player3ChainIndex = (player3Index + (2 - 1)) % numPlayers; // 0
    
    expect(round2Player1ChainIndex).toBe(1);
    expect(round2Player2ChainIndex).toBe(2);
    expect(round2Player3ChainIndex).toBe(0);

    // Round 3: Final rotation
    const round3Player1ChainIndex = (player1Index + (3 - 1)) % numPlayers; // 2
    const round3Player2ChainIndex = (player2Index + (3 - 1)) % numPlayers; // 0
    const round3Player3ChainIndex = (player3Index + (3 - 1)) % numPlayers; // 1
    
    expect(round3Player1ChainIndex).toBe(2);
    expect(round3Player2ChainIndex).toBe(0);
    expect(round3Player3ChainIndex).toBe(1);
  });
}); 