import { useState } from 'react';
import { format } from 'date-fns';
import api from '@/lib/api';

interface Requisite {
  id: number;
  payment_method: string;
  bank: string;
  req_number: string;
  fio: string;
  can_buy: boolean;
  can_sell: boolean;
  status: string;
  created_at: string;
}

interface RequisitesTableProps {
  requisites: Requisite[];
  onUpdate?: (updatedRequisites: Requisite[]) => void;
}

const RequisitesTable: React.FC<RequisitesTableProps> = ({ requisites, onUpdate }) => {
  const [updating, setUpdating] = useState<number | null>(null);

  const handleDirectionToggle = async (
    requisiteId: number, 
    field: 'can_buy' | 'can_sell', 
    currentValue: boolean
  ) => {
    try {
      setUpdating(requisiteId);
      // Changed from PATCH to PUT method
      const response = await api.put<Requisite>(`/api/v1/trader_req/update_requisite/${requisiteId}`, {
        [field]: !currentValue
      });

      if (response.data && onUpdate) {
        const updatedRequisites = requisites.map(req =>
          req.id === requisiteId ? { ...req, [field]: !currentValue } : req
        );
        onUpdate(updatedRequisites);
      }
    } catch (error) {
      console.error('Failed to update requisite:', error);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Метод
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Банк
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Номер
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ФИО
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pay In
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pay Out
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Дата создания
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {requisites.map((requisite) => (
            <tr key={requisite.id} className="hover:bg-gray-50">
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
              <td className="px-6 py-4 whitespace-nowrap">
                <div
                  onClick={() => handleDirectionToggle(requisite.id, 'can_buy', requisite.can_buy)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                    updating === requisite.id ? 'opacity-50 cursor-not-allowed' : ''
                  } ${requisite.can_buy ? 'bg-blue-500' : 'bg-gray-200'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
                      requisite.can_buy ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div
                  onClick={() => handleDirectionToggle(requisite.id, 'can_sell', requisite.can_sell)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                    updating === requisite.id ? 'opacity-50 cursor-not-allowed' : ''
                  } ${requisite.can_sell ? 'bg-blue-500' : 'bg-gray-200'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
                      requisite.can_sell ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {format(new Date(requisite.created_at), 'dd.MM.yyyy HH:mm')}
              </td>
            </tr>
          ))}
          {requisites.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                Нет доступных реквизитов
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RequisitesTable;