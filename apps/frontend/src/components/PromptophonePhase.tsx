import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Textarea,
  Button,
  Image,
  useToast,
  Card,
  CardBody,
  Badge,
  Center,
  Spinner,
  Progress,
  Divider,
} from '@chakra-ui/react';
import { useGame } from '../context/GameContext';
import { gameWords } from '../../../shared/data/words';
import { API_URL } from '../utils/env';

const ROUND_DURATION = 60; // 60 seconds for prompt phase

/**
 * PromptophonePhase handles all rounds of the Promptophone game mode.
 *
 * Game Flow:
 * - Each player is assigned a unique chain (word) at the start.
 * - In each round, players rotate and work on a different chain.
 * - In round 1, each player creates a prompt for their assigned word.
 * - In subsequent rounds, each player creates a prompt describing the image generated in the previous round for their current chain.
 * - After all rounds, the game transitions to results.
 *
 * Phase transitions:
 * - PROMPT: Players submit prompts for their assigned chain in the current round.
 * - After all players submit, images are generated and the next round begins (or results if last round).
 * - RESULTS: Game is complete, results are shown.
 */
export const PromptophonePhase: React.FC = () => {
  const { gameState, currentPlayer, submitPrompt } = useGame();
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(ROUND_DURATION);
  const toast = useToast();

  // Add debug logging
  useEffect(() => {
    console.log('PromptophonePhase - Game State:', {
      gameMode: gameState?.gameMode,
      phase: gameState?.phase,
      currentRound: gameState?.currentRound,
      promptChains: gameState?.promptChains,
      currentWord: gameState?.currentWord,
    });
  }, [gameState]);

  // Check round status and timer
  useEffect(() => {
    const checkRoundStatus = async () => {
      if (!gameState?.roomId || !currentPlayer) return;

      try {
        const statusResponse = await fetch(`${API_URL}/games/${gameState.roomId}/round/status?gameMode=PROMPTOPHONE&playerId=${currentPlayer.id}`);
        const data = await statusResponse.json();

        if (data.timeRemaining !== undefined) {
          setTimeRemaining(data.timeRemaining);
        }

        // Check if the current player has submitted
        if (data.hasSubmitted) {
          setHasSubmitted(true);
        }

        // Auto-submit if timer expires and player hasn't submitted
        if (data.timeRemaining <= 0 && !hasSubmitted && prompt.trim()) {
          console.log('Timer expired, auto-submitting prompt');
          await handleAutoSubmit();
        }

        if (data.shouldEndRound) {
          console.log('Round should end, transitioning to next phase');
          // Call the end-round endpoint to transition to next phase
          try {
            await fetch(`${API_URL}/games/${gameState.roomId}/end-round`, {
              method: 'POST',
            });
          } catch (error) {
            console.error('Error ending round:', error);
          }
        }
      } catch (error) {
        console.error('Error checking round status:', error);
      }
    };

    // Initial check
    checkRoundStatus();

    // Check status every second
    const interval = setInterval(checkRoundStatus, 1000);

    return () => clearInterval(interval);
  }, [gameState?.roomId, currentPlayer, hasSubmitted, prompt]);

  // Check if current player has already submitted for this round
  useEffect(() => {
    if (!gameState || !currentPlayer) return;

    // Check if player has already submitted an image for this round
    // In Promptophone, each player can submit once per round/chain
    const hasSubmittedImage = gameState.images?.some(img => 
      img.playerId === currentPlayer.id && 
      !img.url.startsWith('placeholder-')
    );
    
    setHasSubmitted(!!hasSubmittedImage);
  }, [gameState, currentPlayer]);

  if (!gameState || !currentPlayer) {
    console.log('PromptophonePhase - Missing game state or player');
    return null;
  }

  // --- ROUND-BASED CHAIN ASSIGNMENT LOGIC ---
  // Each player rotates through all chains, working on a different one each round
  const numPlayers = gameState.players.length;
  const playerIndex = gameState.players.findIndex(p => p.id === currentPlayer.id);
  
  // For each round, shift the chains one position to the right
  const chainIndex = (playerIndex + (gameState.currentRound - 1)) % numPlayers;
  const assignedChain = gameState.promptChains?.[chainIndex];

  console.log('PromptophonePhase - Chain assignment:', {
    playerIndex,
    currentRound: gameState.currentRound,
    chainIndex,
    numPlayers,
    assignedChainWord: assignedChain?.originalWord
  });

  if (!assignedChain) {
    console.log('PromptophonePhase - No assigned chain found for current player/round');
    return (
      <Box p={4}>
        <Text>Loading game state...</Text>
      </Box>
    );
  }

  // Get the image from the previous round in this chain (if not round 1)
  const previousStep = assignedChain.chain[gameState.currentRound - 2];
  const currentImage = previousStep?.imageUrl;

  console.log('PromptophonePhase - Current round-based chain state:', {
    assignedChain,
    currentImage,
    currentRound: gameState.currentRound,
    playerIndex,
    chainIndex
  });

  // Handle prompt submission for this round/chain
  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPrompt(prompt);
      setPrompt('');
      setHasSubmitted(true);
      toast({
        title: 'Success',
        description: 'Your prompt has been submitted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit prompt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle auto-submission when timer expires
  const handleAutoSubmit = async () => {
    if (!prompt.trim() || !currentPlayer) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/games/${gameState.roomId}/auto-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          playerId: currentPlayer.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to auto-submit prompt');
      }

      const data = await response.json();
      setPrompt('');
      setHasSubmitted(true);
      toast({
        title: 'Auto-submitted',
        description: 'Your prompt was automatically submitted when time ran out',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error auto-submitting prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to auto-submit prompt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get exclusion words for the chain's original word
  const exclusionWords = (gameWords.find(w => w.word.toLowerCase() === assignedChain.originalWord.toLowerCase())?.exclusionWords) || [];

  return (
    <VStack spacing={8} align="stretch" maxW="1200px" mx="auto" p={4}>
      <Card
        bg="whiteAlpha.100"
        backdropFilter="blur(10px)"
        border="1px solid rgba(255,255,255,0.2)"
        borderRadius="2xl"
        boxShadow="0 8px 32px rgba(0,0,0,0.3)"
      >
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="lg" bgGradient="linear(to-r, brand.400, highlight)" bgClip="text" fontWeight="bold">Promptophone Phase</Heading>
            <Text fontSize="lg" color="textSecondary">
              {gameState.phase === 'PROMPT' ? 'Describe the image or word for your assigned chain.' : 'Waiting for next phase...'}
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="brand.500">
              Word: {assignedChain.originalWord}
            </Text>
            {currentImage && (
              <Box>
                <Text fontSize="md" fontWeight="bold" color="brand.400" mb={2}>
                  Previous Image:
                </Text>
                <Image
                  src={currentImage}
                  alt="Previous round image"
                  borderRadius="md"
                  objectFit="cover"
                  w="100%"
                  h="300px"
                  mb={2}
                />
              </Box>
            )}
            <Box>
              <Text mb={2}>Time Remaining: {Math.ceil(timeRemaining)} seconds</Text>
              <Progress 
                value={(timeRemaining / ROUND_DURATION) * 100} 
                colorScheme={timeRemaining < 10 ? 'red' : 'blue'}
                borderRadius="md"
                size="sm"
                hasStripe
                isAnimated
              />
            </Box>
          </VStack>
        </CardBody>
      </Card>
      <Divider my={4} />
      {!hasSubmitted ? (
        <Card
          bg="whiteAlpha.100"
          backdropFilter="blur(10px)"
          border="1px solid rgba(255,255,255,0.2)"
          borderRadius="2xl"
          boxShadow="0 8px 32px rgba(0,0,0,0.3)"
        >
          <CardBody>
            <VStack spacing={4}>
              <Textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                size="lg"
                isDisabled={isSubmitting}
                borderRadius="xl"
              />
              <Button
                bgGradient="linear(to-r, brand.400, brand.500)"
                color="white"
                fontWeight="bold"
                _hover={{ opacity: 0.9, transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(16, 163, 127, 0.3)' }}
                _active={{ transform: 'translateY(0)' }}
                borderRadius="xl"
                px={8}
                py={4}
                size="lg"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                loadingText="Submitting..."
                w={{ base: '100%', md: 'auto' }}
                transition="all 0.2s"
              >
                Submit Prompt
              </Button>
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <Card
          bg="whiteAlpha.100"
          backdropFilter="blur(10px)"
          border="1px solid rgba(255,255,255,0.2)"
          borderRadius="2xl"
          boxShadow="0 8px 32px rgba(0,0,0,0.3)"
        >
          <CardBody>
            <Center>
              <Text fontSize="lg" color="brand.500" fontWeight="bold">Waiting for other players...</Text>
            </Center>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
}; 