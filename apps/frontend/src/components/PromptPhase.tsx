import React, { useEffect, useState } from 'react';
import {
  VStack,
  Text,
  useToast,
  Card,
  CardBody,
  Heading,
  Box,
  Progress,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Button,
  Image,
  Center,
  Spinner,
} from '@chakra-ui/react';
import { useGame } from '../context/GameContext';
import { useParams } from 'react-router-dom';
import { API_URL } from '../utils/env';

const ROUND_DURATION = 60; // 60 seconds for prompt phase

interface PromptPhaseProps {
  initialWord?: string;
  initialExclusionWords?: string[];
}

export const PromptPhase: React.FC<PromptPhaseProps> = ({ initialWord, initialExclusionWords }) => {
  const { gameState, currentPlayer, submitPrompt } = useGame();
  const { roomId } = useParams<{ roomId: string }>();
  const toast = useToast();
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(ROUND_DURATION);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    const checkRoundStatus = async () => {
      if (!roomId) return;

      try {
        const statusResponse = await fetch(`${API_URL}/games/${roomId}/round/status`);
        const data = await statusResponse.json();

        if (data.timeRemaining !== undefined) {
          setTimeRemaining(data.timeRemaining);
        }

        // Check if the current player has submitted
        if (data.hasSubmitted) {
          setHasSubmitted(true);
        }

        if (data.shouldEndRound) {
          // End the round
          await fetch(`${API_URL}/games/${roomId}/end-round`, {
            method: 'POST',
          });
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
  }, [roomId]);

  const validatePrompt = (text: string): string | null => {
    const targetWord = initialWord || gameState?.currentWord;
    if (!targetWord) return null;

    const lowerText = text.toLowerCase();
    const lowerTarget = targetWord.toLowerCase();
    const lowerExclusions = (initialExclusionWords || gameState?.exclusionWords || []).map(w => w.toLowerCase());

    // Check for target word
    if (lowerText.includes(lowerTarget)) {
      return `Your prompt cannot include the target word "${targetWord}"`;
    }

    // Check for excluded words
    const foundExclusions = lowerExclusions.filter(word => lowerText.includes(word));
    if (foundExclusions.length > 0) {
      return `Your prompt cannot include these words: ${foundExclusions.join(', ')}`;
    }

    return null;
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrompt = e.target.value;
    setPrompt(newPrompt);
    setError(validatePrompt(newPrompt));
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || !currentPlayer || !roomId) return;

    const validationError = validatePrompt(prompt);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitPrompt(prompt);
      setHasSubmitted(true);
      toast({
        title: 'Success',
        description: 'Your prompt has been submitted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error submitting prompt:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit prompt');
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

  if (!gameState) return null;

  const targetWord = initialWord || gameState.currentWord;
  const exclusionWords = initialExclusionWords || gameState.exclusionWords || [];

  return (
    <VStack spacing={8} align="stretch" maxW="1200px" mx="auto" p={4}>
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="lg" color="brand.600">Prompt Phase</Heading>
            <Text fontSize="lg" color="textSecondary">
              Create a prompt to generate an image based on the word. You have 1 minute to submit your prompt!
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="brand.500">
              Word: {targetWord}
            </Text>
            {exclusionWords && exclusionWords.length > 0 && (
              <Box>
                <Text fontSize="md" fontWeight="bold" color="red.500" mb={2}>
                  Excluded Words:
                </Text>
                <Text fontSize="md" color="red.500">
                  {exclusionWords.join(', ')}
                </Text>
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

      {!hasSubmitted ? (
        <Card>
          <CardBody>
            <VStack spacing={4}>
              <FormControl isInvalid={!!error}>
                <FormLabel fontSize="lg">Your Prompt</FormLabel>
                <Input
                  value={prompt}
                  onChange={handlePromptChange}
                  placeholder="Enter your prompt here..."
                  size="lg"
                  isDisabled={isSubmitting}
                />
                {error && (
                  <FormErrorMessage>{error}</FormErrorMessage>
                )}
              </FormControl>
              <Button
                colorScheme="blue"
                size="lg"
                width="100%"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                loadingText="Submitting..."
                isDisabled={!prompt.trim() || isSubmitting || !!error}
              >
                Submit Prompt
              </Button>
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <Center>
              <VStack spacing={4}>
                <Spinner size="xl" />
                <Text fontSize="lg">Waiting for other players...</Text>
              </VStack>
            </Center>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
}; 