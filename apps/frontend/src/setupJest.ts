// Suppress Framer Motion errors in Jest environment
// These are expected errors when running in JSDOM and don't affect test functionality

// Mock window.scrollTo to prevent Framer Motion errors
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// Suppress console.error for specific Framer Motion errors
const originalError = console.error;
console.error = (...args: any[]) => {
  // Filter out Framer Motion scrollTo errors
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Not implemented: window.scrollTo')) {
    return;
  }
  // Filter out Framer Motion animation errors
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Error: Not implemented: window.scrollTo')) {
    return;
  }
  originalError(...args);
}; 