import React, { useState } from 'react';
import {
  VStack,
  Text,
  useToast,
  Card,
  CardBody,
  Heading,
  Button,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Avatar,
  Badge,
  Icon,
  Spinner,
  Divider,
} from '@chakra-ui/react';
import { FaCopy, FaUsers, FaPlay, FaShare } from 'react-icons/fa';
import { useGame } from '../context/GameContext';
import { useParams } from 'react-router-dom';

const GameLobby = () => {
  const { gameState, currentPlayer, startGame } = useGame();
  const { roomId } = useParams<{ roomId: string }>();
  const toast = useToast();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartGame = async () => {
    if (!currentPlayer?.isHost) return;

    try {
      setIsStarting(true);
      await startGame();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error starting game:', error);
      toast({
        title: 'Error',
        description: 'Failed to start game',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleCopyLink = () => {
    const gameUrl = `${window.location.origin}/game/${roomId}`;
    navigator.clipboard.writeText(gameUrl);
    toast({
      title: 'Link Copied',
      description: 'Game link copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  if (!gameState) return null;

  const isHost = currentPlayer?.isHost;
  const canStart = isHost && gameState.players.length >= 2;

  return (
    <VStack spacing={8} align="stretch" maxW="1200px" mx="auto" p={4}>
      {/* Game Info */}
      <Card
        backdropFilter="blur(10px)"
        borderRadius="2xl"
        boxShadow="0 8px 32px rgba(0,0,0,0.3)"
      >
        <CardBody p={8}>
          <VStack spacing={6} align="stretch">
            <VStack spacing={3} textAlign="center">
              <Heading 
                size="xl" 
                bgGradient="linear(to-r, brand.400, highlight)"
                bgClip="text"
                fontWeight="bold"
              >
                Game Lobby
              </Heading>
              <Text color="textSecondary" fontSize="lg">
                Waiting for players to join...
              </Text>
            </VStack>

            {/* Share Section */}
            <Card
              borderRadius="xl"
              overflow="hidden"
            >
              <CardBody p={6}>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Heading size="md" color="textPrimary">
                      <Icon as={FaShare} mr={2} />
                      Share Game
                    </Heading>
                  </HStack>
                  <Text color="textSecondary">
                    Share this link with your friends to join the game
                  </Text>
                  <InputGroup size="lg">
                    <Input
                      value={`${window.location.origin}/game/${roomId}`}
                      isReadOnly
                      borderRadius="xl"
                    />
                    <InputRightElement>
                      <Button
                        size="sm"
                        variant="ghost"
                        color="brand.400"
                        onClick={handleCopyLink}
                        _hover={{ bg: 'whiteAlpha.200' }}
                        borderRadius="xl"
                        mr={2}
                      >
                        <Icon as={FaCopy} />
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </VStack>
              </CardBody>
            </Card>
            <Divider my={4} />
            {/* Players Section */}
            <Card
              borderRadius="xl"
              overflow="hidden"
            >
              <CardBody p={6}>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Heading size="md" color="textPrimary">
                      <Icon as={FaUsers} mr={2} />
                      Players ({gameState.players.length})
                    </Heading>
                    <Badge
                      bgGradient="linear(to-r, brand.400, brand.500)"
                      color="white"
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="sm"
                    >
                      {gameState.players.length >= 2 ? 'Ready' : 'Waiting'}
                    </Badge>
                  </HStack>
                  
                  <VStack spacing={3} align="stretch">
                    {gameState.players.map((player) => (
                      <HStack
                        key={player.id}
                        p={4}
                        borderRadius="xl"
                        justify="space-between"
                      >
                        <HStack spacing={3}>
                          <Avatar
                            size="md"
                            name={player.name}
                            bgGradient="linear(to-r, brand.400, brand.500)"
                            color="white"
                          />
                          <VStack align="start" spacing={1}>
                            <HStack>
                              <Text fontWeight="bold" color="textPrimary">
                                {player.name}
                              </Text>
                              {player.isHost && (
                                <Badge
                                  bgGradient="linear(to-r, highlight, orange.400)"
                                  color="white"
                                  px={2}
                                  py={0.5}
                                  borderRadius="full"
                                  fontSize="xs"
                                >
                                  Host
                                </Badge>
                              )}
                            </HStack>
                            {player.email && (
                              <Text fontSize="sm" color="textSecondary">
                                {player.email}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
            <Divider my={4} />
            {/* Start Game Button */}
            {isHost && (
              <VStack spacing={4}>
                <Button
                  bgGradient="linear(to-r, brand.400, brand.500)"
                  color="white"
                  fontWeight="bold"
                  _hover={{ 
                    opacity: 0.9,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(16, 163, 127, 0.3)',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                  _disabled={{
                    opacity: 0.5,
                    cursor: 'not-allowed',
                    transform: 'none',
                  }}
                  borderRadius="xl"
                  px={8}
                  py={4}
                  size="lg"
                  onClick={handleStartGame}
                  isLoading={isStarting}
                  loadingText="Starting Game..."
                  disabled={!canStart}
                  leftIcon={<FaPlay />}
                  transition="all 0.2s"
                  w={{ base: '100%', md: 'auto' }}
                >
                  Start Game
                </Button>
                {!canStart && (
                  <Text color="textSecondary" fontSize="sm" textAlign="center">
                    Need at least 2 players to start
                  </Text>
                )}
              </VStack>
            )}

            {!isHost && (
              <VStack spacing={4}>
                <Text color="textSecondary" fontSize="lg" textAlign="center">
                  Waiting for host to start the game...
                </Text>
                <Spinner size="lg" color="brand.500" thickness="4px" />
              </VStack>
            )}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default GameLobby; 