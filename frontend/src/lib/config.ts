export const config = {
    api: {
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      timeout: 30000,
      retryAttempts: 3,
    },
    auth: {
      sessionMaxAge: 24 * 60 * 60, // 24 hours
      jwtMaxAge: 24 * 60 * 60, // 24 hours
    }
  };
  
  export const API_URL = config.api.url; // Keep this for backward compatibility