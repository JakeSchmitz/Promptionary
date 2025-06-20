import React from 'react'
import { Box } from '@chakra-ui/react'
import Navbar from './Navbar'
import { useAuth } from '../context/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const { currentUser } = useAuth()
  
  // Show navbar only if user is authenticated or has a guest name
  const shouldShowNavbar = currentUser?.name

  return (
    <Box bg="surface">
      {shouldShowNavbar && <Navbar />}
      <Box 
        pt={shouldShowNavbar ? "70px" : "0"} 
        bg="surface"
        minH="100dvh"
        display="flex"
        flexDirection="column"
      >
        {children}
      </Box>
    </Box>
  )
}

export default Layout 