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

interface Order {
  id: string;
  detailsType: string;
  detailsNumber: string;
  createdAt: string;
  status: string;
}

interface OrdersTableProps {
  orders: Order[];
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders }) => {
  const data = useMemo(() => orders, [orders]);

  const columns = useMemo<Column<Order>[]>(
    () => [
      { Header: 'ID', accessor: 'id' },
      { Header: 'Тип реквизитов', accessor: 'detailsType' },
      { Header: 'Номер реквизита', accessor: 'detailsNumber' },
      { Header: 'Дата создания', accessor: 'createdAt' },
      {
        Header: 'Таймер',
        accessor: 'timer' as keyof Order,
        Cell: ({ row }: CellProps<Order>) => <span>{/* Timer implementation */}</span>,
      },
      {
        Header: 'Отмена',
        accessor: 'cancel' as keyof Order,
        Cell: ({ row }: CellProps<Order>) => <button>Отменить</button>,
      },
      {
        Header: 'Подтверждение',
        accessor: 'confirm' as keyof Order,
        Cell: ({ row }: CellProps<Order>) => <button>Подтвердить</button>,
      },
      {
        Header: 'Тикеты',
        accessor: 'tickets' as keyof Order,
        Cell: ({ row }: CellProps<Order>) => <span>{/* Tickets implementation */}</span>,
      },
      { Header: 'Статус', accessor: 'status' },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    setColumnOrder,
  } = useTable<Order>(
    { columns, data },
    useColumnOrder,
  ) as TableInstance<Order> & { setColumnOrder: (order: string[]) => void };

  const handleColumnOrderChange = (newOrder: string[]) => {
    setColumnOrder(newOrder);
  };

  const DragableColumnHeader = ({ column, index }: { column: ColumnInstance<Order>; index: number }) => {
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
            {headerGroups.map((headerGroup: HeaderGroup<Order>) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column: ColumnInstance<Order>, index: number) => (
                  <DragableColumnHeader key={column.id} column={column} index={index} />
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
            {rows.length > 0 ? (
              rows.map((row: Row<Order>) => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()} className="hover:bg-gray-100 transition-colors">
                    {row.cells.map((cell: Cell<Order>) => (
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