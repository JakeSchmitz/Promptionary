import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Button,
  HStack,
  Badge,
  Image,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Alert,
  AlertIcon,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Select,
  FormControl,
  FormLabel,
  Stack,
  Divider,
} from '@chakra-ui/react';
import { FaTrophy, FaUsers, FaImage, FaCalendar, FaGamepad, FaFilter } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { getGameHistory } from '../utils/api';

interface GameHistoryItem {
  id: string;
  roomId: string;
  gameMode: 'PROMPT_ANYTHING' | 'PROMPTOPHONE';
  createdAt: string;
  updatedAt: string;
  playerCount: number;
  playerScore: number;
  playerName: string;
  winner: {
    name: string;
    score: number;
    playerId: string;
  };
  totalImages: number;
  hasPromptChains: boolean;
  status: 'Complete' | 'In Progress';
  phase: string; // Add phase for debugging
  fullGameData: {
    playerGames: Array<{
      id: string;
      playerId: string;
      gameId: string;
      isHost: boolean;
      score: number;
      player: {
        id: string;
        name: string;
        email: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>;
    images: Array<{
      id: string;
      url: string;
      prompt: string;
      playerId: string;
      player: {
        name: string;
      };
      votes: Array<{
        id: string;
        voterId: string;
      }>;
    }>;
    promptChains: Array<{
      id: string;
      originalWord: string;
      chain: Array<{
        playerId: string;
        prompt: string;
        imageUrl: string;
      }>;
    }>;
    currentRound: number;
    maxRounds: number;
    currentWord: string;
    exclusionWords: string[];
  };
}

const GameHistory = () => {
  const { currentUser } = useAuth();
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameHistoryItem | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gameModeFilter, setGameModeFilter] = useState<string>('all');

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  const fetchGameHistory = async () => {
    if (!currentUser?.id) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (gameModeFilter !== 'all') {
        params.append('gameMode', gameModeFilter);
      }
      
      const queryString = params.toString();
      const url = queryString ? `${currentUser.id}?${queryString}` : currentUser.id;
      
      const history = await getGameHistory(url);
      console.log('Fetched game history:', history);
      setGameHistory(history);
    } catch (err) {
      console.error('Error fetching game history:', err);
      setError('Failed to load game history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGameHistory();
  }, [currentUser?.id, statusFilter, gameModeFilter]);

  const handleViewGameDetails = (game: GameHistoryItem) => {
    setSelectedGame(game);
    onOpen();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGameModeIcon = (gameMode: string) => {
    return gameMode === 'PROMPTOPHONE' ? '🎤' : '🎨';
  };

  const getGameModeLabel = (gameMode: string) => {
    return gameMode === 'PROMPTOPHONE' ? 'Promptophone' : 'Prompt Anything';
  };

  const getStatusColor = (status: string, phase: string) => {
    if (status === 'Complete') return 'green';
    if (phase === 'LOBBY') return 'blue';
    if (phase === 'PROMPT') return 'orange';
    if (phase === 'VOTING') return 'purple';
    if (phase === 'RESULTS') return 'yellow';
    return 'gray';
  };

  if (isLoading) {
    return (
      <Container maxW="container.lg" py={10}>
        <VStack spacing={8}>
          <Heading>Game History</Heading>
          <Box display="flex" justifyContent="center" alignItems="center" minH="200px">
            <Spinner size="xl" />
          </Box>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.lg" py={10}>
        <VStack spacing={8}>
          <Heading>Game History</Heading>
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg">Game History</Heading>
          <Text mt={2} color="gray.600">
            Your games and results ({gameHistory.length} games found)
          </Text>
        </Box>

        {/* Filters */}
        <Card>
          <CardHeader>
            <HStack spacing={4} align="center">
              <FaFilter />
              <Heading size="md">Filters</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Games</option>
                  <option value="complete">Completed Only</option>
                  <option value="in-progress">In Progress Only</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Game Mode</FormLabel>
                <Select 
                  value={gameModeFilter} 
                  onChange={(e) => setGameModeFilter(e.target.value)}
                >
                  <option value="all">All Modes</option>
                  <option value="PROMPT_ANYTHING">Prompt Anything</option>
                  <option value="PROMPTOPHONE">Promptophone</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>&nbsp;</FormLabel>
                <Button 
                  onClick={fetchGameHistory}
                  colorScheme="blue"
                  leftIcon={<FaFilter />}
                >
                  Refresh
                </Button>
              </FormControl>
            </Stack>
          </CardBody>
        </Card>

        {gameHistory.length === 0 ? (
          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Text fontSize="lg" color="gray.500">
                  No games found with current filters
                </Text>
                <Text color="gray.400">
                  Try adjusting your filters or start some games
                </Text>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <Accordion allowMultiple>
            {gameHistory.map((game, index) => (
              <AccordionItem key={game.id}>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <HStack spacing={4} align="center">
                      <Badge colorScheme={getStatusColor(game.status, game.phase)}>
                        {game.status === 'Complete'
                          ? (game.winner.name === game.playerName ? '🏆 Won' : 'Lost')
                          : `${game.phase}`}
                      </Badge>
                      <Text fontWeight="bold">
                        {getGameModeIcon(game.gameMode)} {getGameModeLabel(game.gameMode)}
                      </Text>
                      <Text color="gray.600">
                        {formatDate(game.createdAt)}
                      </Text>
                      <HStack spacing={2}>
                        <FaUsers />
                        <Text fontSize="sm">{game.playerCount} players</Text>
                      </HStack>
                      <HStack spacing={2}>
                        <FaImage />
                        <Text fontSize="sm">{game.totalImages} images</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.500">
                        Room: {game.roomId}
                      </Text>
                    </HStack>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={4} align="stretch">
                    {/* Game Summary */}
                    <Card bg={cardBg}>
                      <CardBody>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                          <Stat>
                            <StatLabel>Your Score</StatLabel>
                            <StatNumber>{game.playerScore}</StatNumber>
                            <StatHelpText>
                              {game.status === 'Complete' 
                                ? (game.winner.name === game.playerName ? 'Winner!' : `Winner: ${game.winner.name} (${game.winner.score})`)
                                : 'Game in progress'
                              }
                            </StatHelpText>
                          </Stat>
                          <Stat>
                            <StatLabel>Game Mode</StatLabel>
                            <StatNumber>{getGameModeLabel(game.gameMode)}</StatNumber>
                            <StatHelpText>
                              {game.hasPromptChains ? 'With prompt chains' : 'Standard mode'}
                            </StatHelpText>
                          </Stat>
                          <Stat>
                            <StatLabel>Duration</StatLabel>
                            <StatNumber>
                              {Math.ceil((new Date(game.updatedAt).getTime() - new Date(game.createdAt).getTime()) / (1000 * 60))} min
                            </StatNumber>
                            <StatHelpText>
                              {formatDate(game.createdAt)}
                            </StatHelpText>
                          </Stat>
                        </SimpleGrid>
                      </CardBody>
                    </Card>

                    {/* Game Details */}
                    <Card bg={cardBg}>
                      <CardHeader>
                        <Heading size="md">Game Details</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={3} align="stretch">
                          <HStack justify="space-between">
                            <Text fontWeight="bold">Status:</Text>
                            <Badge colorScheme={getStatusColor(game.status, game.phase)}>
                              {game.status} ({game.phase})
                            </Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontWeight="bold">Room ID:</Text>
                            <Text fontFamily="mono">{game.roomId}</Text>
                          </HStack>
                          {game.fullGameData.currentRound && (
                            <HStack justify="space-between">
                              <Text fontWeight="bold">Current Round:</Text>
                              <Text>{game.fullGameData.currentRound} / {game.fullGameData.maxRounds}</Text>
                            </HStack>
                          )}
                          {game.fullGameData.currentWord && (
                            <HStack justify="space-between">
                              <Text fontWeight="bold">Current Word:</Text>
                              <Text>{game.fullGameData.currentWord}</Text>
                            </HStack>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* Final Scores */}
                    <Card bg={cardBg}>
                      <CardHeader>
                        <Heading size="md">Player Scores</Heading>
                      </CardHeader>
                      <CardBody>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Player</Th>
                              <Th>Score</Th>
                              <Th>Status</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {game.fullGameData.playerGames?.map((playerGame) => (
                              <Tr key={playerGame.id}>
                                <Td>
                                  <HStack>
                                    <Text>{playerGame.player.name}</Text>
                                    {playerGame.isHost && <Badge size="sm">Host</Badge>}
                                  </HStack>
                                </Td>
                                <Td>{playerGame.score}</Td>
                                <Td>
                                  {game.status === 'Complete' ? (
                                    playerGame.playerId === game.winner.playerId ? (
                                      <Badge colorScheme="green">Winner</Badge>
                                    ) : (
                                      <Badge colorScheme="gray">Runner-up</Badge>
                                    )
                                  ) : (
                                    <Badge colorScheme="yellow">Playing</Badge>
                                  )}
                                </Td>
                              </Tr>
                            )) || (
                              <Tr>
                                <Td colSpan={3}>
                                  <Text color="gray.500" textAlign="center">
                                    No player data available
                                  </Text>
                                </Td>
                              </Tr>
                            )}
                          </Tbody>
                        </Table>
                      </CardBody>
                    </Card>

                    {/* Action Buttons */}
                    <HStack justify="center" spacing={4}>
                      <Button
                        colorScheme="blue"
                        onClick={() => handleViewGameDetails(game)}
                        leftIcon={<FaGamepad />}
                      >
                        View Details
                      </Button>
                    </HStack>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {/* Game Details Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {selectedGame && (
                <VStack align="stretch" spacing={2}>
                  <Text>Game Details</Text>
                  <Text fontSize="sm" color="gray.600">
                    {getGameModeLabel(selectedGame.gameMode)} • {formatDate(selectedGame.createdAt)}
                  </Text>
                </VStack>
              )}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedGame && (
                <VStack spacing={4} align="stretch">
                  <Text>
                    <strong>Room ID:</strong> {selectedGame.roomId}
                  </Text>
                  <Text>
                    <strong>Status:</strong> {selectedGame.status} ({selectedGame.phase})
                  </Text>
                  {selectedGame.status === 'Complete' && (
                    <Text>
                      <strong>Winner:</strong> {selectedGame.winner.name} ({selectedGame.winner.score} points)
                    </Text>
                  )}
                  <Text>
                    <strong>Your Score:</strong> {selectedGame.playerScore} points
                  </Text>
                  <Text>
                    <strong>Total Images:</strong> {selectedGame.totalImages}
                  </Text>
                  {selectedGame.fullGameData.currentWord && (
                    <Text>
                      <strong>Current Word:</strong> {selectedGame.fullGameData.currentWord}
                    </Text>
                  )}
                  {selectedGame.fullGameData.currentRound && (
                    <Text>
                      <strong>Round:</strong> {selectedGame.fullGameData.currentRound} / {selectedGame.fullGameData.maxRounds}
                    </Text>
                  )}
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
};

export default GameHistory; 