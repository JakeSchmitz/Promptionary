import React from 'react'
import { Box } from '@chakra-ui/react'
import Navbar from './Navbar'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <Box minH="100vh" bg="white">
      <Navbar />
      <Box pt="60px" bg="white">
        {children}
      </Box>
    </Box>
  )
}

export default Layout 