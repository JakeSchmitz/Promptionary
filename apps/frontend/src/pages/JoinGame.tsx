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

const JoinGame = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [roomId, setRoomId] = useState('')

  const handleJoinGame = () => {
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

    navigate(`/game/${roomId}`)
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
            <Button
              colorScheme="blue"
              onClick={handleJoinGame}
              width="100%"
              size="lg"
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