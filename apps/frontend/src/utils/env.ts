// TypeScript: declare process for test environments
declare const process: { env: { VITE_API_URL?: string, VITE_GOOGLE_CLIENT_ID?: string } };

export const API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_API_URL) ||
  'http://localhost:3000/api';

export const GOOGLE_CLIENT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
  (typeof process !== 'undefined' && process.env?.VITE_GOOGLE_CLIENT_ID) ||
  ''; 