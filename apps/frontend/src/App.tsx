import React, { StrictMode, useEffect } from 'react'
import { ChakraProvider, Box, Text } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { GameProvider } from './context/GameContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import GameRoom from './pages/GameRoom'
import JoinGame from './pages/JoinGame'
import Scoreboard from './pages/Scoreboard'
import GameHistory from './pages/GameHistory'
import Account from './pages/Account'

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error in component:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={4}>
          <Text>Something went wrong. Please try refreshing the page.</Text>
        </Box>
      )
    }

    return this.props.children
  }
}

// Protected route wrapper component (only for authenticated users)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  
  if (!isAuthenticated) {
    // Redirect to login with return path
    return <Navigate to={`/login?returnTo=${location.pathname}`} replace />
  }
  
  return <>{children}</>
}

// Guest route wrapper component (for guest users)
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth()
  const location = useLocation()
  
  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  // If not authenticated and no guest name, redirect to login with return path
  if (!currentUser?.name) {
    return <Navigate to={`/login?returnTo=${location.pathname}`} replace />
  }
  
  return <>{children}</>
}

// Public route wrapper component (redirects to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth()
  
  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  // If not authenticated but has guest name, redirect to join game
  if (currentUser?.name) {
    return <Navigate to="/join" replace />
  }
  
  return <>{children}</>
}

// Game route wrapper component (handles both authenticated and unauthenticated users)
const GameRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth()
  const location = useLocation()
  
  // Extract room ID from URL
  const roomId = location.pathname.split('/game/')[1]
  
  // If no room ID, redirect to home
  if (!roomId) {
    return <Navigate to="/" replace />
  }

  // If not authenticated and no guest name, redirect to login with return path
  if (!isAuthenticated && !currentUser?.name) {
    return <Navigate to={`/login?returnTo=/game/${roomId}`} replace />
  }

  // If authenticated or has guest name, allow access
  return <>{children}</>
}

const App = () => {
  // Get the client ID from environment variables
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  if (!clientId) {
    console.error('Google Client ID is not configured. Please check your environment variables.')
  }

  return (
    <StrictMode>
      <ErrorBoundary>
        <ChakraProvider>
          <Router>
            <GoogleOAuthProvider clientId={clientId || ''}>
              <AuthProvider>
                <GameProvider>
                  <Layout>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
                      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                      
                      {/* Game routes (can be accessed by both authenticated and unauthenticated users) */}
                      <Route path="/game/:roomId" element={<GameRoute><GameRoom /></GameRoute>} />
                      
                      {/* Protected routes (only for authenticated users) */}
                      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                      <Route path="/history" element={<ProtectedRoute><GameHistory /></ProtectedRoute>} />
                      <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                      
                      {/* Guest routes */}
                      <Route path="/join" element={<GuestRoute><JoinGame /></GuestRoute>} />
                      <Route path="/scoreboard/:gameId" element={<GuestRoute><Scoreboard /></GuestRoute>} />
                      
                      {/* Catch all route */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </GameProvider>
              </AuthProvider>
            </GoogleOAuthProvider>
          </Router>
        </ChakraProvider>
      </ErrorBoundary>
    </StrictMode>
  )
}

export default App 