import React, { useEffect, useState } from 'react';
import {
  VStack,
  Text,
  useToast,
  Card,
  CardBody,
  Heading,
  SimpleGrid,
  Box,
  Image,
  Button,
  Progress,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { useGame } from '../context/GameContext';
import { useParams } from 'react-router-dom';

const VOTING_DURATION = 30; // 30 seconds for voting

export const VotingPhase: React.FC = () => {
  const { gameState, currentPlayer } = useGame();
  const { roomId } = useParams<{ roomId: string }>();
  const toast = useToast();
  const [timeRemaining, setTimeRemaining] = useState(VOTING_DURATION);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkVotingStatus = async () => {
      if (!roomId) return;

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/games/${roomId}/votes/status`);
        const data = await response.json();

        if (data.timeRemaining !== undefined) {
          setTimeRemaining(data.timeRemaining);
        }

        if (data.hasVoted) {
          setHasVoted(true);
        }

        // Check if all images are generated
        if (gameState?.images && gameState.images.length > 0) {
          const allImagesGenerated = gameState.images.every(img => img.url);
          setIsLoading(!allImagesGenerated);
        }

        if (data.shouldEndRound) {
          // End the voting round
          await fetch(`${import.meta.env.VITE_API_URL}/games/${roomId}/end-voting`, {
            method: 'POST',
          });
        }
      } catch (error) {
        console.error('Error checking voting status:', error);
      }
    };

    // Initial check
    checkVotingStatus();

    // Check status every second
    const interval = setInterval(checkVotingStatus, 1000);

    return () => clearInterval(interval);
  }, [roomId, gameState?.images]);

  const handleVote = async (imageId: string) => {
    if (!currentPlayer || !roomId || hasVoted) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/games/${roomId}/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          voterId: currentPlayer.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      setHasVoted(true);
      toast({
        title: 'Success',
        description: 'Your vote has been recorded',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Check if all players have voted
      const statusResponse = await fetch(`${import.meta.env.VITE_API_URL}/games/${roomId}/votes/status`);
      const statusData = await statusResponse.json();

      if (statusData.allPlayersVoted) {
        // End the voting round
        await fetch(`${import.meta.env.VITE_API_URL}/games/${roomId}/end-voting`, {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit vote',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!gameState) return null;

  return (
    <VStack spacing={8} align="stretch" maxW="1200px" mx="auto" p={4}>
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md">Round {gameState.currentRound} - Vote for Your Favorite</Heading>
            <Text>Choose the image that best represents the word:</Text>
            <Text fontSize="xl" fontWeight="bold" color="blue.500">
              {gameState.currentWord}
            </Text>
            
            <Box>
              <Text mb={2}>Time Remaining: {Math.ceil(timeRemaining)} seconds</Text>
              <Progress 
                value={(timeRemaining / VOTING_DURATION) * 100} 
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

      {isLoading ? (
        <Center py={20}>
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text fontSize="lg" color="gray.600">
              Generating images... Please wait
            </Text>
          </VStack>
        </Center>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {gameState.images?.map((image) => (
            <Card 
              key={image.id} 
              cursor={hasVoted ? 'default' : 'pointer'} 
              _hover={hasVoted ? {} : { transform: 'scale(1.02)', shadow: 'lg' }} 
              transition="all 0.2s"
              opacity={hasVoted ? 0.7 : 1}
              onClick={() => !hasVoted && handleVote(image.id)}
              position="relative"
              overflow="hidden"
            >
              <CardBody p={0}>
                <VStack spacing={0}>
                  <Image
                    src={image.url}
                    alt="Generated image"
                    objectFit="cover"
                    w="100%"
                    h="300px"
                  />
                  <Box 
                    p={4} 
                    w="100%" 
                    bg={hasVoted ? 'gray.100' : 'white'}
                    borderTop="1px"
                    borderColor="gray.200"
                  >
                    <Text 
                      fontSize="lg" 
                      fontWeight="medium" 
                      textAlign="center"
                      color={hasVoted ? 'gray.500' : 'blue.500'}
                    >
                      {hasVoted ? 'Voted' : 'Click to Vote'}
                    </Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </VStack>
  );
}; 