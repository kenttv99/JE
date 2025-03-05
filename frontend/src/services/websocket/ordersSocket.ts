// JE/frontend/src/services/websocket/ordersSocket.ts
class OrdersSocket {
  private ws: WebSocket | null = null;
  private eventListeners: { [event: string]: ((data: any) => void)[] } = {};
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 2000; // 2 секунды между попытками

  connect({ url, traderId, token }: { url: string; traderId: string; token: string }) {
    this.ws = new WebSocket(`${url}/${traderId}?token=${encodeURIComponent(token)}`);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0; // Сбросить счётчик попыток при успешном подключении
      this.emit('connect');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('message', data);
        if (data.type === 'orders_update') {
          this.emit('orders_update', data.orders);
        } else if (data.type === 'error') {
          this.emit('error', data.message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        this.emit('error', 'Invalid message format');
      }
    };

    this.ws.onerror = (error: Event) => {
      console.error('WebSocket error:', JSON.stringify(error));
      this.emit('error', error);
      if (this.ws?.readyState === WebSocket.CLOSED || this.ws?.readyState === WebSocket.CLOSING) {
        this.handleReconnect(url, traderId, token);
      }
    };

    this.ws.onclose = (event: CloseEvent) => {
      this.emit('disconnect', event);
      this.ws = null;
      this.handleReconnect(url, traderId, token);
      if (event.code !== 1000) { // Логируем только ненормальные закрытия (не 1000 — Normal Closure)
        console.error('WebSocket disconnected unexpectedly, code:', event.code, 'reason:', event.reason || 'No reason provided');
      }
    };
  }

  private handleReconnect(url: string, traderId: string, token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect({ url, traderId, token });
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('Max reconnect attempts reached. WebSocket connection failed.');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User-initiated disconnect'); // Закрытие с кодом 1000 (Normal Closure)
      this.ws = null;
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  private emit(event: string, data?: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach((callback) => callback(data));
    }
  }

  onOrdersUpdate: (orders: any) => void = () => {};

  setOnOrdersUpdate(callback: (orders: any) => void) {
    this.onOrdersUpdate = callback;
    this.on('orders_update', (orders) => this.onOrdersUpdate(orders));
  }
}

// Changed to named export instead of default export
export const ordersSocket = new OrdersSocket();