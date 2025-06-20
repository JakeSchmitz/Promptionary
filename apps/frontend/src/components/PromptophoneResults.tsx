import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Image,
  Card,
  CardBody,
  Divider,
  Badge,
  HStack,
} from '@chakra-ui/react';
import { useGame } from '../context/GameContext';

export const PromptophoneResults: React.FC = () => {
  const { gameState } = useGame();

  if (!gameState || !gameState.promptChains) return null;

  return (
    <VStack spacing={8} align="stretch" maxW="1200px" mx="auto" p={4}>
      <Heading size="lg">Game Results</Heading>
      <Text color="textSecondary">
        Here's how each word evolved through the game:
      </Text>

      {gameState.promptChains.map((chain, index) => (
        <Card key={chain.id}>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Box>
                <Badge colorScheme="purple" fontSize="md" mb={2}>
                  Original Word
                </Badge>
                <Heading size="md">{chain.originalWord}</Heading>
              </Box>

              <Divider />

              {chain.chain.map((step, stepIndex) => {
                const player = gameState.players.find(p => p.id === step.playerId);
                return (
                  <Box key={stepIndex}>
                    <VStack spacing={4} align="stretch">
                      <HStack>
                        <Badge colorScheme="blue">Round {stepIndex + 1}</Badge>
                        <Text fontWeight="bold">{player?.name}</Text>
                      </HStack>
                      <Text color="textSecondary">{step.prompt}</Text>
                      <Image
                        src={step.imageUrl}
                        alt={`Generated image for round ${stepIndex + 1}`}
                        borderRadius="md"
                        maxH="300px"
                        objectFit="contain"
                      />
                    </VStack>
                    {stepIndex < chain.chain.length - 1 && <Divider mt={6} />}
                  </Box>
                );
              })}
            </VStack>
          </CardBody>
        </Card>
      ))}
    </VStack>
  );
}; 