import React from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  Card,
  CardBody,
  HStack,
  Icon,
  Badge,
  Grid,
} from '@chakra-ui/react'
import { FaUser, FaCog, FaLock, FaBell } from 'react-icons/fa'

const Account = () => {
  const accountSections = [
    {
      title: 'Profile Settings',
      description: 'Update your name, email, and profile information',
      icon: FaUser,
      gradient: 'linear(to-br, brand.400, brand.500)',
      status: 'Available',
    },
    {
      title: 'Preferences',
      description: 'Customize your game settings and notifications',
      icon: FaCog,
      gradient: 'linear(to-br, info, brand.400)',
      status: 'Coming Soon',
    },
    {
      title: 'Privacy & Security',
      description: 'Manage your privacy settings and account security',
      icon: FaLock,
      gradient: 'linear(to-br, highlight, orange.400)',
      status: 'Coming Soon',
    },
    {
      title: 'Notifications',
      description: 'Configure how you receive game updates and alerts',
      icon: FaBell,
      gradient: 'linear(to-br, purple.400, pink.400)',
      status: 'Coming Soon',
    },
  ]

  return (
    <Container maxW="container.lg" py={8} minH="100dvh">
      <VStack spacing={8}>
        <VStack spacing={3} textAlign="center">
          <Heading 
            size="xl" 
            bgGradient="linear(to-r, brand.400, highlight)"
            bgClip="text"
            fontWeight="bold"
          >
            Account Settings
          </Heading>
          <Text color="textSecondary" fontSize="lg">
            Manage your account preferences and settings
          </Text>
        </VStack>

        <Box w="100%">
          <Card
            backdropFilter="blur(10px)"
            bg="whiteAlpha.100"
            border="1px solid rgba(255,255,255,0.2)"
            borderRadius="2xl"
            boxShadow="0 8px 32px rgba(0,0,0,0.3)"
          >
            <CardBody p={8}>
              <VStack spacing={6}>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6} w="100%">
                  {accountSections.map((section, index) => (
                    <Card
                      key={index}
                      bg="whiteAlpha.100"
                      border="1px solid rgba(255,255,255,0.2)"
                      borderRadius="xl"
                      overflow="hidden"
                      cursor={section.status === 'Available' ? 'pointer' : 'default'}
                      _hover={section.status === 'Available' ? {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                        borderColor: 'rgba(255,255,255,0.3)',
                      } : {}}
                      transition="all 0.3s ease"
                      position="relative"
                    >
                      <CardBody p={6}>
                        <VStack spacing={4} align="stretch">
                          <HStack justify="space-between">
                            <Box
                              w="50px"
                              h="50px"
                              borderRadius="xl"
                              bgGradient={section.gradient}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              boxShadow="0 4px 15px rgba(0,0,0,0.2)"
                            >
                              <Icon as={section.icon} boxSize={5} color="white" />
                            </Box>
                            <Badge
                              bgGradient={section.status === 'Available' 
                                ? 'linear(to-r, brand.400, brand.500)' 
                                : 'linear(to-r, highlight, orange.400)'
                              }
                              color="white"
                              px={3}
                              py={1}
                              borderRadius="full"
                              fontSize="xs"
                              fontWeight="bold"
                            >
                              {section.status}
                            </Badge>
                          </HStack>
                          
                          <VStack spacing={2} align="start">
                            <Heading size="md" color="textPrimary">
                              {section.title}
                            </Heading>
                            <Text color="textSecondary" fontSize="sm">
                              {section.description}
                            </Text>
                          </VStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </Grid>
              </VStack>
            </CardBody>
          </Card>
        </Box>
      </VStack>
    </Container>
  )
}

export default Account 