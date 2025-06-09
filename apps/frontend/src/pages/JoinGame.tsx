import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  useToast,
} from '@chakra-ui/react'
import { useAuth } from '../context/AuthContext'

const JoinGame = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { currentUser, setGuestName } = useAuth()
  const [roomId, setRoomId] = useState('')
  const [guestName, setLocalGuestName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleJoinGame = async () => {
    if (!roomId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a room ID',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Handle guest users
    if (!currentUser) {
      if (!guestName.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter your name',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        return
      }
      setGuestName(guestName)
    }

    setIsLoading(true)
    try {
      // First verify the game exists
      const gameResponse = await fetch(`${import.meta.env.VITE_API_URL}/games/${roomId}`)
      if (!gameResponse.ok) {
        throw new Error('Game not found')
      }

      // Add player to the game
      const playerResponse = await fetch(`${import.meta.env.VITE_API_URL}/games/${roomId}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentUser?.name || guestName,
          playerId: currentUser?.id || `guest-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        }),
      })

      if (!playerResponse.ok) {
        throw new Error('Failed to join game')
      }

      // Get the updated game state
      const gameState = await playerResponse.json()
      localStorage.setItem('gameState', JSON.stringify(gameState))

      toast({
        title: 'Success',
        description: 'Successfully joined the game',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      navigate(`/game/${roomId}`)
    } catch (error) {
      console.error('Error joining game:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to join game',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxW="container.sm" py={20}>
      <VStack spacing={8}>
        <Box textAlign="center">
          <Heading size="lg">Join a Game</Heading>
          <Text mt={2} color="gray.600">
            Enter the room ID to join an existing game
          </Text>
        </Box>

        <Box w="100%" p={8} borderWidth={1} borderRadius="lg">
          <VStack spacing={6}>
            <Input
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              size="lg"
            />
            {!currentUser && (
              <Input
                placeholder="Enter Your Name"
                value={guestName}
                onChange={(e) => setLocalGuestName(e.target.value)}
                size="lg"
              />
            )}
            <Button
              colorScheme="blue"
              onClick={handleJoinGame}
              width="100%"
              size="lg"
              isLoading={isLoading}
              loadingText="Joining..."
            >
              Join Game
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}

export default JoinGame 