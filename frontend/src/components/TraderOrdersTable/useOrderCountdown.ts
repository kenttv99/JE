import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';

interface CountdownResult {
  timeString: string;
  secondsLeft: number;
  textColorClass: string;
}

export const useOrderCountdown = (expiresAt: string, onExpire?: () => void): CountdownResult => {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(expiresAt);
      const timeRemaining = Math.max(0, differenceInSeconds(target, now));
      setSecondsLeft(timeRemaining);

      if (timeRemaining === 0 && onExpire) {
        onExpire();
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  let textColorClass = 'text-green-600';
  if (secondsLeft < 300) {
    textColorClass = 'text-red-600';
  } else if (secondsLeft < 900) {
    textColorClass = 'text-orange-500';
  }

  return { timeString, secondsLeft, textColorClass };
};