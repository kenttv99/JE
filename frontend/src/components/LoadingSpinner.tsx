// frontend/src/components/LoadingSpinner.tsx
import { FC } from 'react';

interface LoadingSpinnerProps {
  className?: string;
  showText?: boolean;
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({ 
  className = "h-12 w-12", 
  showText = true 
}) => {
  return (
    <div className="flex items-center justify-center">
      <div className="text-center">
        <div 
          className={`animate-spin rounded-full border-b-2 border-blue-500 ${className}`} 
          role="status"
        />
        {showText && (
          <p className="text-gray-600 mt-2">Загрузка...</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;