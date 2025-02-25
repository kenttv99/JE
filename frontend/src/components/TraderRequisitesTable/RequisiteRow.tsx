import { memo } from 'react';
import { format } from 'date-fns';
import { FaPen, FaTimes } from 'react-icons/fa';
import { Requisite } from '@/hooks/useTraderRequisites';
import ToggleSwitch from './ToggleSwitch';

interface RequisiteRowProps {
  requisite: Requisite;
  index: number;
  updating: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, property: 'can_buy' | 'can_sell', currentValue: boolean, inactive: boolean) => void;
}

const RequisiteRow: React.FC<RequisiteRowProps> = ({ 
  requisite, 
  index, 
  updating, 
  onEdit, 
  onDelete, 
  onToggle 
}) => {
  const isDeleted = requisite.status === 'deleted';
  
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {index + 1}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {requisite.payment_method}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {requisite.bank}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {requisite.req_number}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {requisite.fio}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <ToggleSwitch
          checked={requisite.can_buy}
          onChange={() => onToggle(requisite.id, 'can_buy', requisite.can_buy, isDeleted)}
          disabled={updating || isDeleted}
          inactive={isDeleted}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <ToggleSwitch
          checked={requisite.can_sell}
          onChange={() => onToggle(requisite.id, 'can_sell', requisite.can_sell, isDeleted)}
          disabled={updating || isDeleted}
          inactive={isDeleted}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {format(new Date(requisite.created_at), 'dd.MM.yyyy HH:mm')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          {isDeleted ? (
            <span className="text-red-300">deleted</span>
          ) : (
            <>
                            <button
                onClick={() => onEdit(requisite.id)}
                className="text-gray-500 hover:text-gray-700"
                disabled={updating}
              >
                <FaPen className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </button>
              <button
                onClick={() => onDelete(requisite.id)}
                className="text-red-500 hover:text-red-700"
                disabled={updating}
              >
                <FaTimes className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

export default memo(RequisiteRow);