import { useState } from 'react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { Requisite } from '@/hooks/useTraderRequisites';

interface RequisitesTableProps {
  requisites: Requisite[];
  // onUpdate?: (updatedRequisites: Requisite[]) => void; // Removed onUpdate prop
}

const RequisitesTable: React.FC<RequisitesTableProps> = ({ requisites }) => {
  const [updating, setUpdating] = useState<number | null>(null);
    const [localRequisites, setLocalRequisites] = useState<Requisite[]>(requisites);

  const handleDirectionToggle = async (
    requisiteId: number,
    field: 'can_buy' | 'can_sell',
    currentValue: boolean
  ) => {
    if (updating === requisiteId) return;

    try {
      setUpdating(requisiteId);
      const currentRequisite = localRequisites.find(req => req.id === requisiteId);
      if (!currentRequisite) return;

      const updatedRequisite = { ...currentRequisite, [field]: !currentValue };

      setLocalRequisites(prevRequisites =>
        prevRequisites.map(req => (req.id === requisiteId ? updatedRequisite : req))
      );

      await api.put<Requisite>(`/api/v1/trader_req/update_requisite/${requisiteId}`, {
        payment_method: updatedRequisite.payment_method,
        bank: updatedRequisite.bank,
        req_number: updatedRequisite.req_number,
        fio: updatedRequisite.fio,
        status: updatedRequisite.status,
        [field]: !currentValue
      });
    } catch (error) {
      console.error('Failed to update requisite:', error);
        setLocalRequisites(requisites); // Revert to original requisites on error
    } finally {
      setUpdating(null);
    }
  };

  // Helper function to determine switch appearance
  const getSwitchStyles = (isActive: boolean, isUpdating: boolean) => {
    return {
      switch: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
        isUpdating ? 'opacity-50' : ''
      } ${isActive ? 'bg-blue-500' : 'bg-gray-200'}`,
      toggle: `inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
        isActive ? 'translate-x-6' : 'translate-x-1'
      }`
    };
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
          {localRequisites.map((requisite) => {
            const buyStyles = getSwitchStyles(requisite.can_buy === true, updating === requisite.id);
            const sellStyles = getSwitchStyles(requisite.can_sell === true, updating === requisite.id);

            return (
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
                    className={buyStyles.switch}
                  >
                    <span className={buyStyles.toggle} />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    onClick={() => handleDirectionToggle(requisite.id, 'can_sell', requisite.can_sell)}
                    className={sellStyles.switch}
                  >
                    <span className={sellStyles.toggle} />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(requisite.created_at), 'dd.MM.yyyy HH:mm')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RequisitesTable;