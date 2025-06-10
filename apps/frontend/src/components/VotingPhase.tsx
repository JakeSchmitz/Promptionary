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
import { useNavigate } from 'react-router-dom';

const VOTING_DURATION = 60; // 60 seconds for voting phase

export const VotingPhase: React.FC = () => {
  const { gameState, currentPlayer, onEndVoting, setGameState } = useGame();
  const { roomId } = useParams<{ roomId: string }>();
  const toast = useToast();
  const [timeRemaining, setTimeRemaining] = useState(VOTING_DURATION);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkVotingStatus = async () => {
      if (!gameState || !currentPlayer) return;
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/games/${gameState.roomId}/votes/status?playerId=${currentPlayer.id}`
        );
        if (!response.ok) throw new Error('Failed to check voting status');
        const data = await response.json();
        
        // Only update timer if we're in voting phase and all images are loaded
        if (gameState.phase === 'VOTING' && allImagesLoaded) {
          setTimeRemaining(data.timeRemaining);
          if (data.shouldEndRound) {
            await onEndVoting();
          }
        }

        if (data.hasVoted) {
          setHasVoted(true);
        }

        // Check if all images are loaded
        if (gameState?.images && gameState.images.length > 0) {
          const allImagesLoaded = gameState.images.every(img => {
            // Check if the URL is a valid image URL (not a placeholder)
            return img.url && img.url !== '' && !img.url.startsWith('placeholder-');
          });
          setAllImagesLoaded(allImagesLoaded);
          setIsLoading(!allImagesLoaded);
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
  }, [gameState, currentPlayer, allImagesLoaded, onEndVoting]);

  const handleVote = async (imageId: string) => {
    if (!gameState || !currentPlayer) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/games/${gameState.roomId}/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          voterId: currentPlayer.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit vote');
      
      // Update local state with the new game state
      const updatedGameState = await response.json();
      setGameState(updatedGameState);
      
      // Show success message
      toast({
        title: 'Vote Submitted',
        description: 'Your vote has been recorded. You can change your vote until the voting phase ends.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit vote. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Check if the game has moved to results phase
  useEffect(() => {
    if (gameState?.phase === 'RESULTS') {
      // Navigate to results page or trigger results phase component
      navigate(`/games/${gameState.roomId}/results`);
    }
  }, [gameState?.phase, gameState?.roomId, navigate]);

  if (!gameState) return null;

  return (
    <VStack spacing={8} align="stretch" maxW="1200px" mx="auto" p={4}>
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="lg" color="blue.600">Voting Phase</Heading>
            <Text fontSize="lg" color="gray.600">
              Vote for the image that best represents the word. You have 1 minute to make your choice!
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="blue.500">
              Target Word: {gameState.currentWord}
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