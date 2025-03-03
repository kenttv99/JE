import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(expiresAt);
      const secondsLeft = Math.max(0, differenceInSeconds(target, now));
      
      setTimeLeft(secondsLeft);
      
      if (secondsLeft === 0 && onExpire) {
        onExpire();
      }
    };
    
    // Calculate initially
    calculateTimeLeft();
    
    // Update every second
    const interval = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const currentDate = new Date();
  // For the example, let's set the expiration date to be 1 hour from now
  const expirationDate = new Date(expiresAt);
  
  // We might want to show different colors based on how much time is remaining
  let textColorClass = 'text-green-600'; // Default: more than 15 minutes
  
  if (timeLeft < 300) { // Less than 5 minutes
    textColorClass = 'text-red-600';
  } else if (timeLeft < 900) { // Less than 15 minutes
    textColorClass = 'text-orange-500';
  }
  
  return (
    <span className={`font-mono font-medium ${textColorClass}`}>
      {timeString}
    </span>
  );
};

export default CountdownTimer;