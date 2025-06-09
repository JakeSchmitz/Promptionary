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

const Dashboard = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateGame = async () => {
    try {
      setIsCreating(true)
      // TODO: Call backend API to create a new game
      // For now, we'll generate a random room ID
      const roomId = Math.random().toString(36).substring(2, 8)
      navigate(`/game/${roomId}`)
    } catch (error) {
      console.error('Error creating game:', error)
      toast({
        title: 'Error',
        description: 'Failed to create a new game',
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
      description: 'Start a new game of Promptionary',
      icon: FaPlus,
      onClick: handleCreateGame,
      isLoading: isCreating,
    },
    {
      title: 'Join Game',
      description: 'Join an existing game',
      icon: FaGamepad,
      onClick: () => navigate('/'),
    },
    {
      title: 'Game History',
      description: 'View your past games',
      icon: FaHistory,
      onClick: () => navigate('/history'),
    },
    {
      title: 'Account',
      description: 'Manage your account settings',
      icon: FaUser,
      onClick: () => navigate('/account'),
    },
  ]

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg">Welcome to Promptionary</Heading>
          <Text mt={2} color="gray.600">
            Create a new game or join an existing one
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
              bg="white"
              _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
              transition="all 0.2s"
              cursor="pointer"
              onClick={item.onClick}
              display="flex"
              flexDirection="column"
              height="100%"
            >
              <VStack spacing={4} align="start" flex="1">
                <HStack>
                  <Icon as={item.icon} boxSize={6} color="blue.500" />
                  <Heading size="md">{item.title}</Heading>
                </HStack>
                <Text color="gray.600" flex="1">{item.description}</Text>
                <Button
                  colorScheme="blue"
                  width="100%"
                  isLoading={item.isLoading}
                  loadingText="Creating..."
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