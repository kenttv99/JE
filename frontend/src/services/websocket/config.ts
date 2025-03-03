// WebSocket configuration parameters
export const WS_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
    RECONNECT_INTERVAL: 3000, // 3 seconds between reconnect attempts
    MAX_RECONNECT_ATTEMPTS: 5, // Maximum number of reconnect attempts
    HEARTBEAT_INTERVAL: 30000, // 30 seconds ping interval to keep connection alive
  };