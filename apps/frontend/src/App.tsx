import React, { StrictMode } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { GameProvider } from './context/GameContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import GameRoom from './pages/GameRoom'
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
                    <Route path="/" element={<Login />} />
                    <Route path="/game/:roomId" element={<GameRoom />} />
                    <Route path="/scoreboard/:gameId" element={<Scoreboard />} />
                    <Route path="/history" element={<GameHistory />} />
                    <Route path="/account" element={<Account />} />
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