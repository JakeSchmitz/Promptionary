// TypeScript: declare process for test environments
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const process: { env: { VITE_API_URL?: string, VITE_GOOGLE_CLIENT_ID?: string } };

export const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';
export const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || 'test-client-id'; 