import React from 'react';

interface Requisite {
  id: number;
  payment_method: string;
  bank: string;
  payment_details: string;
  status: string;
}

const TraderRequisitesTable: React.FC<{ requisites: Requisite[] }> = ({ requisites }) => {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Payment Method
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Bank
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Payment Details
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 relative">
            <span className="sr-only">Edit</span>
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {requisites.map((requisite: Requisite) => (
          <tr key={requisite.id}>
            <td className="px-6 py-4 whitespace-nowrap">
              {requisite.payment_method}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {requisite.bank}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {requisite.payment_details}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {requisite.status}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <a href="#" className="text-indigo-600 hover:text-indigo-900">
                Edit
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TraderRequisitesTable;