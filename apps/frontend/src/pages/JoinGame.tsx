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
  Card,
  CardBody,
  InputGroup,
  InputLeftElement,
  Divider,
} from '@chakra-ui/react'
import { useAuth } from '../context/AuthContext'
import { useGame } from '../context/GameContext'
import { FaUser, FaKey } from 'react-icons/fa'

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
    <Box 
      display="flex" 
      alignItems="center" 
      justifyContent="center" 
      p={4}
      bg="surface"
      minH="100dvh"
    >
      <Container maxW="md" position="relative" zIndex={1}>
        <Card
          backdropFilter="blur(10px)"
          bg="whiteAlpha.100"
          border="1px solid rgba(255,255,255,0.2)"
          borderRadius="2xl"
          boxShadow="0 8px 32px rgba(0,0,0,0.3)"
          overflow="hidden"
        >
          <CardBody p={8}>
            <VStack spacing={8} textAlign="center">
              <VStack spacing={3}>
                <Heading 
                  size="xl" 
                  bgGradient="linear(to-r, brand.400, highlight)"
                  bgClip="text"
                  fontWeight="bold"
                >
                  Join a Game
                </Heading>
                <Text color="textSecondary" fontSize="lg">
                  Enter the room ID to join an existing game
                </Text>
              </VStack>
              <VStack spacing={6} w="100%">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleJoinGame();
                }} style={{ width: '100%' }}>
                  <VStack spacing={6} w="100%">
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none">
                        <FaKey color="var(--chakra-colors-textSecondary)" />
                      </InputLeftElement>
                      <Input
                        placeholder="Enter Room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        bg="whiteAlpha.200"
                        borderColor="whiteAlpha.300"
                        color="textPrimary"
                        _placeholder={{ color: 'textSecondary' }}
                        _focus={{
                          borderColor: 'brand.400',
                          boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
                          bg: 'whiteAlpha.300',
                        }}
                        _hover={{ bg: 'whiteAlpha.300' }}
                        borderRadius="xl"
                      />
                    </InputGroup>
                    {!currentUser && (
                      <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                          <FaUser color="var(--chakra-colors-textSecondary)" />
                        </InputLeftElement>
                        <Input
                          placeholder="Enter Your Name"
                          value={guestName}
                          onChange={(e) => setLocalGuestName(e.target.value)}
                          bg="whiteAlpha.200"
                          borderColor="whiteAlpha.300"
                          color="textPrimary"
                          _placeholder={{ color: 'textSecondary' }}
                          _focus={{
                            borderColor: 'brand.400',
                            boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
                            bg: 'whiteAlpha.300',
                          }}
                          _hover={{ bg: 'whiteAlpha.300' }}
                          borderRadius="xl"
                        />
                      </InputGroup>
                    )}
                    <Button
                      type="submit"
                      bgGradient="linear(to-r, brand.400, brand.500)"
                      color="white"
                      fontWeight="bold"
                      _hover={{ 
                        opacity: 0.9,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(16, 163, 127, 0.3)',
                      }}
                      _active={{
                        transform: 'translateY(0)',
                      }}
                      borderRadius="xl"
                      px={8}
                      py={4}
                      size="lg"
                      w="100%"
                      isLoading={isLoading}
                      loadingText="Joining..."
                      transition="all 0.2s"
                    >
                      Join Game
                    </Button>
                  </VStack>
                </form>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  )
}

export default JoinGame 