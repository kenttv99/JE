import { memo } from 'react';
import { format } from 'date-fns';
import { FaPen, FaTimes } from 'react-icons/fa';
import { Requisite } from '@/hooks/useTraderRequisites';
import ToggleSwitch from './ToggleSwitch';

const RequisiteRow: React.FC<{
  requisite: Requisite;
  index: number;
  updating: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, property: 'can_buy' | 'can_sell', currentValue: boolean, inactive: boolean) => void;
}> = ({ requisite, index, updating, onEdit, onDelete, onToggle }) => {
  const isDeleted = requisite.status === 'deleted';
  const cellClass = "px-6 py-4 whitespace-nowrap text-sm text-gray-900";
  
  // Для отладки: вывод данных реквизита
  console.log('Requisite Data (Frontend):', {
    id: requisite.id,
    methodDesc: requisite.payment_method_description,
    bankDesc: requisite.bank_description
  });

  return (
    <tr className="hover:bg-gray-50">
      <td className={cellClass}>{index + 1}</td>
      <td className={cellClass}>{requisite.payment_method_description}</td>
      <td className={cellClass}>{requisite.bank_description}</td>
      <td className={cellClass}>{requisite.req_number}</td>
      <td className={cellClass}>{requisite.fio}</td>
      
      {['can_buy', 'can_sell'].map((prop, i) => (
        <td key={i} className={`${cellClass} text-center`}>
          <ToggleSwitch
            checked={requisite[prop as keyof Requisite] as boolean}
            onChange={() => onToggle(requisite.id, prop as 'can_buy' | 'can_sell', 
              requisite[prop as keyof Requisite] as boolean, isDeleted)}
            disabled={updating || isDeleted}
            inactive={isDeleted}
          />
        </td>
      ))}

      <td className={cellClass}>
        {format(new Date(requisite.created_at), 'dd.MM.yyyy HH:mm')}
      </td>

      <td className={`${cellClass} text-right`}>
        <div className="flex justify-end space-x-2">
          {isDeleted ? (
            <span className="text-red-300">deleted</span>
          ) : (
            <>
              <button 
                onClick={() => onEdit(requisite.id)} 
                disabled={updating}
                aria-label="Edit"
              >
                <FaPen className="h-4 w-4 text-gray-500 hover:text-gray-700" />
              </button>
              <button 
                onClick={() => onDelete(requisite.id)} 
                disabled={updating}
                aria-label="Delete"
              >
                <FaTimes className="h-4 w-4 text-red-500 hover:text-red-700" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

export default memo(RequisiteRow);