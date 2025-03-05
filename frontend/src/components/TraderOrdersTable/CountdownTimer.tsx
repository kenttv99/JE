import React from 'react';
import { useOrderCountdown } from './useOrderCountdown';
import { useAuth } from '@/hooks/useAuth';  // Импортируем useAuth для получения токена

interface CountdownTimerProps {
  expiresAt: string;
  orderId: string;  // Добавляем orderId для отправки запроса на отмену
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiresAt, orderId }) => {
  const { session } = useAuth('trader');  // Получаем сессию для токена, типизируем через CustomSession
  const { timeString, textColorClass } = useOrderCountdown(expiresAt, () => {
    // Вызываем API для отмены ордера, когда таймер истекает
    const cancelOrder = async () => {
      try {
        const token = session?.accessToken || localStorage.getItem('token') || '';
        const response = await fetch(`/api/v1/trader_orders/${orderId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'cancelled' }),  // Обновляем статус на "cancelled"
        });
        if (!response.ok) {
          console.error('Failed to cancel order:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Error cancelling order:', error);
      }
    };
    cancelOrder();
  });

  return (
    <span className={`font-mono font-medium ${textColorClass}`}>
      {timeString}
    </span>
  );
};

export default CountdownTimer;