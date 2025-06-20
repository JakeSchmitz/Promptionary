import React, { useEffect } from 'react';
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
  Center,
} from '@chakra-ui/react';
import { useGame } from '../context/GameContext';
import { useParams } from 'react-router-dom';

export const ResultsPhase: React.FC = () => {
  const { gameState, currentPlayer, startNewRound } = useGame();
  const { roomId } = useParams<{ roomId: string }>();
  const toast = useToast();

  const handleNextRound = async () => {
    if (!currentPlayer?.isHost) return;

    try {
      await startNewRound();
    } catch (error) {
      console.error('Error starting next round:', error);
      toast({
        title: 'Error',
        description: 'Failed to start next round',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!gameState) return null;

  const isLastRound = gameState.currentRound >= gameState.maxRounds;
  const isHost = currentPlayer?.isHost;

  return (
    <VStack spacing={8} align="stretch" maxW="1200px" mx="auto" p={4}>
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="lg" color="brand.600">Results Phase</Heading>
            <Text fontSize="lg" color="textSecondary">
              {isLastRound 
                ? 'This was the final round! The game is complete.'
                : 'Here are the results for this round!'
              }
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="brand.500">
              Target Word: {gameState.currentWord}
            </Text>
          </VStack>
        </CardBody>
      </Card>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {gameState.images?.map((image) => (
          <Card key={image.id}>
            <CardBody>
              <VStack spacing={4}>
                <Image
                  src={image.url.startsWith('placeholder-') ? '' : image.url}
                  alt="Generated image"
                  borderRadius="md"
                  objectFit="cover"
                  w="100%"
                  h="300px"
                  fallback={
                    <Center h="300px" bg="gray.100">
                      <Text color="gray.500">Image not available</Text>
                    </Center>
                  }
                />
                <Box w="100%">
                  <Text fontSize="lg" fontWeight="bold">
                    Votes: {image.votes.length}
                  </Text>
                  <Text color="textSecondary">
                    Prompt: {image.prompt}
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {isHost && !isLastRound && (
        <Center>
          <Button
            colorScheme="blue"
            size="lg"
            onClick={handleNextRound}
          >
            Start Next Round
          </Button>
        </Center>
      )}

      {isLastRound && (
        <Card>
          <CardBody>
            <VStack spacing={4}>
              <Heading size="md">Final Scores</Heading>
              {gameState.players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <Box
                    key={player.id}
                    w="100%"
                    p={4}
                    bg={index === 0 ? 'yellow.50' : 'white'}
                    borderRadius="md"
                    borderWidth={1}
                    borderColor={index === 0 ? 'yellow.200' : 'gray.200'}
                  >
                    <Text fontSize="lg" fontWeight="bold">
                      {index + 1}. {player.name} - {player.score} points
                    </Text>
                  </Box>
                ))}
            </VStack>
          </CardBody>
        </Card>
      )}

      <Text color="textSecondary">
        {isLastRound ? 'Game Complete!' : 'Round Complete!'}
      </Text>
    </VStack>
  );
}; 