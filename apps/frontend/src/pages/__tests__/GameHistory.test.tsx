import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import GameHistory from '../GameHistory';
import * as api from '../../utils/api';
import theme from '../../theme';

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
const mockGameHistoryData = [
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
  },
];

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChakraProvider theme={theme}>
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
    
    mockUseAuth.mockReturnValue({
      currentUser: { id: 'player1', name: 'Alice' },
    });
  });

  it('renders game history', async () => {
    mockGetGameHistory.mockResolvedValue(mockGameHistoryData);

    render(
      <TestWrapper>
        <GameHistory />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Prompt Anything')).toBeInTheDocument();
    });
  });
});