import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Grid,
  Heading,
  Text,
  Button,
  useToast,
  VStack,
  HStack,
  Icon,
} from '@chakra-ui/react'
import { FaPlus, FaGamepad, FaHistory, FaUser } from 'react-icons/fa'
import { useGame } from '../context/GameContext'

const Dashboard = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const { createGame } = useGame()

  const handleCreateGame = async () => {
    try {
      console.log('Starting game creation...')
      setIsCreating(true)
      console.log('Calling createGame from context...')
      const roomId = await createGame()
      console.log('Game created with roomId:', roomId)
      
      toast({
        title: 'Game Created',
        description: 'Your game room is ready!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      console.log('Navigating to game room:', `/game/${roomId}`)
      navigate(`/game/${roomId}`)
    } catch (error) {
      console.error('Error in handleCreateGame:', error)
      toast({
        title: 'Error',
        description: 'Failed to create game',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsCreating(false)
    }
  }

  const menuItems = [
    {
      title: 'New Game',
      description: 'Create a new game room and invite friends to play',
      icon: FaPlus,
      onClick: handleCreateGame,
      isLoading: isCreating,
    },
    {
      title: 'Join Game',
      description: 'Enter a game room code to join an existing game',
      icon: FaGamepad,
      onClick: () => navigate('/join'),
    },
    {
      title: 'Game History',
      description: 'View your past games and results',
      icon: FaHistory,
      onClick: () => navigate('/history'),
    },
    {
      title: 'Account',
      description: 'Manage your account settings and preferences',
      icon: FaUser,
      onClick: () => navigate('/account'),
    },
  ]

  return (
    <Container maxW="container.xl" py={20}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg">Welcome to Promptionary</Heading>
          <Text mt={2} color="gray.600">
            Create or join a game to start playing!
          </Text>
        </Box>

        <Grid
          templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
          gap={6}
        >
          {menuItems.map((item, index) => (
            <Box
              key={index}
              p={6}
              borderWidth={1}
              borderRadius="lg"
              _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
              transition="all 0.2s"
              cursor="pointer"
              onClick={item.onClick}
              display="flex"
              flexDirection="column"
              height="100%"
            >
              <VStack spacing={4} align="stretch" flex="1">
                <Icon as={item.icon} boxSize={8} color="blue.500" />
                <Heading size="md">{item.title}</Heading>
                <Text color="gray.600" flex="1">
                  {item.description}
                </Text>
                <Button
                  colorScheme="blue"
                  onClick={(e) => {
                    e.stopPropagation()
                    item.onClick()
                  }}
                  isLoading={item.isLoading}
                  width="100%"
                  mt="auto"
                >
                  {item.title}
                </Button>
              </VStack>
            </Box>
          ))}
        </Grid>
      </VStack>
    </Container>
  )
}

export default Dashboard 