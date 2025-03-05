import React, { useMemo } from 'react';
import {
  useTable,
  useColumnOrder,
  Column,
  HeaderGroup,
  Row,
  Cell,
  TableInstance,
  CellProps,
  ColumnInstance,
} from 'react-table';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CountdownTimer from './CountdownTimer';  // Импортируем CountdownTimer
import { TraderOrder } from '@/types/trader';  // Используем твой интерфейс

interface OrdersTableProps {
  orders: TraderOrder[];
  onCancel: (orderId: string) => void;
  onConfirm: (orderId: string) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, onCancel, onConfirm }) => {
  const data = useMemo(() => orders, [orders]);

  const columns = useMemo<Column<TraderOrder>[]>(
    () => [
      { Header: 'ID', accessor: 'id' },
      { Header: 'ТИП', accessor: 'type' },
      {
        Header: 'ДАТА',  // Колонка для отображения даты
        id: 'dateDisplay',  // Уникальный id для этой колонки
        accessor: 'date',  // Используем поле date из TraderOrder
        Cell: ({ row }: CellProps<TraderOrder>) => new Date(row.original.date).toLocaleString('ru'),
      },
      {
        Header: 'СУММА',
        accessor: 'amount',
        Cell: ({ value }: CellProps<TraderOrder>) => `${value.toFixed(2)}`,
      },
      {
        Header: 'СТАТУС',
        accessor: 'status',
        Cell: ({ value }: { value: 'pending' | 'completed' | 'cancelled' }) => (
          <span className={`px-2 py-1 rounded text-xs font-medium
            ${value === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              value === 'completed' ? 'bg-green-100 text-green-800' :
              value === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`
          }>
            {value === 'pending' ? 'В обработке' :
             value === 'completed' ? 'Завершен' :
             value === 'cancelled' ? 'Отменен' : value}
          </span>
        ),
      },
      {
        Header: 'ВРЕМЯ ДО ИСТЕЧЕНИЯ',  // Колонка для таймера
        id: 'dateExpiration',  // Уникальный id для этой колонки
        accessor: 'date',  // Используем то же поле date из TraderOrder
        Cell: ({ row }: CellProps<TraderOrder>) => (
          <CountdownTimer 
            expiresAt={row.original.date}  // Передаем дату создания ордера как expiresAt
            orderId={row.original.id}  // Передаем orderId для отмены
          />
        ),
      },
      {
        Header: 'ОТМЕНА',
        id: 'cancel',
        Cell: ({ row }: CellProps<TraderOrder>) => (
          <button 
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
            onClick={() => onCancel(row.original.id)}
          >
            Отменить
          </button>
        ),
      },
      {
        Header: 'ПОДТВЕРЖДЕНИЕ',
        id: 'confirm',
        Cell: ({ row }: CellProps<TraderOrder>) => (
          <button 
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
            onClick={() => onConfirm(row.original.id)}
          >
            Подтвердить
          </button>
        ),
      },
    ],
    [onCancel, onConfirm]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    setColumnOrder,
  } = useTable<TraderOrder>(
    { columns, data },
    useColumnOrder,
  ) as TableInstance<TraderOrder> & { setColumnOrder: (order: string[]) => void };

  const handleColumnOrderChange = (newOrder: string[]) => {
    setColumnOrder(newOrder);
  };

  const DragableColumnHeader = ({ column, index }: { column: ColumnInstance<TraderOrder>; index: number }) => {
    const [, ref] = useDrag({
      type: 'COLUMN',
      item: { index },
    });

    const [, drop] = useDrop({
      accept: 'COLUMN',
      hover: (draggedItem: { index: number }) => {
        if (draggedItem.index !== index) {
          const newOrder = [...headerGroups[0].headers];
          const [removed] = newOrder.splice(draggedItem.index, 1);
          newOrder.splice(index, 0, removed);
          handleColumnOrderChange(newOrder.map(col => col.id as string));
          draggedItem.index = index;
        }
      },
    });

    const combinedRef = (node: HTMLTableHeaderCellElement | null) => {
      ref(node);
      drop(node);
    };

    return (
      <th {...column.getHeaderProps()} ref={combinedRef}
        className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
        {column.render('Header')}
      </th>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-100">
            {headerGroups.map((headerGroup: HeaderGroup<TraderOrder>) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column: ColumnInstance<TraderOrder>, index: number) => (
                  <DragableColumnHeader key={column.id} column={column} index={index} />
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
            {rows.length > 0 ? (
              rows.map((row: Row<TraderOrder>) => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()} className="hover:bg-gray-100 transition-colors">
                    {row.cells.map((cell: Cell<TraderOrder>) => (
                      <td
                        {...cell.getCellProps()}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r"
                      >
                        {cell.render('Cell')}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                  Нет активных ордеров
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DndProvider>
  );
};

export default OrdersTable;