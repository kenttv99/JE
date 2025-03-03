import { useState, useCallback, useMemo } from 'react';
import { Requisite } from '@/hooks/useTraderRequisites';
import StatusFilter from './StatusFilter';
import SearchBar from './SearchBar';
import RequisiteRow from './RequisiteRow';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { StatusType, SearchColumnType } from './types';
import { FaCaretUp, FaCaretDown } from 'react-icons/fa';

// Updated type definitions to support multi-column sorting
type SortConfig = {
  can_buy?: 'asc' | 'desc' | null;
  can_sell?: 'asc' | 'desc' | null;
};

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
  
  // Updated sorting state to support multi-column sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>({});

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

  // Updated sort handler to support multi-column sorting
  const handleSort = useCallback((field: 'can_buy' | 'can_sell') => {
    setSortConfig(prevConfig => {
      const currentDirection = prevConfig[field];
      
      // Cycle through: null -> 'asc' -> 'desc' -> null
      let nextDirection: 'asc' | 'desc' | null;
      if (!currentDirection) nextDirection = 'asc';
      else if (currentDirection === 'asc') nextDirection = 'desc';
      else nextDirection = null;
      
      return {
        ...prevConfig,
        [field]: nextDirection
      };
    });
  }, []);

  // Enhanced filtering and sorting logic with multi-column support
  const filteredAndSortedRequisites = useMemo(() => {
    // First filter by status and search query
    const filtered = requisites.filter((req) => {
      // Status filtering
      const statusMatch = 
        activeStatus === 'all' ? true : 
        activeStatus === 'active' ? req.status !== 'deleted' : 
        activeStatus === 'deleted' ? req.status === 'deleted' : true;
      
      // Search query filtering
      if (!searchQuery.trim()) return statusMatch;
      
      const query = searchQuery.toLowerCase();
      let searchMatch = false;

      switch (searchColumn) {
        case 'req_number':
          searchMatch = req.req_number.toLowerCase().includes(query);
          break;
        case 'payment_method':
          searchMatch = (req.payment_method_description || req.payment_method || '').toLowerCase().includes(query);
          break;
        case 'bank':
          searchMatch = (req.bank_description || req.bank || '').toLowerCase().includes(query);
          break;
        case 'all':
          searchMatch = 
            req.req_number.toLowerCase().includes(query) ||
            (req.payment_method_description || req.payment_method || '').toLowerCase().includes(query) ||
            (req.bank_description || req.bank || '').toLowerCase().includes(query);
          break;
        default:
          searchMatch = true;
      }
      
      return statusMatch && searchMatch;
    });

    // Sort based on the sortConfig
    if (Object.values(sortConfig).some(v => v !== null)) {
      return [...filtered].sort((a, b) => {
        // Sort first by can_buy if specified
        if (sortConfig.can_buy) {
          const valueA = a.can_buy ? 1 : 0;
          const valueB = b.can_buy ? 1 : 0;
          const compareResult = sortConfig.can_buy === 'asc' ? valueA - valueB : valueB - valueA;
          
          // If values are different for this column, return the result
          if (compareResult !== 0) return compareResult;
        }
        
        // Then sort by can_sell if specified
        if (sortConfig.can_sell) {
          const valueA = a.can_sell ? 1 : 0;
          const valueB = b.can_sell ? 1 : 0;
          return sortConfig.can_sell === 'asc' ? valueA - valueB : valueB - valueA;
        }
        
        return 0; // No changes if no sort is active
      });
    }
    
    return filtered;
  }, [requisites, activeStatus, searchQuery, searchColumn, sortConfig]);

  // Render sort indicator based on sort state
  const renderSortIndicator = (field: 'can_buy' | 'can_sell') => {
    if (!sortConfig[field]) return null;
    
    return sortConfig[field] === 'asc' 
      ? <FaCaretUp className="ml-1 inline" />
      : <FaCaretDown className="ml-1 inline" />;
  };

  return (
    <div>
      {/* Table container with controls */}
      <div className="mb-4">
        {/* Status Filter aligned left */}
        <div className="flex justify-between items-center mb-4">
          <StatusFilter activeStatus={activeStatus} onStatusChange={setActiveStatus} />
          
          {/* Search control aligned right */}
          <SearchBar 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery}
            searchColumn={searchColumn}
            setSearchColumn={setSearchColumn} 
          />
        </div>
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
                МЕТОД
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                БАНК
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                НОМЕР
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ФИО
              </th>
              {/* Clickable PayIn header */}
              <th 
                onClick={() => handleSort('can_buy')}
                className="px-6 py-3 bg-gray-50 text-center text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                style={{ color: sortConfig.can_buy ? '#3B82F6' : '#6B7280' }}
                title="Click to sort by Pay In"
              >
                Pay In {renderSortIndicator('can_buy')}
              </th>
              {/* Clickable PayOut header */}
              <th 
                onClick={() => handleSort('can_sell')}
                className="px-6 py-3 bg-gray-50 text-center text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                style={{ color: sortConfig.can_sell ? '#3B82F6' : '#6B7280' }}
                title="Click to sort by Pay Out"
              >
                Pay Out {renderSortIndicator('can_sell')}
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                СОЗДАН
              </th>
              <th className="px-6 py-3 bg-gray-50">
                <span className="sr-only">ДЕЙСТВИЯ</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedRequisites.length > 0 ? (
              filteredAndSortedRequisites.map((requisite, index) => (
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
                    `Нет результатов для "${searchQuery}" в "${getRussianColumnDisplayText(searchColumn)}"` : 
                    'Реквизитов не найдено'
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
      return 'Number';
    case 'payment_method':
      return 'Method';
    case 'bank':
      return 'Bank';
    case 'all':
      return 'All fields';
    default:
      return 'All fields';
  }
};

// Helper function to get Russian display name for search column
const getRussianColumnDisplayText = (column: SearchColumnType): string => {
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