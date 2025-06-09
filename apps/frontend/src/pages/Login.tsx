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
  useToast,
} from '@chakra-ui/react'
import { FcGoogle } from 'react-icons/fc'
import { useGoogleLogin } from '@react-oauth/google'

const Login = () => {
  const [username, setUsername] = useState('')
  const [roomId, setRoomId] = useState('')
  const navigate = useNavigate()
  const toast = useToast()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a room ID',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    // Mock login - log the username and redirect to game room
    console.log('Logging in as:', username)
    localStorage.setItem('user', username)
    localStorage.setItem('playerName', username)
    navigate(`/game/${roomId}`)
  }

  const handleGoogleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (response) => {
      try {
        console.log('Login Success:', response)
        if (!roomId.trim()) {
          toast({
            title: 'Error',
            description: 'Please enter a room ID',
            status: 'error',
            duration: 3000,
            isClosable: true,
          })
          return
        }
        navigate(`/game/${roomId}`)
      } catch (error) {
        console.error('Login Error:', error)
        toast({
          title: 'Error',
          description: 'Failed to sign in with Google',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
    },
    onError: () => {
      console.log('Login Failed')
      toast({
        title: 'Error',
        description: 'Failed to sign in with Google',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    },
  })

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8}>
        <Heading>Welcome to Promptionary</Heading>
        <Box w="100%" p={8} borderWidth={1} borderRadius="lg" bg="gray.100">
          <form onSubmit={handleLogin}>
            <VStack spacing={4}>
              <Button
                onClick={() => handleGoogleLogin()}
                variant="outline"
                width="100%"
                colorScheme="blue"
                leftIcon={<FcGoogle />}
              >
                Sign in with Google
              </Button>
              <Text>or</Text>
              <FormControl isRequired>
                <FormLabel>Guest Username</FormLabel>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your guest username"
                  bg="white"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Room ID</FormLabel>
                <Input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter the room ID"
                  bg="white"
                />
              </FormControl>
              <Button type="submit" colorScheme="blue" width="100%">
                Login
              </Button>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  )
}

export default Login 