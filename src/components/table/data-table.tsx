import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type PaginationState,
  type RowSelectionState,
} from '@tanstack/react-table'
import { IconLoader } from '@tabler/icons-react'
import {
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table'
import { TablePagination } from './table-pagination'
import './data-table.css'

// 自定义分页配置接口
interface CustomPaginationConfig {
  pageSize: number
  hasNext: boolean
  hasPrevious: boolean
  onPageSizeChange: (newSize: number) => void
  onPrevPage: () => void
  onNextPage: () => void
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  loading?: boolean
  showPagination?: boolean
  pageSizeOptions?: number[]
  initialPageSize?: number
  onRowSelectionChange?: (selectedRows: TData[]) => void
  onPaginationChange?: (pagination: PaginationState) => void
  pagination?: CustomPaginationConfig  // 新增：自定义分页配置
  emptyMessage?: string
  loadingMessage?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  showPagination = true,
  pageSizeOptions = [10, 20, 50, 100, 200],
  initialPageSize = 50,
  onRowSelectionChange,
  onPaginationChange,
  pagination: customPagination,
  emptyMessage = '暂无数据',
  loadingMessage = '加载中...',
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  })

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      setRowSelection(updater)
      if (onRowSelectionChange) {
        const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater
        const selectedRows = Object.keys(newSelection)
          .filter((key) => newSelection[key])
          .map((key) => data[parseInt(key)])
        onRowSelectionChange(selectedRows)
      }
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater
      setPagination(newPagination)
      if (onPaginationChange) {
        onPaginationChange(newPagination)
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className={`flex flex-col gap-4 ${showPagination ? 'h-full' : ''}`}>
      {/* 表格容器 */}
      <div className={`rounded-lg border ${showPagination ? 'flex-1 min-h-0 overflow-auto data-table-scroll' : ''}`}>
        <table className="w-full caption-bottom text-sm table-fixed">
          <thead className="bg-muted sticky top-0 z-10 [&_tr]:border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <IconLoader className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">{loadingMessage}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {showPagination && (
        <TablePagination 
          table={table} 
          pageSizeOptions={pageSizeOptions}
          customPagination={customPagination}
        />
      )}
    </div>
  )
}
