import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { DataTable } from '@/components/table/data-table'
import { 
	getAppPageList, 
	type AppItem, 
	type AppPageParams
} from '@/api/application'
import { toast } from 'sonner'
import { formatTimestamp } from '@/utils'
import { Badge } from '@/components/ui/badge'
import type { ColumnDef } from '@tanstack/react-table'

interface AppSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (app: AppItem | null) => void
}

export function AppSelector({ 
  open, 
  onOpenChange, 
  onSelect
}: AppSelectorProps) {
  const [appList, setAppList] = useState<AppItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [tableHeight, setTableHeight] = useState<number>(400)
  const [resetSelection, setResetSelection] = useState(0)
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // 获取应用状态文本
  const getAppStatusText = (status: number): string => {
    const statusMap: Record<number, string> = {
      0: '禁用',
      1: '启用',
    }
    return statusMap[status] || '未知'
  }
  // 定义表格列
  const columns: ColumnDef<AppItem>[] = [
    {
      id: 'select',
      header: '',
      size: 60,
      cell: ({ row, table }) => (
        <div className="flex items-center justify-center">
          <input
            type="radio"
            name="selectedApp"
            checked={row.getIsSelected()}
            onChange={() => {
              // 清除所有选择
              table.toggleAllRowsSelected(false)
              // 选中当前行
              row.toggleSelected(true)
              setSelectedAppId(row.original.id)
            }}
            className="h-4 w-4"
          />
        </div>
      ),
    },
    {
      accessorKey: 'appName',
      header: '应用名称',
      size: 200,
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('appName')}</span>
      ),
    },
    {
      accessorKey: 'appCode',
      header: '应用编码',
      size: 150,
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue('appCode')}</span>
      ),
    },
    {
      accessorKey: 'appStatus',
      header: '状态',
      size: 100,
      cell: ({ row }) => {
        const status = row.getValue('appStatus') as number
        return (
					<Badge variant='secondary'>
            {getAppStatusText(status)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'createTs',
      header: '创建时间',
      size: 160,
      cell: ({ row }) => {
        const createTs = row.getValue('createTs') as string
        return (
          <span className="text-sm text-muted-foreground">
            {formatTimestamp(createTs)}
          </span>
        )
      },
    },
  ]

  // 获取应用列表
  const fetchAppList = async () => {
    setLoading(true)
    try {
      const params: AppPageParams = {
        size: 100, // 获取更多数据用于选择
      }
      
      const response = await getAppPageList(params)
      if (response.code === 0 && response.data) {
        // 只显示启用状态的应用
        const enabledApps = response.data.data.filter(app => app.appStatus === 1)
        setAppList(enabledApps)
      } else {
        toast.error(response.msg || '获取应用列表失败')
      }
    } catch (error) {
      console.error('获取应用列表失败:', error)
      toast.error('获取应用列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 当对话框打开时获取数据
  useEffect(() => {
    if (open) {
      fetchAppList()
      setSelectedAppId(null)
      setResetSelection(prev => prev + 1) // 每次打开时重置表格
    }
  }, [open])

  // 计算表格容器高度
  useEffect(() => {
    if (open) {
      const updateHeight = () => {
        if (tableContainerRef.current) {
          const height = tableContainerRef.current.offsetHeight
          console.log('容器高度:', height)
          if (height > 0) {
            setTableHeight(height - 10) // 减去一些padding
          }
        }
      }
      
      // 延迟执行以确保DOM已渲染
      const timer = setTimeout(updateHeight, 200)
      
      // 监听窗口大小变化
      window.addEventListener('resize', updateHeight)
      
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', updateHeight)
      }
    }
  }, [open])

  // 确认选择
  const handleConfirm = () => {
    if (selectedAppId) {
      const selectedApp = appList.find(app => app.id === selectedAppId)
      onSelect(selectedApp || null)
    } else {
      onSelect(null)
    }
    onOpenChange(false)
  }

  // 清空选择
  const handleClear = () => {
    setSelectedAppId(null)
    onSelect(null)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[800px] sm:max-w-[800px] flex flex-col pr-4 h-full">
        <SheetHeader className="pb-4 shrink-0">
          <SheetTitle>选择应用</SheetTitle>
          <SheetDescription>
            从下面的列表中选择一个应用
          </SheetDescription>
        </SheetHeader>

        <div ref={tableContainerRef} className="flex-1">
          <DataTable
            key={resetSelection}
            columns={columns}
            data={appList}
            loading={loading}
            tableHeight={tableHeight}
            enableRowClick={true}
            onRowSelectionChange={(selectedRows) => {
              if (selectedRows.length > 0) {
                setSelectedAppId(selectedRows[0].id)
              } else {
                setSelectedAppId(null)
              }
            }}
          />
        </div>

        <div className="flex justify-between pt-3 border-t pb-3 shrink-0">
          <Button 
            variant="outline" 
            onClick={handleClear}
          >
            清空选择
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!selectedAppId}
            >
              确认选择
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}