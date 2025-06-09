import React, { useState } from 'react'
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
  Card,
  CardBody,
  HStack,
} from '@chakra-ui/react'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '../context/AuthContext'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'

interface GoogleUserInfo {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

const Login = () => {
  const [guestName, setGuestName] = useState('')
  const { login, setGuestName: setGuest } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  // Get return path from URL query params
  const searchParams = new URLSearchParams(location.search)
  const returnTo = searchParams.get('returnTo') || '/'

  const handleGuestLogin = () => {
    if (!guestName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setGuest(guestName.trim())
    navigate(returnTo)
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google')
      }

      // Decode the JWT token directly
      const decodedToken = jwtDecode<GoogleUserInfo>(credentialResponse.credential)
      
      if (!decodedToken.sub || !decodedToken.name) {
        throw new Error('Invalid Google user data')
      }

      // Create user object with required fields
      const user = {
        id: decodedToken.sub,
        name: decodedToken.name,
        email: decodedToken.email,
      }

      // Login and redirect
      login(user)
      navigate(returnTo)
    } catch (error) {
      console.error('Error during Google login:', error)
      toast({
        title: 'Error',
        description: 'Failed to login with Google',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" p={4}>
      <Card maxW="md" w="100%">
        <CardBody>
          <VStack spacing={6}>
            <Heading size="lg">Welcome to Promptionary</Heading>
            <Text color="gray.600" textAlign="center">
              Sign in to join a game or continue as a guest
            </Text>

            {/* Guest Login */}
            <VStack spacing={4} w="100%">
              <Input
                placeholder="Enter your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                size="lg"
              />
              <Button
                colorScheme="blue"
                size="lg"
                w="100%"
                onClick={handleGuestLogin}
              >
                Continue as Guest
              </Button>
            </VStack>

            <Divider />

            {/* Google Login */}
            <VStack spacing={4} w="100%">
              <Text>Or sign in with Google</Text>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  toast({
                    title: 'Error',
                    description: 'Failed to login with Google',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                  })
                }}
              />
            </VStack>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  )
}

export default Login 