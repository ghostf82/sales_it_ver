import { ReactNode } from 'react';
import { Table } from '@tanstack/react-table';
import { ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

interface DataTableProps<T> {
  table: Table<T>;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  table,
  loading = false,
  emptyMessage = 'لا توجد بيانات متاحة',
  className
}: DataTableProps<T>) {
  return (
    <div className={clsx(
      'bg-white rounded-xl shadow-lg overflow-hidden',
      className
    )}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-gray-50">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-3 sm:px-4 md:px-6 py-3 text-right text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {header.isPlaceholder ? null : (
                        <>
                          {header.column.getCanSort() && (
                            <span>
                              {{
                                asc: <ChevronUp className="w-3 h-3" />,
                                desc: <ChevronDown className="w-3 h-3" />,
                              }[header.column.getIsSorted() as string] ?? null}
                            </span>
                          )}
                          <div>
                            {header.column.columnDef.header as ReactNode}
                          </div>
                        </>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={table.getAllColumns().length} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="px-3 sm:px-4 md:px-6 py-2 sm:py-4 text-right text-xs sm:text-sm text-gray-900 whitespace-nowrap"
                    >
                      {cell.column.columnDef.cell ? cell.column.columnDef.cell(cell.getContext()) : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={table.getAllColumns().length} className="px-6 py-4 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination controls could be added here */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
        <div className="text-xs sm:text-sm text-gray-500">
          إجمالي السجلات: {table.getRowModel().rows.length}
        </div>
      </div>
    </div>
  );
}