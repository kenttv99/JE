// frontend/src/components/LoadingSpinner.tsx
import { FC } from 'react';

interface LoadingSpinnerProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({ 
  className = "", 
  showText = true,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="inline-flex items-center justify-center">
      <div className="text-center">
        <div 
          className={`animate-spin rounded-full border-2 border-gray-200 border-b-blue-500 ${sizeClasses[size]} ${className}`} 
          role="status"
        />
        {/* {showText && (
          <p className="text-gray-600 mt-2">Загрузка...</p>
        )} */}
      </div>
    </div>
  );
};

export default LoadingSpinner;