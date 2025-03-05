export * from './types';
export * from './config';
export { ordersSocket } from './ordersSocket';

// Initialize the socket connection when importing
// Import for side effects only (not for exporting)
import { WS_CONFIG } from './config';
import { ordersSocket as socket } from './ordersSocket';

// Auto-connect when imported (can be removed if you want manual control)
if (typeof window !== 'undefined') { // Only in browser environment
  setTimeout(() => {
    // You need to provide the required parameters:
    // Replace these placeholder values with actual values from your auth context or state
    const traderId = "your-trader-id"; // Replace with actual trader ID
    const token = "your-auth-token";   // Replace with actual auth token
    
    // Comment out this line if you want to connect manually elsewhere
    // socket.connect({
    //   url: WS_CONFIG.BASE_URL,
    //   traderId,
    //   token
    // });
  }, 0);
}