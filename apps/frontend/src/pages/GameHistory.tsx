import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  Card,
  CardBody,
  Button,
  HStack,
  Badge,
  Spinner,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Select,
  FormControl,
  FormLabel,
  Divider,
  Icon,
} from '@chakra-ui/react';
import { FaTrophy, FaUsers, FaImage, FaCalendar, FaGamepad, FaFilter, FaEye, FaStar } from 'react-icons/fa';
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
  phase: string;
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
  const [gameModeFilter, setGameModeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

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
  }, [currentUser?.id, gameModeFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGameModeLabel = (gameMode: string) => {
    return gameMode === 'PROMPTOPHONE' ? 'Promptophone' : 'Prompt Anything';
  };

  // Filter games based on current filters
  const filteredGames = gameHistory.filter(game => {
    if (gameModeFilter !== 'all' && game.gameMode !== gameModeFilter) {
      return false;
    }
    // Add date filtering logic here if needed
    return true;
  });

  return (
    <Container maxW="container.xl" py={8} minH="100dvh">
      <VStack spacing={8}>
        {/* Header */}
        <VStack spacing={3} textAlign="center">
          <Heading 
            size="xl" 
            bgGradient="linear(to-r, brand.400, highlight)"
            bgClip="text"
            fontWeight="bold"
          >
            Game History
          </Heading>
          <Text color="textSecondary" fontSize="lg">
            Your games and results ({gameHistory.length} games found)
          </Text>
        </VStack>

        {/* Stats and Filters - Combined as two full-width tiles */}
        <VStack spacing={6} w="100%">
          {/* Combined Stats Card */}
          <Card
            backdropFilter="blur(10px)"
            bg="whiteAlpha.100"
            border="1px solid rgba(255,255,255,0.2)"
            borderRadius="2xl"
            boxShadow="0 8px 32px rgba(0,0,0,0.3)"
            w="100%"
          >
            <CardBody p={8}>
              <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={6} w="100%">
                <Stat textAlign="center">
                  <StatLabel color="textSecondary" fontSize="sm">Total Games</StatLabel>
                  <StatNumber color="textPrimary" fontSize="3xl" fontWeight="bold">
                    {gameHistory.length}
                  </StatNumber>
                  <StatHelpText color="textSecondary">
                    <Icon as={FaGamepad} mr={2} />
                    Games played
                  </StatHelpText>
                </Stat>
                <Stat textAlign="center">
                  <StatLabel color="textSecondary" fontSize="sm">Wins</StatLabel>
                  <StatNumber color="highlight" fontSize="3xl" fontWeight="bold">
                    {gameHistory.filter(game => game.winner.name === currentUser?.name).length}
                  </StatNumber>
                  <StatHelpText color="textSecondary">
                    <Icon as={FaTrophy} mr={2} />
                    Games won
                  </StatHelpText>
                </Stat>
                <Stat textAlign="center">
                  <StatLabel color="textSecondary" fontSize="sm">Win Rate</StatLabel>
                  <StatNumber color="brand.400" fontSize="3xl" fontWeight="bold">
                    {gameHistory.length > 0 
                      ? Math.round((gameHistory.filter(game => game.winner.name === currentUser?.name).length / gameHistory.length) * 100)
                      : 0}%
                  </StatNumber>
                  <StatHelpText color="textSecondary">
                    <Icon as={FaStar} mr={2} />
                    Success rate
                  </StatHelpText>
                </Stat>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Filters Card */}
          <Card
            backdropFilter="blur(10px)"
            bg="whiteAlpha.100"
            border="1px solid rgba(255,255,255,0.2)"
            borderRadius="2xl"
            boxShadow="0 8px 32px rgba(0,0,0,0.3)"
            w="100%"
          >
            <CardBody p={6}>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md" color="textPrimary">
                    <Icon as={FaFilter} mr={2} />
                    Filters
                  </Heading>
                  <Button
                    size="sm"
                    variant="ghost"
                    color="textSecondary"
                    onClick={() => {
                      setGameModeFilter('all');
                      setDateFilter('all');
                    }}
                  >
                    Clear All
                  </Button>
                </HStack>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel color="textSecondary" fontSize="sm">Game Mode</FormLabel>
                    <Select
                      value={gameModeFilter}
                      onChange={(e) => setGameModeFilter(e.target.value)}
                      bg="whiteAlpha.200"
                      borderColor="whiteAlpha.300"
                      color="textPrimary"
                      _focus={{
                        borderColor: 'brand.400',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
                      }}
                    >
                      <option value="all">All Modes</option>
                      <option value="PROMPT_ANYTHING">Prompt Anything</option>
                      <option value="PROMPTOPHONE">Promptophone</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel color="textSecondary" fontSize="sm">Date Range</FormLabel>
                    <Select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      bg="whiteAlpha.200"
                      borderColor="whiteAlpha.300"
                      color="textPrimary"
                      _focus={{
                        borderColor: 'brand.400',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
                      }}
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>
        </VStack>

        {/* Game List */}
        <Box w="100%">
          {isLoading ? (
            <Card
              backdropFilter="blur(10px)"
              bg="whiteAlpha.100"
              border="1px solid rgba(255,255,255,0.2)"
              borderRadius="2xl"
              boxShadow="0 8px 32px rgba(0,0,0,0.3)"
            >
              <CardBody p={8}>
                <VStack spacing={4}>
                  <Spinner size="xl" color="brand.500" thickness="4px" />
                  <Text color="textSecondary">Loading your game history...</Text>
                </VStack>
              </CardBody>
            </Card>
          ) : filteredGames.length === 0 ? (
            <Card
              backdropFilter="blur(10px)"
              bg="whiteAlpha.100"
              border="1px solid rgba(255,255,255,0.2)"
              borderRadius="2xl"
              boxShadow="0 8px 32px rgba(0,0,0,0.3)"
            >
              <CardBody p={8}>
                <VStack spacing={4}>
                  <Icon as={FaGamepad} boxSize={12} color="textSecondary" />
                  <Text fontSize="lg" color="textSecondary">
                    No games found with current filters
                  </Text>
                  <Text color="textSecondary">
                    Try adjusting your filters or start some games
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          ) : (
            <VStack spacing={4} align="stretch">
              {filteredGames.map((game) => (
                <Card
                  key={game.id}
                  backdropFilter="blur(10px)"
                  bg="whiteAlpha.100"
                  border="1px solid rgba(255,255,255,0.2)"
                  borderRadius="2xl"
                  boxShadow="0 8px 32px rgba(0,0,0,0.3)"
                  cursor="pointer"
                  onClick={() => {
                    setSelectedGame(game);
                    onOpen();
                  }}
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                    borderColor: 'rgba(255,255,255,0.3)',
                  }}
                  transition="all 0.3s ease"
                >
                  <CardBody p={6}>
                    <HStack justify="space-between" align="start">
                      <VStack align="start" spacing={3} flex={1}>
                        <HStack spacing={3}>
                          <Badge
                            bgGradient="linear(to-r, brand.400, brand.500)"
                            color="white"
                            px={3}
                            py={1}
                            borderRadius="full"
                            fontSize="sm"
                          >
                            {getGameModeLabel(game.gameMode)}
                          </Badge>
                          {game.winner.name === currentUser?.name && (
                            <Badge
                              bgGradient="linear(to-r, highlight, orange.400)"
                              color="white"
                              px={3}
                              py={1}
                              borderRadius="full"
                              fontSize="sm"
                            >
                              <Icon as={FaTrophy} mr={1} />
                              Winner
                            </Badge>
                          )}
                        </HStack>
                        
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Icon as={FaCalendar} color="textSecondary" />
                            <Text color="textSecondary" fontSize="sm">
                              {formatDate(game.createdAt)}
                            </Text>
                          </HStack>
                          <HStack>
                            <Icon as={FaUsers} color="textSecondary" />
                            <Text color="textSecondary" fontSize="sm">
                              {game.playerCount} players
                            </Text>
                          </HStack>
                          <HStack>
                            <Icon as={FaImage} color="textSecondary" />
                            <Text color="textSecondary" fontSize="sm">
                              {game.totalImages} images
                            </Text>
                          </HStack>
                        </VStack>
                      </VStack>
                      
                      <VStack align="end" spacing={2}>
                        <Text fontSize="sm" color="textSecondary">
                          Room: {game.roomId}
                        </Text>
                        <Button
                          size="sm"
                          variant="ghost"
                          color="brand.400"
                          _hover={{ bg: 'whiteAlpha.200' }}
                          leftIcon={<FaEye />}
                        >
                          View Details
                        </Button>
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          )}
        </Box>
      </VStack>

      {/* Game Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.300" />
        <ModalContent
          backdropFilter="blur(10px)"
          bg="whiteAlpha.200"
          border="1px solid rgba(255,255,255,0.2)"
          borderRadius="2xl"
          boxShadow="0 8px 32px rgba(0,0,0,0.3)"
        >
          <ModalHeader color="textPrimary">Game Details</ModalHeader>
          <ModalCloseButton color="textPrimary" />
          <ModalBody pb={6}>
            {selectedGame && (
              <VStack spacing={6} align="stretch">
                <Card
                  bg="whiteAlpha.100"
                  border="1px solid rgba(255,255,255,0.2)"
                  borderRadius="xl"
                >
                  <CardBody p={6}>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold" color="textPrimary">
                            {getGameModeLabel(selectedGame.gameMode)}
                          </Text>
                          <Text fontSize="sm" color="textSecondary">
                            {formatDate(selectedGame.createdAt)}
                          </Text>
                        </VStack>
                        {selectedGame.winner && (
                          <Badge
                            bgGradient="linear(to-r, highlight, orange.400)"
                            color="white"
                            px={3}
                            py={1}
                            borderRadius="full"
                            fontSize="sm"
                          >
                            <Icon as={FaTrophy} mr={1} />
                            Winner: {selectedGame.winner.name}
                          </Badge>
                        )}
                      </HStack>
                      
                      <Divider borderColor="whiteAlpha.300" />
                      
                      <VStack spacing={3} align="stretch">
                        <Text fontWeight="bold" color="textPrimary">
                          Players ({selectedGame.playerCount})
                        </Text>
                        <SimpleGrid columns={2} spacing={3}>
                          {selectedGame.fullGameData.playerGames?.map((playerGame) => (
                            <HStack key={playerGame.id} p={3} bg="whiteAlpha.100" borderRadius="md">
                              <Text color="textPrimary" fontSize="sm">
                                {playerGame.player.name}
                              </Text>
                              {playerGame.player.email && (
                                <Text color="textSecondary" fontSize="xs">
                                  {playerGame.player.email}
                                </Text>
                              )}
                            </HStack>
                          )) || (
                            <HStack p={3} bg="whiteAlpha.100" borderRadius="md">
                              <Text color="textSecondary" fontSize="sm">
                                No player data available
                              </Text>
                            </HStack>
                          )}
                        </SimpleGrid>
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default GameHistory; 