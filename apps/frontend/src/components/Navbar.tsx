import React from 'react'
import {
  Box,
  Flex,
  Text,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Link as ChakraLink,
  Stack,
  Collapse,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useBreakpointValue,
  useDisclosure,
  useColorMode,
  HStack,
  Avatar,
  Badge,
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import { ChevronDownIcon, ChevronRightIcon, MoonIcon, SunIcon } from '@chakra-ui/icons'
import { FaGamepad, FaUser, FaHistory, FaSignOutAlt } from 'react-icons/fa'
import { useGame } from '../context/GameContext'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { isOpen, onToggle } = useDisclosure()
  const { colorMode, toggleColorMode } = useColorMode()
  const { currentUser, logout } = useAuth()
  const { gameState } = useGame()
  const location = useLocation()
  const navigate = useNavigate()
  
  const displayName = currentUser?.name

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getTitle = () => {
    // Always show Promptionary on these pages
    if (['/login', '/account', '/history', '/dashboard'].includes(location.pathname)) {
      return 'Promptionary'
    }

    // Show game mode specific title in game room
    if (location.pathname.startsWith('/game/') && gameState) {
      return gameState.gameMode === 'PROMPTOPHONE' ? 'Promptophone' : 'Prompt Anything'
    }

    // Default title
    return 'Promptionary'
  }

  const getGameModeBadge = () => {
    if (location.pathname.startsWith('/game/') && gameState) {
      return (
        <Badge
          bgGradient="linear(to-r, brand.400, brand.500)"
          color="white"
          px={3}
          py={1}
          borderRadius="full"
          fontSize="xs"
          fontWeight="bold"
          ml={3}
        >
          {gameState.gameMode === 'PROMPTOPHONE' ? 'Promptophone' : 'Prompt Anything'}
        </Badge>
      )
    }
    return null
  }

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
      backdropFilter="blur(10px)"
      bg="whiteAlpha.100"
      borderBottom="1px solid rgba(255,255,255,0.2)"
      boxShadow="0 4px 20px rgba(0,0,0,0.1)"
    >
      <Flex
        maxW="container.xl"
        mx="auto"
        px={6}
        h="70px"
        align="center"
        justify="space-between"
      >
        {/* Game Name */}
        <HStack spacing={3}>
          <ChakraLink
            as={RouterLink}
            to="/"
            fontSize="2xl"
            fontWeight="bold"
            bgGradient="linear(to-r, brand.400, highlight)"
            bgClip="text"
            _hover={{ 
              textDecoration: 'none',
              transform: 'scale(1.05)',
            }}
            transition="all 0.2s"
          >
            {getTitle()}
          </ChakraLink>
          {getGameModeBadge()}
        </HStack>

        {/* User Menu */}
        {displayName && (
          <HStack spacing={4}>
            {/* Color Mode Toggle */}
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
              size="sm"
              color="textPrimary"
              _hover={{ 
                bg: 'whiteAlpha.200',
                transform: 'scale(1.1)',
              }}
              transition="all 0.2s"
            />

            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                variant="ghost"
                size="md"
                color="textPrimary"
                bg="whiteAlpha.200"
                border="1px solid rgba(255,255,255,0.2)"
                borderRadius="xl"
                px={4}
                _hover={{ 
                  bg: 'whiteAlpha.300',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
                _active={{ 
                  bg: 'whiteAlpha.400',
                  transform: 'translateY(0)',
                }}
                transition="all 0.2s"
              >
                <HStack spacing={3}>
                  <Avatar 
                    size="sm" 
                    name={displayName}
                    bgGradient="linear(to-r, brand.400, brand.500)"
                    color="white"
                    fontWeight="bold"
                  />
                  <Text fontWeight="medium">{displayName}</Text>
                </HStack>
              </MenuButton>
              <MenuList 
                bg={colorMode === 'light' ? 'whiteAlpha.800' : 'gray.900'}
                color={colorMode === 'light' ? 'gray.900' : 'white'}
                backdropFilter="blur(10px)"
                border="1px solid rgba(255,255,255,0.3)"
                borderRadius="xl"
                boxShadow="0 8px 32px rgba(0,0,0,0.3)"
                py={2}
                px={0}
                minW="220px"
              >
                {!currentUser?.isGuest && (
                  <>
                    <MenuItem 
                      onClick={() => navigate('/dashboard')}
                      _hover={{ 
                        bgGradient: 'linear(to-r, brand.400, brand.500)',
                        color: 'white',
                        transform: 'scale(1.03)',
                        boxShadow: '0 4px 16px rgba(16,163,127,0.15)',
                      }}
                      color={colorMode === 'light' ? 'gray.900' : 'white'}
                      icon={<FaGamepad />}
                      borderRadius="md"
                      fontWeight="medium"
                      fontSize="md"
                      px={4}
                      py={2}
                      mb={1}
                    >
                      Dashboard
                    </MenuItem>
                    <MenuItem 
                      onClick={() => navigate('/history')}
                      _hover={{ 
                        bgGradient: 'linear(to-r, highlight, orange.400)',
                        color: 'white',
                        transform: 'scale(1.03)',
                        boxShadow: '0 4px 16px rgba(255,140,0,0.15)',
                      }}
                      color={colorMode === 'light' ? 'gray.900' : 'white'}
                      icon={<FaHistory />}
                      borderRadius="md"
                      fontWeight="medium"
                      fontSize="md"
                      px={4}
                      py={2}
                      mb={1}
                    >
                      Game History
                    </MenuItem>
                    <MenuItem 
                      onClick={() => navigate('/account')}
                      _hover={{ 
                        bgGradient: 'linear(to-r, purple.400, pink.400)',
                        color: 'white',
                        transform: 'scale(1.03)',
                        boxShadow: '0 4px 16px rgba(214,31,255,0.15)',
                      }}
                      color={colorMode === 'light' ? 'gray.900' : 'white'}
                      icon={<FaUser />}
                      borderRadius="md"
                      fontWeight="medium"
                      fontSize="md"
                      px={4}
                      py={2}
                      mb={1}
                    >
                      Account
                    </MenuItem>
                  </>
                )}
                <MenuItem 
                  onClick={handleLogout}
                  _hover={{ 
                    bgGradient: 'linear(to-r, red.400, red.600)',
                    color: 'white',
                    transform: 'scale(1.03)',
                    boxShadow: '0 4px 16px rgba(255,0,0,0.15)',
                  }}
                  color="red.500"
                  icon={<FaSignOutAlt />}
                  borderRadius="md"
                  fontWeight="bold"
                  fontSize="md"
                  px={4}
                  py={2}
                  mt={currentUser?.isGuest ? 0 : 2}
                >
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        )}
      </Flex>
    </Box>
  )
}

export default Navbar 