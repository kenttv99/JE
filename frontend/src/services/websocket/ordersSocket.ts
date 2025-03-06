// JE/frontend/src/services/websocket/ordersSocket.ts
class OrdersSocket {
  private ws: WebSocket | null = null;
  private eventListeners: { [event: string]: ((data: any) => void)[] } = {};
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 2000; // 2 секунды между попытками
  private connectionParams: { url: string; traderId: string; token: string } | null = null;

  connect({ url, traderId, token }: { url: string; traderId: string; token: string }) {
    // Сохраняем параметры подключения для возможного переподключения
    this.connectionParams = { url, traderId, token };
    
    // Если соединение уже открыто или в процессе открытия, не пытаемся открыть новое
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket connection already exists, not reconnecting');
      return;
    }

    const wsUrl = `${url}/${traderId}?token=${encodeURIComponent(token)}`;
    console.log(`Connecting to WebSocket: ${wsUrl}`);
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connection established');
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
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = (event: CloseEvent) => {
        console.log(`WebSocket closed: code=${event.code}, reason=${event.reason || 'No reason provided'}`);
        this.emit('disconnect', event);
        this.ws = null;
        
        // Только если это не пользовательское отключение (код не 1000), 
        // и у нас есть сохраненные параметры подключения
        if (event.code !== 1000 && this.connectionParams) {
          this.handleReconnect();
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.emit('error', error);
    }
  }

  private handleReconnect() {
    if (!this.connectionParams) return;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectInterval * this.reconnectAttempts;
      
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        if (this.connectionParams) {
          this.connect(this.connectionParams);
        }
      }, delay);
    } else {
      console.error('Max reconnect attempts reached. WebSocket connection failed.');
      this.emit('error', 'Max reconnect attempts reached');
    }
  }

  disconnect() {
    if (this.ws) {
      // Правильно закрываем соединение
      if (this.ws.readyState === WebSocket.OPEN) {
        console.log('Intentionally closing WebSocket connection');
        this.ws.close(1000, 'User-initiated disconnect'); // Нормальное закрытие
      }
      this.ws = null;
    }
    
    // Сбрасываем параметры подключения
    this.connectionParams = null;
    this.reconnectAttempts = 0;
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

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const ordersSocket = new OrdersSocket();