import { memo, useState, useRef, useEffect } from 'react';
import { FaSearch, FaChevronDown } from 'react-icons/fa';
import { createPortal } from 'react-dom';
import { SearchColumnType } from './types';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchColumn: SearchColumnType;
  setSearchColumn: (column: SearchColumnType) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchQuery, 
  setSearchQuery,
  searchColumn,
  setSearchColumn
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0, width: 0 });

  // Calculate dropdown position when it opens or window resizes
  useEffect(() => {
    function updatePosition() {
        if (buttonContainerRef.current) {
          const rect = buttonContainerRef.current.getBoundingClientRect();
          
          // Calculate the right edge position relative to the viewport
          const rightEdge = window.innerWidth - rect.right;
          const offsetX = -10; // Negative value moves dropdown to the RIGHT
          
          setDropdownPosition({
            top: rect.bottom + window.scrollY,
            right: rightEdge + offsetX, 
            width: 160 // Fixed width for the dropdown
          });
        }
      }

    if (dropdownOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [dropdownOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchBarRef.current && 
        !searchBarRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.search-dropdown-portal')
      ) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen, searchBarRef]);

  // Get display text for selected column
  const getColumnDisplayText = () => {
    switch (searchColumn) {
      case 'req_number':
        return 'Номер';
      case 'payment_method':
        return 'Метод';
      case 'bank':
        return 'Банк';
      case 'all':
        return 'Все';
      default:
        return 'Все';
    }
  };

  // Render dropdown with portal
  const renderDropdown = () => {
    if (!dropdownOpen) return null;
    
    return createPortal(
      <div 
        className="search-dropdown-portal rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 max-h-48 overflow-y-auto"
        style={{ 
          position: 'absolute',
          top: `${dropdownPosition.top + 4}px`, 
          right: `${dropdownPosition.right}px`,
          width: `${dropdownPosition.width}px`,
          zIndex: 9999
        }}
      >
        <div className="py-1" role="menu" aria-orientation="vertical">
          <button
            onClick={() => { setSearchColumn('all'); setDropdownOpen(false); }}
            className={`block w-full px-4 py-2 text-left text-sm ${searchColumn === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
            role="menuitem"
          >
            Все
          </button>
          <button
            onClick={() => { setSearchColumn('req_number'); setDropdownOpen(false); }}
            className={`block w-full px-4 py-2 text-left text-sm ${searchColumn === 'req_number' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
            role="menuitem"
          >
            Номер
          </button>
          <button
            onClick={() => { setSearchColumn('payment_method'); setDropdownOpen(false); }}
            className={`block w-full px-4 py-2 text-left text-sm ${searchColumn === 'payment_method' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
            role="menuitem"
          >
            Метод
          </button>
          <button
            onClick={() => { setSearchColumn('bank'); setDropdownOpen(false); }}
            className={`block w-full px-4 py-2 text-left text-sm ${searchColumn === 'bank' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
            role="menuitem"
          >
            Банк
          </button>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="relative w-full sm:w-64" ref={searchBarRef}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <FaSearch className="h-4 w-4 text-gray-400" />
      </div>
      
      <input
        type="text"
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-16 p-2.5"
        placeholder={`Поиск по ${getColumnDisplayText().toLowerCase()}...`}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      <div className="absolute inset-y-0 right-0 flex items-center" ref={buttonContainerRef}>
        <div className="h-full py-1 pr-1">
          <button 
            ref={buttonRef}
            type="button" 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="h-full flex items-center justify-center px-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {getColumnDisplayText()}
            <FaChevronDown className="ml-1 h-3 w-3" />
          </button>
        </div>
      </div>
      
      {renderDropdown()}
    </div>
  );
};

export default memo(SearchBar);