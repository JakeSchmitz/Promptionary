import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { GameProvider } from './context/GameContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import GameRoom from './pages/GameRoom'
import Scoreboard from './pages/Scoreboard'

function App() {
  return (
    <ChakraProvider>
      <GameProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/game/:roomId" element={<GameRoom />} />
            <Route path="/scoreboard/:gameId" element={<Scoreboard />} />
          </Routes>
        </Router>
      </GameProvider>
    </ChakraProvider>
  )
}

export default App 