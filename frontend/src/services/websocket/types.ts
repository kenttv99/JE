// Common message types for WebSocket communication
export interface WSMessage<T = any> {
    type: string;
    payload: T;
  }
  
  // Connection status types
  export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'failed';
  
  // Base WebSocket handler interface
  export interface WebSocketHandler<T = any> {
    connect(): void;
    disconnect(): void;
    getStatus(): ConnectionStatus;
    subscribe(callback: (message: WSMessage<T>) => void): () => void;
  }
  
  // Order related message types
  export interface OrderCreatedPayload {
    id: string;
    method: string;
    bank: string;
    number: string;
    createdAt: string;
    expiresAt: string;
    status: string;
  }
  
  export interface OrderUpdatedPayload {
    id: string;
    status: string;
  }
  
  export type OrderEventTypes = 'order_created' | 'order_updated' | 'order_deleted';
  
  export interface OrderEvent extends WSMessage {
    type: OrderEventTypes;
  }