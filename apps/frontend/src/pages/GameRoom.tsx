import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Grid,
  Image,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  HStack,
  Badge,
} from '@chakra-ui/react'
import { useGame } from '../context/GameContext'
import GameLobby from '../components/GameLobby'

const GameRoom = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { gameState, currentPlayer, submitPrompt, submitVote, startNewRound, startGame, refreshGameState } = useGame()

  // Initial load effect
  useEffect(() => {
    const initializeGame = async () => {
      try {
        await refreshGameState()
      } catch (error) {
        console.error('Failed to refresh game state:', error)
        toast({
          title: 'Error',
          description: 'Failed to load game state',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      } finally {
        setIsLoading(false)
      }
    }

    initializeGame()
  }, [refreshGameState, toast])

  useEffect(() => {
    // Only redirect if we've finished loading and there's no game state
    if (!isLoading && !gameState) {
      navigate('/')
    }
  }, [gameState, navigate, isLoading])

  const handleSubmitPrompt = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      await submitPrompt(prompt)
      setPrompt('')
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit prompt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleVote = async (submissionId: string) => {
    try {
      await submitVote(submissionId)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit vote',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleStartGame = async () => {
    try {
      await startGame()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start game',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  if (!gameState) {
    return null
  }

  // Initialize rounds array if it doesn't exist
  if (!gameState.rounds) {
    gameState.rounds = []
  }

  // Ensure currentRound is valid
  const currentRoundIndex = gameState.currentRound ?? 0
  const currentRound = gameState.rounds[currentRoundIndex] ?? {
    targetWord: '',
    submissions: [],
    isComplete: false
  }

  if (gameState.phase === 'LOBBY') {
    return (
      <Container maxW="container.xl" py={20}>
        <GameLobby roomId={roomId!} onStartGame={handleStartGame} />
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={20}>
      <VStack spacing={8} align="stretch">
        {/* Game Header */}
        <Box>
          <Heading size="lg">Room: {roomId}</Heading>
          <Text mt={2}>
            Round {gameState.currentRound + 1} of {gameState.totalRounds}
          </Text>
          <Text>Target Word: {currentRound?.targetWord}</Text>
        </Box>

        {/* Player Scores */}
        <Box>
          <Heading size="md" mb={4}>Scores</Heading>
          <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={4}>
            {gameState.players.map(player => (
              <Box
                key={player.id}
                p={4}
                borderWidth={1}
                borderRadius="lg"
                bg={player.id === currentPlayer?.id ? 'blue.50' : 'white'}
              >
                <Text fontWeight="bold">{player.name}</Text>
                <Text>Score: {player.score}</Text>
              </Box>
            ))}
          </Grid>
        </Box>

        {/* Submissions Grid */}
        {gameState.phase === 'PROMPT' && (
          <Box>
            <HStack justify="space-between" mb={4}>
              <Heading size="md">Submissions</Heading>
              <Button onClick={onOpen} colorScheme="blue">
                Submit Prompt
              </Button>
            </HStack>
            <Grid
              templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
              gap={6}
            >
              {currentRound?.submissions.map(submission => (
                <Box
                  key={submission.playerId}
                  borderWidth={1}
                  borderRadius="lg"
                  overflow="hidden"
                  position="relative"
                >
                  <Image
                    src={submission.imageUrl}
                    alt="Generated image"
                    width="100%"
                    height="300px"
                    objectFit="cover"
                  />
                  {currentRound.isComplete && (
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      bg="blackAlpha.800"
                      color="white"
                      p={4}
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                      textAlign="center"
                    >
                      <Text fontSize="lg" fontWeight="bold">
                        Prompt: {submission.prompt}
                      </Text>
                      <Text mt={2}>
                        By: {gameState.players.find(p => p.id === submission.playerId)?.name}
                      </Text>
                      <Badge colorScheme="green" mt={2}>
                        Votes: {submission.votes.length}
                      </Badge>
                    </Box>
                  )}
                  {!currentRound.isComplete && (
                    <Button
                      position="absolute"
                      bottom={4}
                      left="50%"
                      transform="translateX(-50%)"
                      onClick={() => handleVote(submission.playerId)}
                      colorScheme="blue"
                      isDisabled={submission.votes.includes(currentPlayer?.id || '')}
                    >
                      {submission.votes.includes(currentPlayer?.id || '') ? 'Voted' : 'Vote'}
                    </Button>
                  )}
                </Box>
              ))}
            </Grid>
          </Box>
        )}

        {/* Submit Prompt Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Submit Your Prompt</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <Text>
                  Create a prompt that will generate an image related to: {currentRound?.targetWord}
                </Text>
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your prompt..."
                />
                <Button colorScheme="blue" onClick={handleSubmitPrompt} width="100%">
                  Submit
                </Button>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  )
}

export default GameRoom 