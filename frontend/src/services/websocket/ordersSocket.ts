import { WS_CONFIG } from './config';
import { 
  ConnectionStatus, 
  WebSocketHandler,
  WSMessage, 
  OrderEvent
} from './types';

class OrdersSocketHandler implements WebSocketHandler<OrderEvent> {
  private socket: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private subscribers: ((message: WSMessage<OrderEvent>) => void)[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(private readonly endpoint: string = '/orders') {}

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return; // Already connected or connecting
    }
    
    this.status = 'connecting';
    
    try {
      // Construct the full WebSocket URL
      const wsUrl = `${WS_CONFIG.BASE_URL}${this.endpoint}`;
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = this.handleOpen;
      this.socket.onmessage = this.handleMessage;
      this.socket.onclose = this.handleClose;
      this.socket.onerror = this.handleError;
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      this.status = 'failed';
      this.attemptReconnect();
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.clearHeartbeat();
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.status = 'disconnected';
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public subscribe(callback: (message: WSMessage<OrderEvent>) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private handleOpen = () => {
    this.status = 'connected';
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    console.log('WebSocket connection established');
  };

  private handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as WSMessage<OrderEvent>;
      
      // Notify all subscribers
      this.subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  private handleClose = () => {
    this.status = 'disconnected';
    this.clearHeartbeat();
    console.log('WebSocket connection closed');
    this.attemptReconnect();
  };

  private handleError = (error: Event) => {
    console.error('WebSocket error:', error);
    this.status = 'failed';
  };

  private attemptReconnect() {
    if (this.reconnectAttempts >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.log('Maximum reconnect attempts reached');
      this.status = 'failed';
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${WS_CONFIG.MAX_RECONNECT_ATTEMPTS})...`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, WS_CONFIG.RECONNECT_INTERVAL);
  }

  private startHeartbeat() {
    this.clearHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        // Send ping message to keep connection alive
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, WS_CONFIG.HEARTBEAT_INTERVAL);
  }

  private clearHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Create a singleton instance for orders WebSocket
export const ordersSocket = new OrdersSocketHandler();