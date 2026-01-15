export const env = {
  backendUrl: process.env.BACKEND_URL ?? 'http://localhost:3000',
} as const;
