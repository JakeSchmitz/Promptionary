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
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { useGame } from '../context/GameContext'

const Navbar = () => {
  const navigate = useNavigate()
  const { playerName } = useGame()
  const bgColor = 'blue.500'
  const textColor = 'white'
  
  // Get user info from localStorage
  const user = localStorage.getItem('user')
  const displayName = user || playerName

  const handleLogout = () => {
    // Clear all authentication and user data
    localStorage.removeItem('user')
    localStorage.removeItem('playerId')
    localStorage.removeItem('playerName')
    localStorage.removeItem('roomId')
    localStorage.removeItem('googleAccessToken')
    
    // Clear any other game-related data
    localStorage.removeItem('gameState')
    localStorage.removeItem('gameSettings')
    
    // Force a page reload to clear any in-memory state
    window.location.href = '/'
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
          Promptionary
        </ChakraLink>

        {/* User Menu */}
        {displayName && displayName !== 'Guest' && (
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