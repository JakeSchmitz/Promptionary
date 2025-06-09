import React from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'

const GameHistory = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8}>
        <Heading>Game History</Heading>
        <Box
          w="100%"
          p={6}
          bg={bgColor}
          borderWidth={1}
          borderColor={borderColor}
          borderRadius="lg"
          shadow="sm"
        >
          <Text>Your game history will appear here.</Text>
        </Box>
      </VStack>
    </Container>
  )
}

export default GameHistory 