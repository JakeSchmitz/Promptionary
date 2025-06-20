// TypeScript: declare process for test environments
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const process: { env: { VITE_API_URL?: string, VITE_GOOGLE_CLIENT_ID?: string } };

export const API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_API_URL) ||
  'http://localhost:3000/api';

export const GOOGLE_CLIENT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
  (typeof process !== 'undefined' && process.env?.VITE_GOOGLE_CLIENT_ID) ||
  ''; 