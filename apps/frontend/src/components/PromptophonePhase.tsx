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
} from '@chakra-ui/react';
import { useGame } from '../context/GameContext';
import { PromptPhase } from './PromptPhase';

export const PromptophonePhase: React.FC = () => {
  const { gameState, currentPlayer, submitPrompt } = useGame();
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  if (!gameState || !currentPlayer) {
    console.log('PromptophonePhase - Missing game state or player');
    return null;
  }

  // For the first round, find the player's prompt chain and use its word
  if (gameState.currentRound === 1) {
    console.log('PromptophonePhase - Using PromptPhase for first round');
    const playerChain = gameState.promptChains?.find(chain => chain.playerId === currentPlayer.id);
    if (!playerChain) {
      console.log('PromptophonePhase - No prompt chain found for player');
      return (
        <Box p={4}>
          <Text>Loading game state...</Text>
        </Box>
      );
    }
    console.log('PromptophonePhase - Using word from player chain:', playerChain.originalWord);
    return <PromptPhase initialWord={playerChain.originalWord} />;
  }

  // Find the current player's chain
  const playerChain = gameState.promptChains?.find(chain => chain.playerId === currentPlayer.id);
  if (!playerChain) {
    console.log('PromptophonePhase - No chain found for current player');
    return (
      <Box p={4}>
        <Text>Loading game state...</Text>
      </Box>
    );
  }

  // Get the previous player's image from the chain
  const previousPlayerIndex = (gameState.currentRound - 2 + gameState.players.length) % gameState.players.length;
  const previousPlayer = gameState.players[previousPlayerIndex];
  const previousPlayerChain = gameState.promptChains?.find(chain => chain.playerId === previousPlayer.id);

  if (!previousPlayerChain) {
    console.log('PromptophonePhase - No chain found for previous player');
    return (
      <Box p={4}>
        <Text>Loading game state...</Text>
      </Box>
    );
  }

  // Get the current image to prompt for (from the previous player's chain)
  const currentImage = previousPlayerChain.chain[gameState.currentRound - 2]?.imageUrl;

  console.log('PromptophonePhase - Current chain state:', {
    playerChain,
    previousPlayerChain,
    currentImage,
    currentRound: gameState.currentRound,
    previousPlayerIndex,
    previousPlayer
  });

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

  return (
    <VStack spacing={8} align="stretch" maxW="800px" mx="auto" p={4}>
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md">Round {gameState.currentRound}</Heading>
            <Text color="gray.600">
              Create a prompt describing the image below
            </Text>
            {currentImage && (
              <Box>
                <Image
                  src={currentImage}
                  alt="Generated image"
                  borderRadius="md"
                  maxH="400px"
                  objectFit="contain"
                />
              </Box>
            )}
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt..."
              size="lg"
              minH="150px"
            />
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              loadingText="Submitting..."
            >
              Submit Prompt
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
}; 