import { useState, useCallback, useMemo } from 'react';
import { Requisite } from '@/hooks/useTraderRequisites';
import StatusFilter from './StatusFilter';
import SearchBar from './SearchBar';
import RequisiteRow from './RequisiteRow';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { StatusType, SearchColumnType } from './types';

interface RequisitesTableProps {
  requisites: Requisite[];
  onDelete: (id: number) => Promise<void>;
  onToggleProperty: (id: number, property: 'can_buy' | 'can_sell', newValue: boolean) => Promise<void>;
}

const TraderRequisitesTable: React.FC<RequisitesTableProps> = ({ requisites, onDelete, onToggleProperty }) => {
  const [updating, setUpdating] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number | null; isOpen: boolean }>({
    id: null,
    isOpen: false,
  });
  const [activeStatus, setActiveStatus] = useState<StatusType>('active');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchColumn, setSearchColumn] = useState<SearchColumnType>('req_number');

  const handleEdit = useCallback((id: number) => {
    alert(`Edit requisite with ID: ${id}`);
  }, []);

  const openDeleteConfirmation = useCallback((id: number) => {
    setDeleteConfirmation({ id, isOpen: true });
  }, []);

  const closeDeleteConfirmation = useCallback(() => {
    setDeleteConfirmation({ id: null, isOpen: false });
  }, []);

  const handleSoftDelete = useCallback(async (id: number) => {
    closeDeleteConfirmation();
    try {
      setUpdating(id);
      await onDelete(id);
    } catch (error) {
      console.error('Failed to delete requisite:', error);
    } finally {
      setUpdating(null);
    }
  }, [closeDeleteConfirmation, onDelete]);

  const handleToggle = useCallback(async (
    id: number,
    property: 'can_buy' | 'can_sell',
    currentValue: boolean,
    inactive: boolean
  ) => {
    if (inactive) return;
    try {
      setUpdating(id);
      await onToggleProperty(id, property, !currentValue);
    } catch (error) {
      console.error(`Failed to toggle ${property}:`, error);
    } finally {
      setUpdating(null);
    }
  }, [onToggleProperty]);

  // Enhanced filtering logic with column-specific search
  const filteredRequisites = useMemo(() => {
    return requisites.filter((req) => {
      // First filter by status
      const statusMatch = 
        activeStatus === 'all' ? true : 
        activeStatus === 'active' ? req.status !== 'deleted' : 
        activeStatus === 'deleted' ? req.status === 'deleted' : true;
      
      // Then filter by search query based on selected column
      if (!searchQuery.trim()) return statusMatch;
      
      const query = searchQuery.toLowerCase();
      let searchMatch = false;

      switch (searchColumn) {
        case 'req_number':
          searchMatch = req.req_number.toLowerCase().includes(query);
          break;
        case 'payment_method':
          searchMatch = req.payment_method_description.toLowerCase().includes(query); // Используем описание
          break;
        case 'bank':
          searchMatch = req.bank_description.toLowerCase().includes(query); // Используем описание
          break;
        case 'all':
          searchMatch = 
            req.req_number.toLowerCase().includes(query) ||
            req.payment_method_description.toLowerCase().includes(query) || // Используем описание
            req.bank_description.toLowerCase().includes(query); // Используем описание
          break;
        default:
          searchMatch = true;
      }
      
      return statusMatch && searchMatch;
    });
  }, [requisites, activeStatus, searchQuery, searchColumn]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        {/* Status Filter Buttons */}
        <StatusFilter activeStatus={activeStatus} onStatusChange={setActiveStatus} />
        
        {/* Enhanced Search Input with Column Selection */}
        <SearchBar 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery}
          searchColumn={searchColumn}
          setSearchColumn={setSearchColumn} 
        />
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
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
              <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pay In
              </th>
              <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pay Out
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата создания
              </th>
              <th className="px-6 py-3 bg-gray-50">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRequisites.length > 0 ? (
              filteredRequisites.map((requisite, index) => (
                <RequisiteRow
                  key={requisite.id}
                  requisite={requisite}
                  index={index}
                  updating={updating === requisite.id}
                  onEdit={handleEdit}
                  onDelete={openDeleteConfirmation}
                  onToggle={handleToggle}
                />
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                  {searchQuery ? 
                    `По запросу "${searchQuery}" в поле "${getColumnDisplayText(searchColumn)}" ничего не найдено` : 
                    'Нет доступных реквизитов'
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        onDelete={() => handleSoftDelete(deleteConfirmation.id || 0)}
      />
    </div>
  );
};

// Helper function to get display name for search column
const getColumnDisplayText = (column: SearchColumnType): string => {
  switch (column) {
    case 'req_number':
      return 'Номер';
    case 'payment_method':
      return 'Метод';
    case 'bank':
      return 'Банк';
    case 'all':
      return 'Все поля';
    default:
      return 'Все поля';
  }
};

export default TraderRequisitesTable;