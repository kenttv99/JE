export * from './types';
export * from './config';
export { ordersSocket } from './ordersSocket';

// Initialize the socket connection when importing
import { ordersSocket } from './ordersSocket';

// Auto-connect when imported (can be removed if you want manual control)
if (typeof window !== 'undefined') { // Only in browser environment
  setTimeout(() => {
    ordersSocket.connect();
  }, 0);
}