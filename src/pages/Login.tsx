import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Container,
} from '@chakra-ui/react'

const Login = () => {
  const [username, setUsername] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock login - log the username and redirect to dashboard
    console.log('Logging in as:', username)
    localStorage.setItem('user', username)
    navigate('/dashboard')
  }

  const handleGuestLogin = () => {
    console.log('Logging in as Guest')
    localStorage.setItem('user', 'Guest')
    navigate('/dashboard')
  }

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8}>
        <Heading>Welcome to Promptionary</Heading>
        <Box w="100%" p={8} borderWidth={1} borderRadius="lg">
          <form onSubmit={handleLogin}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                />
              </FormControl>
              <Button type="submit" colorScheme="blue" width="100%">
                Login
              </Button>
              <Text>or</Text>
              <Button
                onClick={handleGuestLogin}
                variant="outline"
                width="100%"
              >
                Continue as Guest
              </Button>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  )
}

export default Login 