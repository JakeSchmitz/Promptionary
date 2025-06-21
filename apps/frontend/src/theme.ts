import { extendTheme } from '@chakra-ui/react'

// Dark theme configuration
const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      'html, body, #root': {
        height: '100%',
        minHeight: '100dvh',
        width: '100%',
      },
      body: {
        bg: '#121212',
        color: '#FFFFFF',
      },
    },
  },
  colors: {
    brand: {
      50: '#E6FFFA',
      100: '#B2F5EA',
      200: '#81E6D9',
      300: '#4FD1C7',
      400: '#38B2AC',
      500: '#10A37F', // primary
      600: '#0D9488',
      700: '#0F766E',
      800: '#115E59',
      900: '#134E4A',
    },
    surface: '#1E1E1E',
    secondary: '#3F3F46',
    highlight: '#FBBF24',
    danger: '#EF4444',
    info: '#60A5FA',
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA',
    // Override gray palette for dark theme
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
          },
        },
        ghost: {
          color: 'textPrimary',
          _hover: {
            bg: 'secondary',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'surface',
          borderColor: 'secondary',
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          bg: 'surface',
          borderColor: 'secondary',
          color: 'textPrimary',
          _placeholder: {
            color: 'textSecondary',
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
        },
      },
    },
    Link: {
      baseStyle: {
        color: 'brand.500',
        _hover: {
          textDecoration: 'none',
          color: 'brand.400',
        },
      },
    },
    Text: {
      baseStyle: {
        color: 'textPrimary',
      },
    },
    Heading: {
      baseStyle: {
        color: 'textPrimary',
      },
    },
  },
})

export default theme 