import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  Text,
  useToast,
  Input,
  InputGroup,
  InputRightElement,
  Card,
  CardBody,
  Heading,
  HStack,
  Avatar,
  Badge,
  Flex,
  Spacer,
  IconButton,
} from '@chakra-ui/react';
import { useGame } from '../context/GameContext';
import { useNavigate } from 'react-router-dom';
import { RepeatIcon } from '@chakra-ui/icons';

export const GameLobby: React.FC = () => {
  const { gameState, currentPlayer, refreshGameState, startGame } = useGame();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshGameState();
      toast({
        title: 'Players refreshed',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error refreshing game state:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh players',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStartGame = async () => {
    if (!currentPlayer) return;
    
    setIsLoading(true);
    try {
      await startGame();
      navigate('/game/prompt');
    } catch (error) {
      toast({
        title: 'Error starting game',
        description: 'Failed to start the game. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/game/${gameState?.roomId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link copied!',
      description: 'Share this link with your friends to join the game.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  if (!gameState) return null;

  const isHost = currentPlayer?.isHost;

  return (
    <VStack spacing={8} align="stretch" maxW="800px" mx="auto" p={4}>
      {/* Share Game Section */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md">Share Game</Heading>
            <Text color="gray.600">Share this link with your friends to join the game</Text>
            <InputGroup size="md">
              <Input
                value={`${window.location.origin}/game/${gameState.roomId}`}
                isReadOnly
                fontFamily="monospace"
                bg="gray.50"
              />
              <InputRightElement width="4.5rem">
                <Button h="1.75rem" size="sm" onClick={handleCopyLink}>
                  Copy
                </Button>
              </InputRightElement>
            </InputGroup>
          </VStack>
        </CardBody>
      </Card>

      {/* Players Section */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Flex align="center">
              <Heading size="md">Players</Heading>
              <Spacer />
              <HStack spacing={4}>
                <Badge colorScheme="blue" fontSize="md" px={2} py={1} borderRadius="md">
                  {gameState.players?.length || 0} players
                </Badge>
                <IconButton
                  aria-label="Refresh players"
                  icon={<RepeatIcon />}
                  onClick={handleRefresh}
                  isLoading={isRefreshing}
                  colorScheme="blue"
                  variant="ghost"
                  size="md"
                />
              </HStack>
            </Flex>
            <VStack spacing={3} align="stretch">
              {gameState.players?.map((player) => (
                <Card key={player.id} variant="outline" _hover={{ bg: 'gray.50' }}>
                  <CardBody>
                    <HStack spacing={4}>
                      <Avatar name={player.name} size="md" />
                      <VStack align="start" spacing={0}>
                        <HStack>
                          <Text fontWeight="bold">{player.name}</Text>
                          {player.isHost && (
                            <Badge colorScheme="purple">Host</Badge>
                          )}
                        </HStack>
                        {player.email && (
                          <Text fontSize="sm" color="gray.600">
                            {player.email}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Start Game Button - Only visible to host */}
      {isHost && (
        <Button
          colorScheme="blue"
          size="lg"
          height="60px"
          fontSize="xl"
          onClick={handleStartGame}
          isLoading={isLoading}
          loadingText="Starting game..."
        >
          Start Game
        </Button>
      )}
    </VStack>
  );
}; 