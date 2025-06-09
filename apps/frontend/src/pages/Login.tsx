import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  Divider,
} from '@chakra-ui/react'
import { FcGoogle } from 'react-icons/fc'
import { useGoogleLogin } from '@react-oauth/google'

const Login = () => {
  const [username, setUsername] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  // Extract roomId from URL if present
  const roomId = location.pathname.split('/game/')[1]

  useEffect(() => {
    // If user is already logged in, redirect to game room
    const user = localStorage.getItem('user')
    if (user && roomId) {
      navigate(`/game/${roomId}`)
    }
  }, [navigate, roomId])

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a username',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      // Store user info
      localStorage.setItem('user', username)
      localStorage.setItem('playerName', username)

      // If joining a game, add player to the game
      if (roomId) {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/games/${roomId}/players`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: username }),
        })

        if (!response.ok) {
          throw new Error('Failed to join game')
        }

        toast({
          title: 'Success',
          description: 'Successfully joined the game',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })

        navigate(`/game/${roomId}`)
      } else {
        // If no roomId, go to dashboard
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Login Error:', error)
      toast({
        title: 'Error',
        description: 'Failed to join game',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleGoogleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (response) => {
      try {
        // Store the access token
        localStorage.setItem('googleAccessToken', response.access_token)
        
        // Get user info from Google
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${response.access_token}` },
        }).then(res => res.json())
        
        // Store user info
        localStorage.setItem('user', userInfo.email)
        localStorage.setItem('playerName', userInfo.name)
        
        // If joining a game, add player to the game
        if (roomId) {
          const gameResponse = await fetch(`${import.meta.env.VITE_API_URL}/games/${roomId}/players`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: userInfo.name }),
          })

          if (!gameResponse.ok) {
            throw new Error('Failed to join game')
          }

          toast({
            title: 'Success',
            description: 'Successfully joined the game',
            status: 'success',
            duration: 3000,
            isClosable: true,
          })

          navigate(`/game/${roomId}`)
        } else {
          // If no roomId, go to dashboard
          navigate('/dashboard')
        }
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
        {roomId && (
          <Text color="blue.500" fontSize="lg">
            Joining Game Room: {roomId}
          </Text>
        )}
        <Box w="100%" p={8} borderWidth={1} borderRadius="lg" bg="gray.50">
          <VStack spacing={6}>
            <Button
              onClick={() => handleGoogleLogin()}
              variant="outline"
              width="100%"
              colorScheme="blue"
              leftIcon={<FcGoogle />}
              size="lg"
            >
              Sign in with Google
            </Button>

            <Divider />

            <form onSubmit={handleGuestLogin} style={{ width: '100%' }}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Play as Guest</FormLabel>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your name"
                    bg="white"
                    size="lg"
                  />
                </FormControl>
                <Button type="submit" colorScheme="blue" width="100%" size="lg">
                  {roomId ? 'Join Game' : 'Continue as Guest'}
                </Button>
              </VStack>
            </form>
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}

export default Login 