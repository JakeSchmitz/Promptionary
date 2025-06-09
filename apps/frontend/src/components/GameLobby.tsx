import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Grid,
  useToast,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Avatar,
  Tag,
} from '@chakra-ui/react'
import { CopyIcon, RepeatIcon } from '@chakra-ui/icons'
import { useGame } from '../context/GameContext'

interface GameLobbyProps {
  roomId: string
  onStartGame: () => void
}

const GameLobby: React.FC<GameLobbyProps> = ({ roomId, onStartGame }) => {
  const toast = useToast()
  const { gameState, currentPlayer, refreshGameState } = useGame()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const shareUrl = `${window.location.origin}/game/${roomId}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: 'Link copied!',
        description: 'Share this link with your friends to join the game',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshGameState()
      toast({
        title: 'Players refreshed',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to refresh players',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(handleRefresh, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <VStack spacing={8} align="stretch">
      {/* Share Link */}
      <Box
        p={6}
        bg="white"
        borderRadius="xl"
        borderWidth={1}
        borderColor="gray.200"
        boxShadow="sm"
      >
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <Heading size="md">Share Game</Heading>
              <Text color="gray.500" fontSize="sm">
                Share this link with friends to join your game
              </Text>
            </VStack>
            <IconButton
              aria-label="Copy link"
              icon={<CopyIcon />}
              onClick={handleCopyLink}
              colorScheme="blue"
              variant="ghost"
              size="lg"
            />
          </HStack>
          <Box
            p={3}
            bg="gray.50"
            borderRadius="md"
            borderWidth={1}
            borderColor="gray.200"
          >
            <Text
              fontFamily="mono"
              fontSize="sm"
              color="gray.600"
              wordBreak="break-all"
            >
              {shareUrl}
            </Text>
          </Box>
        </VStack>
      </Box>

      {/* Player List */}
      <Box
        p={6}
        bg="white"
        borderRadius="xl"
        borderWidth={1}
        borderColor="gray.200"
        boxShadow="sm"
      >
        <HStack justify="space-between" mb={4}>
          <VStack align="start" spacing={1}>
            <Heading size="md">Players</Heading>
            <Text color="gray.500" fontSize="sm">
              {gameState?.players?.length || 0} player{gameState?.players?.length !== 1 ? 's' : ''} in the game
            </Text>
          </VStack>
          <IconButton
            aria-label="Refresh players"
            icon={<RepeatIcon />}
            onClick={handleRefresh}
            isLoading={isRefreshing}
            colorScheme="blue"
            variant="ghost"
            size="lg"
          />
        </HStack>
        <Grid
          templateColumns="repeat(auto-fit, minmax(250px, 1fr))"
          gap={4}
          w="100%"
        >
          {gameState?.players?.map((player) => (
            <HStack
              key={player.id}
              p={4}
              bg={player.id === currentPlayer?.id ? 'blue.50' : 'gray.50'}
              borderRadius="lg"
              borderWidth={1}
              borderColor={player.id === currentPlayer?.id ? 'blue.200' : 'gray.200'}
              justify="space-between"
              minW={0}
              transition="all 0.2s"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'md',
              }}
            >
              <HStack spacing={3} minW={0} flex={1}>
                <Avatar
                  size="md"
                  name={player.name}
                  src={player.avatar}
                  bg={player.id === currentPlayer?.id ? 'blue.500' : 'gray.500'}
                  flexShrink={0}
                />
                <VStack align="start" spacing={0} minW={0} flex={1}>
                  <Text fontWeight="medium" noOfLines={1} w="100%">
                    {player.name}
                  </Text>
                  {player.email && (
                    <Text fontSize="sm" color="gray.500" noOfLines={1} w="100%">
                      {player.email}
                    </Text>
                  )}
                </VStack>
              </HStack>
              {player.id === currentPlayer?.id && (
                <Tag size="sm" colorScheme="blue" variant="subtle" flexShrink={0} ml={2}>
                  You
                </Tag>
              )}
            </HStack>
          ))}
        </Grid>
      </Box>

      {/* Start Game Button */}
      <Button
        colorScheme="green"
        size="lg"
        height="60px"
        fontSize="lg"
        onClick={onStartGame}
        isDisabled={!gameState?.players?.length || gameState.players.length < 2}
        boxShadow="md"
        _hover={{
          transform: 'translateY(-2px)',
          boxShadow: 'lg',
        }}
        transition="all 0.2s"
      >
        Start Game
      </Button>
      {gameState?.players?.length < 2 && (
        <Text color="red.500" textAlign="center" fontSize="sm">
          Need at least 2 players to start the game
        </Text>
      )}
    </VStack>
  )
}

export default GameLobby 