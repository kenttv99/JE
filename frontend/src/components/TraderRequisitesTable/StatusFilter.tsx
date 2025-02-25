import { memo } from 'react';
import { StatusType } from './types';

interface StatusFilterProps {
  activeStatus: StatusType;
  onStatusChange: (status: StatusType) => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ activeStatus, onStatusChange }) => {
  return (
    <div className="flex space-x-2">
      <button
        onClick={() => onStatusChange('all')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
          ${activeStatus === 'all' 
            ? 'bg-blue-100 text-blue-700 shadow-sm ring-1 ring-blue-700/10' 
            : 'bg-white text-gray-600 hover:bg-gray-50'}`}
      >
        Все
      </button>
      <button
        onClick={() => onStatusChange('active')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
          ${activeStatus === 'active' 
            ? 'bg-green-100 text-green-700 shadow-sm ring-1 ring-green-700/10' 
            : 'bg-white text-gray-600 hover:bg-gray-50'}`}
      >
        Активные
      </button>
      <button
        onClick={() => onStatusChange('deleted')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
          ${activeStatus === 'deleted' 
            ? 'bg-red-100 text-red-700 shadow-sm ring-1 ring-red-700/10' 
            : 'bg-white text-gray-600 hover:bg-gray-50'}`}
      >
        Удаленные
      </button>
    </div>
  );
};

export default memo(StatusFilter);