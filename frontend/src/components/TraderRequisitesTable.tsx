import React from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Requisite {
  id: number;
  payment_method: string;
  bank: string;
  req_number: string;
  fio: string;
  status: string;
  created_at: string;
}

interface RequisitesTableProps {
    requisites: any[];
    onUpdate?: (updatedRequisites: any[]) => void;
  }

const RequisitesTable: React.FC<RequisitesTableProps> = ({ requisites, onUpdate }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              МЕТОД
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              БАНК
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              НОМЕР РЕКВИЗИТА
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ФИО
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              СТАТУС
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ДАТА СОЗДАНИЯ
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {requisites.map((requisite) => (
            <tr key={requisite.id}>
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
                <span className={`px-2 py-1 text-xs rounded-full ${
                  requisite.status === 'approve' ? 'bg-green-100 text-green-800' :
                  requisite.status === 'check' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {requisite.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {format(new Date(requisite.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RequisitesTable;