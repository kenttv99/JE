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
    useColumnOrder
  ) as TableInstance<Order> & { setColumnOrder: (order: string[]) => void };

  const handleColumnOrderChange = (newOrder: string[]) => {
    setColumnOrder(newOrder);
  };

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="columnOrder" className="block text-sm font-medium text-gray-700">
          Change Column Order:
        </label>
        <input
          type="text"
          id="columnOrder"
          name="columnOrder"
          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          placeholder="Enter column order (comma-separated)"
          onBlur={(e) => handleColumnOrderChange(e.target.value.split(','))}
        />
      </div>
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-100">
            {headerGroups.map((headerGroup: HeaderGroup<Order>) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column: ColumnInstance<Order>) => (
                  <th
                    {...column.getHeaderProps()}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r"
                  >
                    {column.render('Header')}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
            {rows.map((row: Row<Order>) => {
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersTable;