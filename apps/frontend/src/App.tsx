import React, { StrictMode } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { GameProvider } from './context/GameContext'
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

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error in component:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please try refreshing the page.</div>
    }

    return this.props.children
  }
}

// Protected route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem('user')
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

// Public route wrapper component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem('user')
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

// Game route wrapper component (handles both authenticated and unauthenticated users)
const GameRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem('user')
  const hasGameState = !!localStorage.getItem('gameState')
  
  // Allow access if either authenticated or has game state
  if (isAuthenticated || hasGameState) {
    return <>{children}</>
  }
  
  // If neither authenticated nor has game state, redirect to login
  return <Navigate to="/" replace />
}

const App = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  console.log('Google Client ID:', clientId)

  return (
    <StrictMode>
      <ErrorBoundary>
        <ChakraProvider>
          <Router>
            <GoogleOAuthProvider clientId={clientId}>
              <GameProvider>
                <Layout>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
                    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                    
                    {/* Game routes (can be accessed by both authenticated and unauthenticated users) */}
                    <Route path="/game/:roomId" element={<GameRoute><GameRoom /></GameRoute>} />
                    
                    {/* Protected routes */}
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/join" element={<ProtectedRoute><JoinGame /></ProtectedRoute>} />
                    <Route path="/scoreboard/:gameId" element={<ProtectedRoute><Scoreboard /></ProtectedRoute>} />
                    <Route path="/history" element={<ProtectedRoute><GameHistory /></ProtectedRoute>} />
                    <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                    
                    {/* Catch all route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </GameProvider>
            </GoogleOAuthProvider>
          </Router>
        </ChakraProvider>
      </ErrorBoundary>
    </StrictMode>
  )
}

export default App 