import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Input,
  SimpleGrid,
  Image,
} from '@chakra-ui/react'
import { useGame } from '../context/GameContext'

const PLACEHOLDER_IMAGE = 'https://placehold.co/1024x1024/png?text=NPC+Image'

type GamePhase = 'lobby' | 'prompt' | 'voting' | 'results'

const GameRoom = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { gameState, submitPrompt, startGame, startNextRound, submitVote } = useGame()

  const [prompt, setPrompt] = useState('')
  const [timeLeft, setTimeLeft] = useState(30)
  const [votingTimeLeft, setVotingTimeLeft] = useState(30)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const players = gameState.players.length > 0 ? gameState.players.map(p => p.name) : ['Player 1', 'Player 2', 'Player 3']
  const phase = gameState.phase as GamePhase
  const images = gameState.images
  const votes = gameState.votes
  const scores = gameState.players.reduce((acc, p) => ({ ...acc, [p.name]: p.score }), {})
  const currentWord = gameState.currentWord?.word || ''
  const excludedWords = gameState.currentWord?.excluded || []

  useEffect(() => {
    if (phase === 'prompt' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (phase === 'prompt' && timeLeft === 0) {
      handlePromptSubmit()
    }
  }, [phase, timeLeft])

  useEffect(() => {
    if (phase === 'voting' && votingTimeLeft > 0) {
      const timer = setTimeout(() => setVotingTimeLeft(votingTimeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (phase === 'voting' && votingTimeLeft === 0) {
      handleRoundEnd()
    }
  }, [phase, votingTimeLeft])

  const handlePromptSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    // Only generate image for the first player (user), others are NPCs
    await submitPrompt(prompt)
    // Fill in placeholder images for NPCs if needed
    const totalPlayers = players.length
    if (gameState.images.length < totalPlayers) {
      const placeholders = Array(totalPlayers - gameState.images.length).fill(PLACEHOLDER_IMAGE)
      gameState.images.push(...placeholders)
    }
    setIsSubmitting(false)
    setVotingTimeLeft(30)
  }

  const handleVote = (imageIndex: number) => {
    submitVote(imageIndex)
  }

  const handleRoundEnd = () => {
    // No-op: handled by context
  }

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8}>
        <Heading>Game Room: {roomId}</Heading>

        {phase === 'lobby' && (
          <Box w="100%" p={6} borderWidth={1} borderRadius="lg">
            <VStack spacing={4}>
              <Heading size="md">Players</Heading>
              {players.map((player, index) => (
                <Text key={index}>{player}</Text>
              ))}
              <Button colorScheme="blue" onClick={startGame}>
                Start Game
              </Button>
            </VStack>
          </Box>
        )}

        {phase === 'prompt' && (
          <Box w="100%" p={6} borderWidth={1} borderRadius="lg">
            <VStack spacing={4}>
              <Heading size="md">Your Word: {currentWord}</Heading>
              <Text>Excluded words: {excludedWords.join(', ')}</Text>
              <Input
                placeholder="Enter your prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                isDisabled={isSubmitting}
              />
              <Text>Time left: {timeLeft}s</Text>
              <Button
                colorScheme="blue"
                onClick={handlePromptSubmit}
                isDisabled={!prompt.trim() || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Prompt'}
              </Button>
            </VStack>
          </Box>
        )}

        {phase === 'voting' && (
          <Box w="100%" p={6} borderWidth={1} borderRadius="lg">
            <VStack spacing={4}>
              <Heading size="md">Vote for the Best Image</Heading>
              <Text>Time left: {votingTimeLeft}s</Text>
              <SimpleGrid columns={3} spacing={4}>
                {images.map((image, index) => (
                  <Box
                    key={index}
                    cursor="pointer"
                    onClick={() => handleVote(index)}
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="transform 0.2s"
                  >
                    <Image src={image} alt={`Image ${index + 1}`} />
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>
        )}

        {phase === 'results' && (
          <Box w="100%" p={6} borderWidth={1} borderRadius="lg">
            <VStack spacing={4}>
              <Heading size="md">Round Results</Heading>
              <SimpleGrid columns={3} spacing={4}>
                {images.map((image, index) => (
                  <Box key={index}>
                    <Image src={image} alt={`Image ${index + 1}`} />
                    <Text>Votes: {votes[index] || 0}</Text>
                    <Text>Created by: {players[index]}</Text>
                  </Box>
                ))}
              </SimpleGrid>
              <Button colorScheme="blue" onClick={startNextRound}>
                Next Round
              </Button>
            </VStack>
          </Box>
        )}
      </VStack>
    </Container>
  )
}

export default GameRoom 