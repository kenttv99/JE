import { useState } from 'react';
import { format } from 'date-fns';
import { FaPen, FaTimes } from 'react-icons/fa'; // Import icons
import useTraderRequisites, { Requisite } from '@/hooks/useTraderRequisites';

interface RequisitesTableProps {
  requisites: Requisite[];
}

const RequisitesTable: React.FC<RequisitesTableProps> = ({ requisites }) => {
  const [updating, setUpdating] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number | null, isOpen: boolean }>({ id: null, isOpen: false });
  const { updateRequisiteStatus, loading } = useTraderRequisites();

  const handleEdit = (id: number) => {
    // Placeholder for edit functionality
    alert(`Edit requisite with ID: ${id}`);
  };

  const openDeleteConfirmation = (id: number) => {
    setDeleteConfirmation({ id: id, isOpen: true });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({ id: null, isOpen: false });
  };

  const handleSoftDelete = async (id: number) => {
    closeDeleteConfirmation();
    try {
      setUpdating(id);
      await updateRequisiteStatus(id, 'deleted');
    } catch (error) {
      console.error('Failed to delete requisite:', error);
      // Revert to original requisites on error - consider a more user-friendly error message
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
             <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 bg-gray-50">
              <span className="sr-only">Actions</span>
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {requisite.can_buy ? 'Yes' : 'No'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {requisite.can_sell ? 'Yes' : 'No'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {format(new Date(requisite.created_at), 'dd.MM.yyyy HH:mm')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {requisite.status || 'active'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  {requisite.status === 'deleted' ? (
                    <span className="text-gray-500">{requisite.status}</span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(requisite.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FaPen className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </button>
                      <button
                        onClick={() => openDeleteConfirmation(requisite.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTimes className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Responsive Modal Container */}
            <div
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-headline"
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    {/* Heroicon name: outline/exclamation */}
                    <svg
                      className="h-6 w-6 text-red-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                      Confirm Deletion
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to mark this requisite as deleted? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Responsive Buttons */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => handleSoftDelete(deleteConfirmation.id || 0)}
                  disabled={loading}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={closeDeleteConfirmation}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequisitesTable;