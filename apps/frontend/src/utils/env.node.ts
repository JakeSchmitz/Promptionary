// TypeScript: declare process for test environments
declare const process: { env: { VITE_API_URL?: string, VITE_GOOGLE_CLIENT_ID?: string } };

export const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';
export const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || 'test-client-id'; 