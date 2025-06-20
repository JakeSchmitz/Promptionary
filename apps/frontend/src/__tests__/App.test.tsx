import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import App from './App';

// Mock the auth context
jest.mock('./context/AuthContext', () => ({
  ...jest.requireActual('./context/AuthContext'),
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;

// Mock Google OAuth Provider
jest.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock environment variable
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_GOOGLE_CLIENT_ID: 'test-client-id'
  },
  writable: true
});

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChakraProvider>
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  </ChakraProvider>
);

describe('App Routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Protected Routes', () => {
    it('shows loading spinner when auth is loading', () => {
      // Mock loading state
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        currentUser: null,
        isLoading: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should show loading spinner
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('redirects to login when not authenticated after loading', async () => {
      // Mock not authenticated state
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        currentUser: null,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should redirect to login page
      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
      });
    });

    it('allows access to protected routes when authenticated', async () => {
      // Mock authenticated state
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        currentUser: { id: 'test-user', name: 'Test User' },
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      // Navigate to a protected route
      window.history.pushState({}, '', '/history');

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should show the protected page content
      await waitFor(() => {
        expect(screen.getByText('Game History')).toBeInTheDocument();
      });
    });
  });

  describe('Guest Routes', () => {
    it('shows loading spinner when auth is loading', () => {
      // Mock loading state
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        currentUser: null,
        isLoading: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should show loading spinner
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('redirects to login when no guest name after loading', async () => {
      // Mock no guest name state
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        currentUser: null,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      // Navigate to a guest route
      window.history.pushState({}, '', '/join');

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should redirect to login page
      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
      });
    });

    it('allows access to guest routes when guest name is set', async () => {
      // Mock guest user state
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        currentUser: { id: 'guest-1', name: 'Guest User', isGuest: true },
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      // Navigate to a guest route
      window.history.pushState({}, '', '/join');

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should show the guest page content
      await waitFor(() => {
        expect(screen.getByText('Join Game')).toBeInTheDocument();
      });
    });
  });

  describe('Public Routes', () => {
    it('shows loading spinner when auth is loading', () => {
      // Mock loading state
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        currentUser: null,
        isLoading: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should show loading spinner
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('shows login page when not authenticated after loading', async () => {
      // Mock not authenticated state
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        currentUser: null,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should show login page
      await waitFor(() => {
        expect(screen.getByText('Welcome to Promptionary')).toBeInTheDocument();
      });
    });

    it('redirects to dashboard when authenticated', async () => {
      // Mock authenticated state
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        currentUser: { id: 'test-user', name: 'Test User' },
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should redirect to dashboard
      await waitFor(() => {
        expect(window.location.pathname).toBe('/dashboard');
      });
    });
  });
}); 