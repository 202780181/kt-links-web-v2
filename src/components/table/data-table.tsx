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
import { CustomScrollbar } from '../custom-scrollbar'

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
  pagination?: CustomPaginationConfig  // 自定义分页配置
  emptyMessage?: string
  loadingMessage?: string
  tableHeight?: string | number  // 自定义表格高度，如 '500px' 或 500
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
  tableHeight,
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

  // 格式化高度值
  const heightStyle = tableHeight 
    ? { height: typeof tableHeight === 'number' ? `${tableHeight}px` : tableHeight }
    : undefined

  return (
    <div className="flex flex-col gap-4" style={heightStyle}>
      {/* 表格容器 - 如果设置了高度则使用自定义滚动条 */}
      {tableHeight ? (
        <CustomScrollbar height="100%" className="flex-1 min-h-0" showShadows={false}>
          <div className="rounded-lg border">
            <table className="w-full caption-bottom text-sm table-fixed">
              <thead className="bg-muted sticky top-0 z-20 [&_tr]:border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as any
                  const isSticky = meta?.sticky === 'right'
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{ width: header.getSize() }}
                      className={isSticky ? 'sticky right-0 bg-muted z-30 shadow-[-8px_0_16px_-4px_rgba(0,0,0,0.2)]' : ''}
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
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as any
                    const isSticky = meta?.sticky === 'right'
                    return (
                      <TableCell
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className={isSticky ? 'sticky right-0 bg-background z-15 shadow-[-8px_0_16px_-4px_rgba(0,0,0,0.2)]' : ''}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    )
                  })}
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
        </CustomScrollbar>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full caption-bottom text-sm table-fixed">
            <thead className="bg-muted sticky top-0 z-20 [&_tr]:border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as any
                    const isSticky = meta?.sticky === 'right'
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{ width: header.getSize() }}
                        className={isSticky ? 'sticky right-0 bg-muted z-30 shadow-[-8px_0_16px_-4px_rgba(0,0,0,0.2)]' : ''}
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
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as any
                      const isSticky = meta?.sticky === 'right'
                      return (
                        <TableCell
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                          className={isSticky ? 'sticky right-0 bg-background z-15 shadow-[-8px_0_16px_-4px_rgba(0,0,0,0.2)]' : ''}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      )
                    })}
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
      )}

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
