// frontend/src/hooks/useDateTime.ts
import { useState, useEffect } from 'react';

export function useDateTime(utcOffset: number = 0) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const offsetMs = utcOffset * 60 * 60 * 1000;
      const localTime = new Date(now.getTime() + offsetMs);
      setTime(localTime.toLocaleString('ru-RU'));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [utcOffset]);

  return time;
}