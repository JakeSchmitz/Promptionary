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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Radio,
  RadioGroup,
  Stack,
  Card,
  CardBody,
  Badge,
} from '@chakra-ui/react'
import { FaPlus, FaGamepad, FaHistory, FaUser, FaUsers, FaTrophy } from 'react-icons/fa'
import { useGame } from '../context/GameContext'

const Dashboard = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedGameMode, setSelectedGameMode] = useState<'PROMPT_ANYTHING' | 'PROMPTOPHONE'>('PROMPT_ANYTHING')
  const { createGame } = useGame()

  const handleCreateGame = async () => {
    try {
      console.log('Starting game creation...')
      setIsCreating(true)
      console.log('Calling createGame from context...')
      const roomId = await createGame(selectedGameMode)
      console.log('Game created with roomId:', roomId)
      
      toast({
        title: 'Game Created',
        description: `Your game room is ready! Room ID: ${roomId}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      
      navigate(`/game/${roomId}`)
    } catch (error) {
      console.error('Error creating game:', error)
      toast({
        title: 'Error',
        description: 'Failed to create game. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsCreating(false)
      setIsModalOpen(false)
    }
  }

  const dashboardItems = [
    {
      title: 'Create Game',
      description: 'Start a new game and invite friends to join',
      icon: FaPlus,
      action: () => setIsModalOpen(true),
      gradient: 'linear(to-br, brand.400, brand.500)',
      badge: 'New',
    },
    {
      title: 'Join Game',
      description: 'Enter a room code to join an existing game',
      icon: FaGamepad,
      action: () => navigate('/join'),
      gradient: 'linear(to-br, info, brand.400)',
    },
    {
      title: 'Game History',
      description: 'View your past games and performance',
      icon: FaHistory,
      action: () => navigate('/history'),
      gradient: 'linear(to-br, highlight, orange.400)',
    },
    {
      title: 'Account',
      description: 'Manage your account settings and preferences',
      icon: FaUser,
      action: () => navigate('/account'),
      gradient: 'linear(to-br, purple.400, pink.400)',
    },
  ]

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8}>
        {/* Action Tiles */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(2, 1fr)' }} gap={6} w="100%">
          {dashboardItems.map((item, index) => (
            <Card
              key={index}
              backdropFilter="blur(10px)"
              bg="whiteAlpha.100"
              border="1px solid rgba(255,255,255,0.2)"
              borderRadius="2xl"
              boxShadow="0 8px 32px rgba(0,0,0,0.3)"
              overflow="hidden"
              cursor="pointer"
              onClick={item.action}
              _hover={{
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                borderColor: 'rgba(255,255,255,0.3)',
              }}
              transition="all 0.3s ease"
              position="relative"
            >
              {item.badge && (
                <Badge
                  position="absolute"
                  top={4}
                  right={4}
                  bgGradient="linear(to-r, highlight, orange.400)"
                  color="white"
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="bold"
                  zIndex={1}
                >
                  {item.badge}
                </Badge>
              )}
              
              <CardBody p={8}>
                <VStack spacing={6} align="stretch" textAlign="center">
                  <Box
                    w="80px"
                    h="80px"
                    mx="auto"
                    borderRadius="2xl"
                    bgGradient={item.gradient}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 8px 25px rgba(0,0,0,0.2)"
                    _groupHover={{
                      transform: 'scale(1.1)',
                    }}
                    transition="all 0.3s ease"
                  >
                    <Icon as={item.icon} boxSize={8} color="white" />
                  </Box>
                  
                  <VStack spacing={3}>
                    <Heading size="lg" color="textPrimary">
                      {item.title}
                    </Heading>
                    <Text color="textSecondary" fontSize="md" lineHeight="tall">
                      {item.description}
                    </Text>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </Grid>

        {/* Recent Games Section */}
        <Box w="100%">
          <Card
            backdropFilter="blur(10px)"
            bg="whiteAlpha.100"
            border="1px solid rgba(255,255,255,0.2)"
            borderRadius="2xl"
            boxShadow="0 8px 32px rgba(0,0,0,0.3)"
          >
            <CardBody p={6}>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md" color="textPrimary">
                    Recent Games
                  </Heading>
                  <Badge
                    bgGradient="linear(to-r, brand.400, brand.500)"
                    color="white"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="sm"
                  >
                    Coming Soon
                  </Badge>
                </HStack>
                <Text color="textSecondary" textAlign="center" py={8}>
                  Your recent games will appear here
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </Box>
      </VStack>

      {/* Create Game Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} isCentered>
        <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.300" />
        <ModalContent
          backdropFilter="blur(10px)"
          bg="whiteAlpha.200"
          border="1px solid rgba(255,255,255,0.2)"
          borderRadius="2xl"
          boxShadow="0 8px 32px rgba(0,0,0,0.3)"
        >
          <ModalHeader color="textPrimary">Create New Game</ModalHeader>
          <ModalCloseButton color="textPrimary" />
          <ModalBody pb={6}>
            <VStack spacing={6}>
              <Text color="textSecondary">
                Choose a game mode to get started:
              </Text>
              
              <RadioGroup value={selectedGameMode} onChange={(value: 'PROMPT_ANYTHING' | 'PROMPTOPHONE') => setSelectedGameMode(value)}>
                <Stack spacing={4}>
                  <Card
                    bg={selectedGameMode === 'PROMPT_ANYTHING' ? 'whiteAlpha.200' : 'whiteAlpha.100'}
                    border={selectedGameMode === 'PROMPT_ANYTHING' ? '2px solid' : '1px solid'}
                    borderColor={selectedGameMode === 'PROMPT_ANYTHING' ? 'brand.400' : 'rgba(255,255,255,0.2)'}
                    borderRadius="xl"
                    p={4}
                    cursor="pointer"
                    onClick={() => setSelectedGameMode('PROMPT_ANYTHING')}
                    _hover={{ bg: 'whiteAlpha.200' }}
                    transition="all 0.2s"
                  >
                    <Radio value="PROMPT_ANYTHING" colorScheme="brand" size="lg">
                      <VStack align="start" spacing={1} ml={3}>
                        <HStack>
                          <Text fontWeight="bold" color="textPrimary">Prompt Anything</Text>
                          <Badge bgGradient="linear(to-r, brand.400, brand.500)" color="white" fontSize="xs">
                            Popular
                          </Badge>
                        </HStack>
                        <Text fontSize="sm" color="textSecondary">
                          Create prompts for any word and vote on the best images
                        </Text>
                      </VStack>
                    </Radio>
                  </Card>
                  
                  <Card
                    bg={selectedGameMode === 'PROMPTOPHONE' ? 'whiteAlpha.200' : 'whiteAlpha.100'}
                    border={selectedGameMode === 'PROMPTOPHONE' ? '2px solid' : '1px solid'}
                    borderColor={selectedGameMode === 'PROMPTOPHONE' ? 'brand.400' : 'rgba(255,255,255,0.2)'}
                    borderRadius="xl"
                    p={4}
                    cursor="pointer"
                    onClick={() => setSelectedGameMode('PROMPTOPHONE')}
                    _hover={{ bg: 'whiteAlpha.200' }}
                    transition="all 0.2s"
                  >
                    <Radio value="PROMPTOPHONE" colorScheme="brand" size="lg">
                      <VStack align="start" spacing={1} ml={3}>
                        <Text fontWeight="bold" color="textPrimary">Promptophone</Text>
                        <Text fontSize="sm" color="textSecondary">
                          Create prompts based on phone numbers and vote on the best images
                        </Text>
                      </VStack>
                    </Radio>
                  </Card>
                </Stack>
              </RadioGroup>
              
              <Button
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
                onClick={handleCreateGame}
                isLoading={isCreating}
                loadingText="Creating Game..."
                transition="all 0.2s"
              >
                Create Game
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}

export default Dashboard 