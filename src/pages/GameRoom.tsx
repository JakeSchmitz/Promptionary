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
import { gameWords } from '../data/words'

const PLACEHOLDER_IMAGE = 'https://placehold.co/1024x1024/png?text=NPC+Image'

const GameRoom = () => {
  const { roomId: urlRoomId } = useParams()
  const navigate = useNavigate()
  const { gameState, roomId, playerId, playerName, submitPrompt, startGame, startNextRound, submitVote } = useGame()

  const [prompt, setPrompt] = useState('')
  const [timeLeft, setTimeLeft] = useState(30)
  const [votingTimeLeft, setVotingTimeLeft] = useState(30)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Ensure roomId from URL matches context
  useEffect(() => {
    if (urlRoomId && urlRoomId !== roomId) {
      // Optionally handle mismatch, e.g., redirect or error
      console.error('Room ID mismatch')
    }
  }, [urlRoomId, roomId])

  const players = gameState?.players || []
  const phase = gameState?.phase || 'LOBBY'
  const images = gameState?.images || []
  const votes = gameState?.votes || []
  const scores = players.reduce((acc, p) => ({ ...acc, [p.name]: p.score }), {})
  const currentWord = gameState?.currentWord || ''
  const excludedWords = gameWords.find(w => w.word === currentWord)?.excluded || []

  useEffect(() => {
    if (phase === 'PROMPT' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (phase === 'PROMPT' && timeLeft === 0) {
      handlePromptSubmit()
    }
  }, [phase, timeLeft])

  useEffect(() => {
    if (phase === 'VOTING' && votingTimeLeft > 0) {
      const timer = setTimeout(() => setVotingTimeLeft(votingTimeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (phase === 'VOTING' && votingTimeLeft === 0) {
      handleRoundEnd()
    }
  }, [phase, votingTimeLeft])

  const handlePromptSubmit = async () => {
    if (isSubmitting || !prompt.trim()) return
    setIsSubmitting(true)
    await submitPrompt(prompt)
    setIsSubmitting(false)
    setVotingTimeLeft(30)
  }

  const handleVote = (imageId: string) => {
    submitVote(imageId)
  }

  const handleRoundEnd = () => {
    // No-op: handled by context
  }

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8}>
        <Heading>Game Room: {roomId}</Heading>

        {phase === 'LOBBY' && (
          <Box w="100%" p={6} borderWidth={1} borderRadius="lg">
            <VStack spacing={4}>
              <Heading size="md">Players</Heading>
              {players.map((player) => (
                <Text key={player.id}>{player.name}</Text>
              ))}
              <Button colorScheme="blue" onClick={startGame}>
                Start Game
              </Button>
            </VStack>
          </Box>
        )}

        {phase === 'PROMPT' && (
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

        {phase === 'VOTING' && (
          <Box w="100%" p={6} borderWidth={1} borderRadius="lg">
            <VStack spacing={4}>
              <Heading size="md">Vote for the Best Image</Heading>
              <Text>Time left: {votingTimeLeft}s</Text>
              <SimpleGrid columns={3} spacing={4}>
                {images.map((image) => (
                  <Box
                    key={image.id}
                    cursor="pointer"
                    onClick={() => handleVote(image.id)}
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="transform 0.2s"
                    p={2}
                    borderWidth={1}
                    borderRadius="md"
                  >
                    <Image 
                      src={image.url} 
                      alt={`Image by ${players.find(p => p.id === image.playerId)?.name || 'Unknown'}`}
                      borderRadius="md"
                      objectFit="cover"
                      w="100%"
                      h="300px"
                    />
                    <Text mt={2} fontSize="sm" color="gray.600">
                      By: {players.find(p => p.id === image.playerId)?.name || 'Unknown'}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>
        )}

        {phase === 'RESULTS' && (
          <Box w="100%" p={6} borderWidth={1} borderRadius="lg">
            <VStack spacing={4}>
              <Heading size="md">Round Results</Heading>
              <SimpleGrid columns={3} spacing={4}>
                {images.map((image) => (
                  <Box 
                    key={image.id}
                    p={2}
                    borderWidth={1}
                    borderRadius="md"
                  >
                    <Image 
                      src={image.url} 
                      alt={`Image by ${players.find(p => p.id === image.playerId)?.name || 'Unknown'}`}
                      borderRadius="md"
                      objectFit="cover"
                      w="100%"
                      h="300px"
                    />
                    <Text mt={2}>Votes: {votes.filter(v => v.imageId === image.id).length}</Text>
                    <Text>Created by: {players.find(p => p.id === image.playerId)?.name || 'Unknown'}</Text>
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