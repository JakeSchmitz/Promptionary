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
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import { ChevronDownIcon, ChevronRightIcon, MoonIcon, SunIcon } from '@chakra-ui/icons'
import { useGame } from '../context/GameContext'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { isOpen, onToggle } = useDisclosure()
  const { colorMode, toggleColorMode } = useColorMode()
  const { currentUser, logout } = useAuth()
  const { gameState } = useGame()
  const location = useLocation()
  const navigate = useNavigate()
  const bgColor = 'blue.500'
  const textColor = 'white'
  
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

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
      bg={bgColor}
      borderBottom="1px"
      borderColor="slate.700"
      shadow="md"
    >
      <Flex
        maxW="container.xl"
        mx="auto"
        px={4}
        h="60px"
        align="center"
        justify="space-between"
      >
        {/* Game Name */}
        <ChakraLink
          as={RouterLink}
          to="/"
          fontSize="xl"
          fontWeight="bold"
          color="white"
          _hover={{ textDecoration: 'none', color: 'blue.200' }}
        >
          {getTitle()}
        </ChakraLink>

        {/* User Menu */}
        {displayName && (
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              variant="ghost"
              size="sm"
              color={textColor}
              _hover={{ bg: 'blue.600' }}
              _active={{ bg: 'blue.700' }}
            >
              {displayName}
            </MenuButton>
            <MenuList bg="white" borderColor="blue.400" boxShadow="md">
              {!currentUser?.isGuest && (
                <>
                  <MenuItem 
                    onClick={() => navigate('/history')}
                    _hover={{ bg: 'blue.50' }}
                    color="blue.500"
                  >
                    Game History
                  </MenuItem>
                  <MenuItem 
                    onClick={() => navigate('/account')}
                    _hover={{ bg: 'blue.50' }}
                    color="blue.500"
                  >
                    Account
                  </MenuItem>
                </>
              )}
              <MenuItem 
                onClick={handleLogout}
                _hover={{ bg: 'blue.50' }}
                color="blue.500"
              >
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        )}
      </Flex>
    </Box>
  )
}

export default Navbar 