import React from 'react';
import { Column } from './ColumnManager';

interface DynamicTableProps<T = Record<string, unknown>> {
  columns: Column[];
  data: T[];
  renderCell: (row: T, column: Column) => React.ReactNode;
  renderActions?: (row: T) => React.ReactNode;
}

const DynamicTable = <T extends { system_id?: string | number; id?: string | number }>({ columns, data, renderCell, renderActions }: DynamicTableProps<T>) => {
  const visibleColumns = columns.filter(col => col.visible);
  
  return (
    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {visibleColumns.map((column, index) => (
                <th
                  key={column.key}
                  className={`${
                    index === 0 ? 'sticky left-0 z-10 bg-gray-50' : ''
                  } px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}
                >
                  {column.label}
                </th>
              ))}
              {renderActions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row) => (
              <tr key={row.system_id || row.id} className="hover:bg-gray-50">
                {visibleColumns.map((column, index) => (
                  <td
                    key={column.key}
                    className={`${
                      index === 0 ? 'sticky left-0 z-10 bg-white hover:bg-gray-50' : ''
                    } px-6 py-4 whitespace-nowrap text-sm ${
                      column.key === 'principal_name' ? 'font-medium text-gray-900' : 'text-gray-900'
                    }`}
                  >
                    {renderCell(row, column)}
                  </td>
                ))}
                {renderActions && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {renderActions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DynamicTable;