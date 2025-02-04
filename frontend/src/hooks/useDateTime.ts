// frontend/src/hooks/useDateTime.ts
import { useState, useEffect } from 'react';

export function useDateTime(utcOffset: number = 0) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const offsetMs = utcOffset * 60 * 60 * 1000;
      const localTime = new Date(now.getTime() + offsetMs);
      // Only update if the time string has actually changed
      const newTimeString = localTime.toLocaleString('ru-RU');
      if (newTimeString !== time) {
        setTime(newTimeString);
      }
    };

    // Initial update
    updateTime();
    
    // Update every 30 seconds instead of every second
    const interval = setInterval(updateTime, 30000);

    return () => clearInterval(interval);
  }, [utcOffset, time]); // Include time in dependencies

  return time;
}