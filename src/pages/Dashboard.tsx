import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  HStack,
  Input,
  Text,
  useToast,
} from '@chakra-ui/react'
import { useGame } from '../context/GameContext'

// Mock data for past games
const mockPastGames = [
  { id: '1', date: '2024-03-20', players: 4, winner: 'Alice' },
  { id: '2', date: '2024-03-19', players: 6, winner: 'Bob' },
]

const Dashboard = () => {
  const [roomCode, setRoomCode] = useState('')
  const navigate = useNavigate()
  const toast = useToast()
  const { createOrJoinGame } = useGame()

  const handleNewGame = async () => {
    const newRoomId = Math.random().toString(36).substring(2, 8)
    const username = localStorage.getItem('user') || 'Player'
    await createOrJoinGame(newRoomId, username)
    navigate(`/game/${newRoomId}`)
  }

  const handleJoinGame = () => {
    if (roomCode.trim()) {
      navigate(`/game/${roomCode}`)
    } else {
      toast({
        title: 'Error',
        description: 'Please enter a room code',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8}>
        <Heading>Game Hub</Heading>
        
        <Box w="100%" p={6} borderWidth={1} borderRadius="lg">
          <VStack spacing={4}>
            <Button
              colorScheme="blue"
              size="lg"
              width="100%"
              onClick={handleNewGame}
            >
              Start New Game
            </Button>
            
            <Text>or</Text>
            
            <HStack width="100%">
              <Input
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
              />
              <Button onClick={handleJoinGame}>Join Game</Button>
            </HStack>
          </VStack>
        </Box>

        <Box w="100%">
          <Heading size="md" mb={4}>Past Games</Heading>
          <VStack spacing={4} align="stretch">
            {mockPastGames.map((game) => (
              <Box
                key={game.id}
                p={4}
                borderWidth={1}
                borderRadius="md"
                _hover={{ bg: 'gray.50' }}
                cursor="pointer"
                onClick={() => navigate(`/scoreboard/${game.id}`)}
              >
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">Game #{game.id}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {game.date} • {game.players} players
                    </Text>
                  </VStack>
                  <Text>Winner: {game.winner}</Text>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}

export default Dashboard 