import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import GameHistory from '../GameHistory';
import * as api from '../../utils/api';

// Mock the API module
jest.mock('../../utils/api');
const mockGetGameHistory = api.getGameHistory as jest.Mock;

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'),
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;

// Mock data for testing
const mockGameHistory = [
  {
    id: 'game1',
    roomId: 'room1',
    gameMode: 'PROMPT_ANYTHING' as const,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    playerCount: 3,
    playerScore: 2,
    playerName: 'Alice',
    winner: {
      name: 'Alice',
      score: 2,
      playerId: 'player1'
    },
    totalImages: 3,
    hasPromptChains: false,
    status: 'Complete' as const,
    fullGameData: {
      playerGames: [
        { 
          id: 'pg1', 
          playerId: 'player1', 
          gameId: 'game1', 
          isHost: true, 
          score: 2,
          player: { id: 'player1', name: 'Alice', email: 'alice@test.com', createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' }
        },
        { 
          id: 'pg2', 
          playerId: 'player2', 
          gameId: 'game1', 
          isHost: false, 
          score: 1,
          player: { id: 'player2', name: 'Bob', email: 'bob@test.com', createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' }
        },
        { 
          id: 'pg3', 
          playerId: 'player3', 
          gameId: 'game1', 
          isHost: false, 
          score: 0,
          player: { id: 'player3', name: 'Charlie', email: 'charlie@test.com', createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' }
        }
      ],
      images: [
        {
          id: 'image1',
          url: 'https://example.com/image1.jpg',
          prompt: 'A beautiful sunset',
          playerId: 'player1',
          player: { name: 'Alice' },
          votes: [{ id: 'vote1', voterId: 'player2' }, { id: 'vote2', voterId: 'player3' }]
        },
        {
          id: 'image2',
          url: 'https://example.com/image2.jpg',
          prompt: 'A mountain landscape',
          playerId: 'player2',
          player: { name: 'Bob' },
          votes: [{ id: 'vote3', voterId: 'player1' }]
        },
        {
          id: 'image3',
          url: 'https://example.com/image3.jpg',
          prompt: 'A city skyline',
          playerId: 'player3',
          player: { name: 'Charlie' },
          votes: []
        }
      ],
      promptChains: [],
      currentRound: 3,
      maxRounds: 3,
      currentWord: 'landscape',
      exclusionWords: ['nature', 'outdoor']
    }
  },
  {
    id: 'game2',
    roomId: 'room2',
    gameMode: 'PROMPTOPHONE' as const,
    createdAt: '2024-01-14T15:00:00Z',
    updatedAt: '2024-01-14T15:45:00Z',
    playerCount: 2,
    playerScore: 1,
    playerName: 'Alice',
    winner: {
      name: 'Bob',
      score: 2,
      playerId: 'player2'
    },
    totalImages: 4,
    hasPromptChains: true,
    status: 'Complete' as const,
    fullGameData: {
      playerGames: [
        { 
          id: 'pg4', 
          playerId: 'player1', 
          gameId: 'game2', 
          isHost: true, 
          score: 1,
          player: { id: 'player1', name: 'Alice', email: 'alice@test.com', createdAt: '2024-01-14T15:00:00Z', updatedAt: '2024-01-14T15:00:00Z' }
        },
        { 
          id: 'pg5', 
          playerId: 'player2', 
          gameId: 'game2', 
          isHost: false, 
          score: 2,
          player: { id: 'player2', name: 'Bob', email: 'bob@test.com', createdAt: '2024-01-14T15:00:00Z', updatedAt: '2024-01-14T15:00:00Z' }
        }
      ],
      images: [
        {
          id: 'image4',
          url: 'https://example.com/image4.jpg',
          prompt: 'A cat playing',
          playerId: 'player1',
          player: { name: 'Alice' },
          votes: [{ id: 'vote4', voterId: 'player2' }]
        },
        {
          id: 'image5',
          url: 'https://example.com/image5.jpg',
          prompt: 'A dog running',
          playerId: 'player2',
          player: { name: 'Bob' },
          votes: [{ id: 'vote5', voterId: 'player1' }, { id: 'vote6', voterId: 'player2' }]
        }
      ],
      promptChains: [
        {
          id: 'chain1',
          originalWord: 'animal',
          chain: [
            { playerId: 'player1', prompt: 'A furry creature', imageUrl: 'https://example.com/chain1.jpg' },
            { playerId: 'player2', prompt: 'A domestic pet', imageUrl: 'https://example.com/chain2.jpg' }
          ]
        }
      ],
      currentRound: 2,
      maxRounds: 2,
      currentWord: 'animal',
      exclusionWords: ['pet', 'creature']
    }
  }
];

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChakraProvider>
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  </ChakraProvider>
);

describe('GameHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Default auth mock - authenticated user
    mockUseAuth.mockReturnValue({
      currentUser: { id: 'test-user', name: 'Test User' },
      login: jest.fn(),
      logout: jest.fn(),
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when fetching game history', async () => {
      // Create a promise that resolves after a delay to simulate loading
      let resolvePromise: (value: any) => void;
      const loadingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockGetGameHistory.mockReturnValue(loadingPromise);
      
      render(
        <TestWrapper>
          <GameHistory />
        </TestWrapper>
      );

      // Should show loading spinner immediately
      expect(screen.getByText('Game History')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // Resolve the promise to clean up
      resolvePromise!([]);
    });
  });

  describe('Error State', () => {
    it('shows error message when API call fails', async () => {
      mockGetGameHistory.mockRejectedValue(new Error('API Error'));
      
      render(
        <TestWrapper>
          <GameHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load game history')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('shows error when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        login: jest.fn(),
        logout: jest.fn(),
      });
      
      render(
        <TestWrapper>
          <GameHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('User not authenticated')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no games are found', async () => {
      mockGetGameHistory.mockResolvedValue([]);
      
      render(
        <TestWrapper>
          <GameHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No games found with current filters')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your filters or start some games')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Game List Display', () => {
    it('displays list of completed games', async () => {
      mockGetGameHistory.mockResolvedValue(mockGameHistory);
      
      render(
        <TestWrapper>
          <GameHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('🎨 Prompt Anything')).toBeInTheDocument();
        expect(screen.getByText('🎤 Promptophone')).toBeInTheDocument();
        expect(screen.getByText('🏆 Won')).toBeInTheDocument();
        expect(screen.getByText('Lost')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('shows correct game information in accordion headers', async () => {
      mockGetGameHistory.mockResolvedValue(mockGameHistory);
      
      render(
        <TestWrapper>
          <GameHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check for game mode icons and labels
        expect(screen.getByText('🎨 Prompt Anything')).toBeInTheDocument();
        expect(screen.getByText('🎤 Promptophone')).toBeInTheDocument();
        
        // Check for player counts
        expect(screen.getByText('3 players')).toBeInTheDocument();
        expect(screen.getByText('2 players')).toBeInTheDocument();
        
        // Check for image counts
        expect(screen.getByText('3 images')).toBeInTheDocument();
        expect(screen.getByText('4 images')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Game Details Expansion', () => {
    it('expands to show game details when clicked', async () => {
      mockGetGameHistory.mockResolvedValue(mockGameHistory);
      
      render(
        <TestWrapper>
          <GameHistory />
        </TestWrapper>
      );

      // Wait for the game to load
      await waitFor(() => {
        expect(screen.getByText('🎨 Prompt Anything')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Find and click the accordion button
      const accordionButton = screen.getByRole('button', { name: /🎨 Prompt Anything/i });
      fireEvent.click(accordionButton);

      await waitFor(() => {
        // Check for expanded content - use more flexible assertions
        expect(screen.getAllByText('Your Score').length).toBeGreaterThan(0);
        expect(screen.getAllByText('2').length).toBeGreaterThan(0); // Player score appears in multiple places
        expect(screen.getAllByText('Game Mode').length).toBeGreaterThan(1); // One in filter, one in each game stats
        expect(screen.getAllByText('Game Details').length).toBeGreaterThan(0); // One for each game
      }, { timeout: 2000 });
    });

    it('shows player scores table when expanded', async () => {
      mockGetGameHistory.mockResolvedValue(mockGameHistory);
      
      render(
        <TestWrapper>
          <GameHistory />
        </TestWrapper>
      );

      // Wait for the game to load
      await waitFor(() => {
        expect(screen.getByText('🎨 Prompt Anything')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Find and click the accordion button
      const accordionButton = screen.getByRole('button', { name: /🎨 Prompt Anything/i });
      fireEvent.click(accordionButton);

      await waitFor(() => {
        expect(screen.getAllByText('Player Scores').length).toBeGreaterThan(0); // One for each game
        // Use getAllByText for elements that might appear multiple times
        expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Charlie').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Host').length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });

    it('shows winner badge for completed games', async () => {
      mockGetGameHistory.mockResolvedValue(mockGameHistory);
      
      render(
        <TestWrapper>
          <GameHistory />
        </TestWrapper>
      );

      // Wait for the game to load
      await waitFor(() => {
        expect(screen.getByText('🎨 Prompt Anything')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Find and click the accordion button
      const accordionButton = screen.getByRole('button', { name: /🎨 Prompt Anything/i });
      fireEvent.click(accordionButton);

      await waitFor(() => {
        expect(screen.getAllByText('Winner').length).toBeGreaterThan(0); // One for each game
        expect(screen.getAllByText('Runner-up').length).toBeGreaterThan(0); // Multiple runner-ups
      }, { timeout: 2000 });
    });
  });

  describe('Multiple Games', () => {
    it('displays multiple games when available', async () => {
      mockGetGameHistory.mockResolvedValue(mockGameHistory);
      
      render(
        <TestWrapper>
          <GameHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('🎨 Prompt Anything')).toBeInTheDocument();
        expect(screen.getByText('🎤 Promptophone')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('API Integration', () => {
    it('calls getGameHistory with correct user ID', async () => {
      mockGetGameHistory.mockResolvedValue([]);
      
      render(
        <TestWrapper>
          <GameHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockGetGameHistory).toHaveBeenCalledWith('test-user');
        expect(mockGetGameHistory).toHaveBeenCalledTimes(1);
      }, { timeout: 2000 });
    });

    it('handles API errors gracefully', async () => {
      mockGetGameHistory.mockRejectedValue(new Error('Network error'));
      
      render(
        <TestWrapper>
          <GameHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load game history')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
}); 