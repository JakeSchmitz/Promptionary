// TypeScript: declare process for test environments
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const process: { env: { VITE_API_URL?: string } };

export const API_URL =
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL) || 'http://localhost:3000/api'; 