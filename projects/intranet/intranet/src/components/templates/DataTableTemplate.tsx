import React from 'react';
import { TEMPLATE_STYLES, combineClasses } from '../../constants/templateStyles';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableTemplateProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTableTemplate<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data found',
  className,
}: DataTableTemplateProps<T>) {
  if (loading) {
    return (
      <div className={TEMPLATE_STYLES.tables.container}>
        <div className={TEMPLATE_STYLES.states.loading}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={TEMPLATE_STYLES.tables.container}>
        <div className={TEMPLATE_STYLES.states.empty}>
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={combineClasses(TEMPLATE_STYLES.tables.container, className)}>
      <table className={TEMPLATE_STYLES.tables.table}>
        <thead className={TEMPLATE_STYLES.tables.header}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={combineClasses(
                  TEMPLATE_STYLES.tables.headerCell,
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={TEMPLATE_STYLES.tables.body}>
          {data.map((item, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={combineClasses(
                    TEMPLATE_STYLES.tables.cell,
                    TEMPLATE_STYLES.tables.cellText,
                    column.className
                  )}
                >
                  {column.render
                    ? column.render(item)
                    : item[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}