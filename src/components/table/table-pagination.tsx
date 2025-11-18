import type { Table } from '@tanstack/react-table'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// 自定义分页配置接口
interface CustomPaginationConfig {
  pageSize: number
  hasNext: boolean
  hasPrevious: boolean
  onPageSizeChange: (newSize: number) => void
  onPrevPage: () => void
  onNextPage: () => void
}

interface TablePaginationProps<TData> {
  table: Table<TData>
  pageSizeOptions?: number[]
  customPagination?: CustomPaginationConfig
}

export function TablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 50, 100, 200],
  customPagination,
}: TablePaginationProps<TData>) {
  // 如果有自定义分页配置，使用自定义逻辑
  if (customPagination) {
    return (
      <div className="flex items-center justify-between px-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} /{' '}
          {table.getFilteredRowModel().rows.length} 行已选择
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              每页行数
            </Label>
            <Select
              value={`${customPagination.pageSize}`}
              onValueChange={(value) => {
                customPagination.onPageSizeChange(Number(value))
              }}
            >
            <SelectTrigger size="sm" className="w-20" id="rows-per-page">
              <SelectValue
                placeholder={table.getState().pagination.pageSize}
              />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={customPagination.onPrevPage}
            disabled={!customPagination.hasPrevious}
          >
            <span className="sr-only">上一页</span>
            <IconChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={customPagination.onNextPage}
            disabled={!customPagination.hasNext}
          >
            <span className="sr-only">下一页</span>
            <IconChevronRight />
          </Button>
        </div>
      </div>
    </div>
    )
  }
  
  // 默认分页逻辑（使用 tanstack table 的内置分页）
  return (
    <div className="flex items-center justify-between px-4">
      <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
        {table.getFilteredSelectedRowModel().rows.length} /{' '}
        {table.getFilteredRowModel().rows.length} 行已选择
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            每页行数
          </Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger size="sm" className="w-20" id="rows-per-page">
              <SelectValue
                placeholder={table.getState().pagination.pageSize}
              />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          第 {table.getState().pagination.pageIndex + 1} 页 / 共{' '}
          {table.getPageCount()} 页
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">第一页</span>
            <IconChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">上一页</span>
            <IconChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">下一页</span>
            <IconChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">最后一页</span>
            <IconChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  )
}
