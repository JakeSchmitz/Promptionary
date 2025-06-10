import React, { useState, useEffect } from 'react'
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
import { useGame } from '../context/GameContext'

const JoinGame = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { currentUser, setGuestName } = useAuth()
  const { joinGame } = useGame()
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

    setIsLoading(true)
    try {
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
        // Set guest name first
        setGuestName(guestName)
        // Wait for the next render cycle to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 0))
      }

      // Now join the game
      await joinGame(roomId)
      
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
          <form onSubmit={(e) => {
            e.preventDefault();
            handleJoinGame();
          }}>
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
                type="submit"
                colorScheme="blue"
                width="100%"
                size="lg"
                isLoading={isLoading}
                loadingText="Joining..."
              >
                Join Game
              </Button>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  )
}

export default JoinGame 