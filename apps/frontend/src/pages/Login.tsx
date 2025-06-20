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
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react'
import { FcGoogle } from 'react-icons/fc'
import { FaUser } from 'react-icons/fa'
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
    <Box 
      display="flex" 
      alignItems="center" 
      justifyContent="center" 
      p={4}
      bgGradient="linear(to-br, brand.900, brand.800, surface)"
      position="relative"
      overflow="hidden"
    >
      {/* Background decorative elements */}
      <Box
        position="absolute"
        top="-50%"
        left="-50%"
        w="200%"
        h="200%"
        bg="radial-gradient(circle, brand.500 1px, transparent 1px)"
        bgSize="50px 50px"
        opacity={0.1}
        animation="float 20s ease-in-out infinite"
        sx={{
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
            '50%': { transform: 'translateY(-20px) rotate(180deg)' },
          },
        }}
      />
      
      <Box
        position="absolute"
        top="20%"
        right="10%"
        w="300px"
        h="300px"
        bg="brand.400"
        borderRadius="full"
        filter="blur(100px)"
        opacity={0.1}
        animation="pulse 4s ease-in-out infinite"
        sx={{
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.1, transform: 'scale(1)' },
            '50%': { opacity: 0.2, transform: 'scale(1.1)' },
          },
        }}
      />

      <Container maxW="md" position="relative" zIndex={1}>
        <Card
          backdropFilter="blur(10px)"
          bg="whiteAlpha.100"
          border="1px solid rgba(255,255,255,0.2)"
          borderRadius="2xl"
          boxShadow="0 8px 32px rgba(0,0,0,0.3)"
          overflow="hidden"
        >
          <CardBody p={8}>
            <VStack spacing={8} textAlign="center">
              <VStack spacing={3}>
                <Heading 
                  size="xl" 
                  bgGradient="linear(to-r, brand.400, highlight)"
                  bgClip="text"
                  fontWeight="bold"
                >
                  Welcome to Promptionary
                </Heading>
                <Text color="textSecondary" fontSize="lg">
                  Sign in to join a game or continue as a guest
                </Text>
              </VStack>

              {/* Guest Login */}
              <VStack spacing={6} w="100%">
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <FaUser color="var(--chakra-colors-textSecondary)" />
                  </InputLeftElement>
                  <Input
                    placeholder="Enter your name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    bg="whiteAlpha.200"
                    borderColor="whiteAlpha.300"
                    color="textPrimary"
                    _placeholder={{
                      color: 'textSecondary',
                    }}
                    _focus={{
                      borderColor: 'brand.400',
                      boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
                      bg: 'whiteAlpha.300',
                    }}
                    _hover={{
                      bg: 'whiteAlpha.300',
                    }}
                    borderRadius="xl"
                  />
                </InputGroup>
                
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
                  borderRadius="xl"
                  px={8}
                  py={4}
                  size="lg"
                  w="100%"
                  onClick={handleGuestLogin}
                  transition="all 0.2s"
                >
                  Continue as Guest
                </Button>
              </VStack>

              <Divider borderColor="whiteAlpha.300" />

              {/* Google Login */}
              <VStack spacing={4} w="100%">
                <Text color="textSecondary" fontSize="md">
                  Or sign in with Google
                </Text>
                <Box
                  bg="whiteAlpha.200"
                  borderRadius="xl"
                  p={2}
                  border="1px solid rgba(255,255,255,0.2)"
                  _hover={{
                    bg: 'whiteAlpha.300',
                    transform: 'translateY(-1px)',
                  }}
                  transition="all 0.2s"
                >
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
                </Box>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  )
}

export default Login 