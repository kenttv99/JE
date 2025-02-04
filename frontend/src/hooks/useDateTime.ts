// frontend/src/hooks/useDateTime.ts
import { useState, useEffect } from 'react';

export function useDateTime(timezone: number = 0) {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const date = new Date();
      const utcTime = new Date(date.getTime() + timezone * 60 * 60 * 1000);
      setCurrentTime(utcTime.toISOString().slice(0, 19).replace('T', ' '));
    }, 1000);
    return () => clearInterval(timer);
  }, [timezone]);

  return currentTime;
}