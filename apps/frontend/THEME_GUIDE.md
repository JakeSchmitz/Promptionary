# Theme and Color Scheme Guide

This guide explains how the theming system works in the Promptionary frontend app and how to change the color scheme.

## How Theming Works

The app uses **Chakra UI v2.8.2** for theming. The theme system is centralized in `src/theme.ts` and applied through the `ChakraProvider` in `App.tsx`.

## Current Implementation

- **Theme File**: `src/theme.ts` - Contains all theme configuration
- **Provider**: `App.tsx` - Applies the theme to the entire app
- **Color Usage**: Components use semantic color tokens like `brand.500`, `surface`, `textPrimary`, etc.
- **Dark Mode**: The app is configured to use dark mode by default

## Current Dark Theme Colors

The app currently uses a custom dark theme with the following color palette:

```typescript
// Brand Colors (Teal/Green)
brand: {
  50: '#E6FFFA',
  100: '#B2F5EA',
  200: '#81E6D9',
  300: '#4FD1C7',
  400: '#38B2AC',
  500: '#10A37F', // Primary brand color
  600: '#0D9488',
  700: '#0F766E',
  800: '#115E59',
  900: '#134E4A',
}

// Dark Theme Colors
surface: '#1E1E1E',        // Main background
secondary: '#3F3F46',      // Secondary elements, borders
highlight: '#FBBF24',      // Accent/highlight color
danger: '#EF4444',         // Error states
info: '#60A5FA',          // Info states
textPrimary: '#FFFFFF',    // Primary text
textSecondary: '#A1A1AA',  // Secondary text
```

## How to Change the Color Scheme

### Option 1: Modify Brand Colors

To change the primary brand color, update the `brand` object in `src/theme.ts`:

```typescript
colors: {
  brand: {
    50: '#f0f9ff',   // Lightest shade
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // Main brand color - change this!
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',  // Darkest shade
  },
  // ... other colors
}
```

### Option 2: Change Background Colors

To modify the dark theme backgrounds:

```typescript
colors: {
  // ... brand colors
  surface: '#1E1E1E',     // Main background - change this!
  secondary: '#3F3F46',   // Secondary elements - change this!
  // ... other colors
}
```

### Option 3: Change Text Colors

To modify text colors:

```typescript
colors: {
  // ... other colors
  textPrimary: '#FFFFFF',    // Primary text - change this!
  textSecondary: '#A1A1AA',  // Secondary text - change this!
}
```

### Option 4: Switch to Light Theme

To switch to a light theme, update the config and colors:

```typescript
const theme = extendTheme({
  config: {
    initialColorMode: 'light',  // Change to 'light'
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: '#FFFFFF',  // Light background
        color: '#000000',  // Dark text
      },
    },
  },
  colors: {
    // ... brand colors
    surface: '#FFFFFF',        // Light background
    secondary: '#E5E7EB',      // Light secondary
    textPrimary: '#000000',    // Dark text
    textSecondary: '#6B7280',  // Light secondary text
  },
})
```

## Color Usage in Components

Components use semantic color tokens that automatically adapt to your theme:

- `brand.500` - Primary brand color (main buttons, links, highlights)
- `brand.600` - Darker shade (hover states, secondary elements)
- `surface` - Main background color
- `secondary` - Secondary elements, borders, dividers
- `textPrimary` - Primary text color
- `textSecondary` - Secondary text color
- `highlight` - Accent/highlight color
- `danger` - Error states
- `info` - Info states

## Component Styling

The theme includes custom styling for common components:

### Buttons
- Primary buttons use `brand.500` background
- Ghost buttons use `textPrimary` color with `secondary` hover

### Cards
- Background: `surface`
- Border: `secondary`

### Inputs
- Background: `surface`
- Border: `secondary`
- Focus: `brand.500` border with glow effect
- Placeholder: `textSecondary`

### Text & Headings
- Default color: `textPrimary`

## Examples

### Purple Brand Theme
```typescript
brand: {
  50: '#f3e8ff',
  100: '#e9d5ff',
  200: '#d8b4fe',
  300: '#c084fc',
  400: '#a855f7',
  500: '#9333ea', // Purple primary
  600: '#7c3aed',
  700: '#6b21a8',
  800: '#581c87',
  900: '#3b0764',
}
```

### Blue Brand Theme
```typescript
brand: {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6', // Blue primary
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
}
```

### Custom Dark Background
```typescript
colors: {
  // ... brand colors
  surface: '#0F0F0F',     // Very dark background
  secondary: '#2A2A2A',   // Darker secondary
  // ... other colors
}
```

## Testing Your Changes

1. Make your changes in `src/theme.ts`
2. Save the file
3. The development server will automatically reload
4. Check the navbar, buttons, cards, and other UI elements to see your new color scheme

## Components That Use Theme Colors

The following components have been updated to use the theme color system:

- `Layout.tsx` - Main layout background
- `Navbar.tsx` - Navigation bar and menu
- `Login.tsx` - Login form and styling
- `Account.tsx` - Account page styling
- `PromptPhase.tsx` - Game phase headings and text
- `VotingPhase.tsx` - Voting interface elements
- `ResultsPhase.tsx` - Results display
- `Dashboard.tsx` - Dashboard icons and elements

All buttons, inputs, cards, and other interactive elements will automatically use your chosen color scheme through Chakra UI's component system. 