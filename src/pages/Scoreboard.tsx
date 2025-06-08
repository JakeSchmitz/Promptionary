import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react'

// Mock game data
const mockGameData = {
  id: '1',
  date: '2024-03-20',
  players: [
    { name: 'Alice', score: 3 },
    { name: 'Bob', score: 2 },
    { name: 'Charlie', score: 1 },
  ],
  rounds: [
    { word: 'Elephant', winner: 'Alice' },
    { word: 'Pizza', winner: 'Bob' },
    { word: 'Beach', winner: 'Alice' },
  ],
}

const Scoreboard = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()

  const winner = mockGameData.players.reduce((prev, current) =>
    current.score > prev.score ? current : prev
  )

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8}>
        <Heading>Game Results</Heading>
        
        <Box w="100%" p={6} borderWidth={1} borderRadius="lg">
          <VStack spacing={6}>
            <Box textAlign="center">
              <Heading size="lg" color="green.500">
                Winner: {winner.name}!
              </Heading>
              <Text fontSize="lg" mt={2}>
                Final Score: {winner.score}
              </Text>
            </Box>

            <Box w="100%">
              <Heading size="md" mb={4}>Final Scores</Heading>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Player</Th>
                    <Th isNumeric>Score</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {mockGameData.players.map((player) => (
                    <Tr key={player.name}>
                      <Td>{player.name}</Td>
                      <Td isNumeric>{player.score}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>

            <Box w="100%">
              <Heading size="md" mb={4}>Round History</Heading>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Round</Th>
                    <Th>Word</Th>
                    <Th>Winner</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {mockGameData.rounds.map((round, index) => (
                    <Tr key={index}>
                      <Td>{index + 1}</Td>
                      <Td>{round.word}</Td>
                      <Td>{round.winner}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>

            <Button
              colorScheme="blue"
              onClick={() => navigate('/dashboard')}
              width="100%"
            >
              Return to Dashboard
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}

export default Scoreboard 