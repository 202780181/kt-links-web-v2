import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import {
  IconPlus,
  IconRefresh,
  IconLoader2,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'

import {
  fetchAppPageList,
  fetchDeleteApp,
  type AppItem,
  type AppPageParams,
} from '@/api/application'
import { formatTimestamp } from '@/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable } from '@/components/table'
import { DeleteConfirmButton } from '@/components/ui/delete-confirm'
import { ListPageContainer } from '@/components/list-page-warpper'
import { CreateAppDrawer } from './CreateApp'

// 应用数据接口
interface AppData {
  key: string
  appName: string
  appId: string
  appStatus: number
  appCode: string
  icon: string
  createTime: string
}

// 应用状态映射
const getAppStatusText = (status: number): string => {
  const statusMap: Record<number, string> = {
    0: '禁用',
    1: '启用'
  }
  return statusMap[status] || '未知'
}

// 删除操作组件
const DeleteAction = ({ id, name, onDeleted }: { id: string, name: string, onDeleted: () => void }) => {
  const { trigger, isMutating } = useSWRMutation('/api/sys/app/delete', fetchDeleteApp)

  const handleDelete = async () => {
    try {
      await trigger([id])
      toast.success(`应用"${name}"删除成功`)
      onDeleted()
    } catch (error) {
      console.error('删除应用失败:', error)
      toast.error('删除失败')
    }
  }

  return (
    <DeleteConfirmButton
      title="确认删除应用"
      description={`确定要删除应用"${name}"吗？此操作无法撤销。`}
      onConfirm={handleDelete}
    >
      <Button
        variant="ghost"
        size="sm"
        className="p-0 hover:text-destructive hover:underline"
        disabled={isMutating}
      >
        {isMutating ? (
          <>
            <IconLoader2 className="h-4 w-4 mr-1 animate-spin" />
            删除中...
          </>
        ) : (
          <span>删除</span>
        )}
      </Button>
    </DeleteConfirmButton>
  )
}

// 定义表格列
const createColumns = (
  onEdit: (id: string) => void,
  onDeleted: () => void
): ColumnDef<AppData>[] => [
  {
    id: 'select',
    size: 50,
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'appName',
    size: 150,
    header: '应用名称',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('appName')}</div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: 'appStatus',
    size: 80,
    header: '状态',
    cell: ({ row }) => {
      const status = row.getValue('appStatus') as number
      const statusText = getAppStatusText(status)
      return (
        <Badge 
					variant='secondary'
        >
          {statusText}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'appCode',
    size: 140,
    header: '应用编码',
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.getValue('appCode') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'icon',
    size: 80,
    header: '图标',
    cell: ({ row }) => {
      const icon = row.getValue('icon') as string
      return icon ? (
        <img
          src={icon}
          alt="应用图标"
          className="w-6 h-6 object-cover rounded"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: 'createTime',
    size: 180,
    header: '创建时间',
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.getValue('createTime')}
      </div>
    ),
  },
  {
    id: 'actions',
    size: 120,
    header: '操作',
    meta: {
      sticky: 'right'
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="p-0 hover:text-primary hover:underline"
          onClick={() => onEdit(row.original.appId)}
        >
          <span>编辑</span>
        </Button>
        <DeleteAction 
          id={row.original.appId} 
          name={row.original.appName}
          onDeleted={onDeleted} 
        />
      </div>
    ),
  },
]

export default function ApplicationPage() {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<AppItem | null>(null)

  // 分页状态
  const [pageSize, setPageSize] = useState(50)
  const [cursorId, setCursorId] = useState<string | undefined>()
  const [cursorCreateTs, setCursorCreateTs] = useState<string | undefined>()
  const [cursorType, setCursorType] = useState<string | undefined>()

  // 构建请求参数
  const params: AppPageParams = {
    size: pageSize,
    cursorId,
    cursorCreateTs,
    cursorType,
  }

  // 使用 SWR
  const { data: response, isLoading, isValidating, mutate } = useSWR(
    params,
    fetchAppPageList,
    {
      revalidateOnFocus: false,
    }
  )

  // 转换数据
  const data: AppData[] = response?.data?.data?.map((item: AppItem) => ({
    key: item.id,
    appName: item.appName,
    appId: item.id,
    appStatus: item.appStatus,
    appCode: item.appCode,
    icon: item.icon,
    createTime: formatTimestamp(item.createTs),
  })) || []

  const hasNext = response?.data?.hasNext || false
  const hasPrevious = response?.data?.hasPrevious || false
  const nextCursor = response?.data?.nextCursor || ''
  const prevCursor = response?.data?.prevCursor || ''

  // 处理刷新
  const handleRefresh = () => {
    setCursorId(undefined)
    setCursorCreateTs(undefined)
    setCursorType(undefined)
    mutate()
  }

  // 编辑应用
  const handleEdit = (id: string) => {
    const app = data.find(item => item.appId === id)
    if (app) {
      // 这里可以调用 getAppById 获取完整信息
      // 为简化，直接使用列表数据
      setEditingApp({
        id: app.appId,
        appName: app.appName,
        appCode: app.appCode,
        appStatus: app.appStatus,
        icon: app.icon,
        createTs: app.createTime,
        updateTs: app.createTime,
        additional: {}
      })
      setCreateDrawerOpen(true)
    }
  }

  // 创建/更新应用成功后的回调
  const handleSubmitSuccess = () => {
    setCreateDrawerOpen(false)
    setEditingApp(null)
    mutate()
  }

  // 处理抽屉关闭
  const handleDrawerClose = (open: boolean) => {
    setCreateDrawerOpen(open)
    if (!open) {
      setEditingApp(null)
    }
  }

  // 处理分页大小变化
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
  }

  // 处理上一页
  const handlePrevPage = () => {
    if (hasPrevious && prevCursor) {
      const [id, createTs] = prevCursor.split('_')
      setCursorId(id)
      setCursorCreateTs(createTs)
      setCursorType('up')
    }
  }

  // 处理下一页
  const handleNextPage = () => {
    if (hasNext && nextCursor) {
      const [id, createTs] = nextCursor.split('_')
      setCursorId(id)
      setCursorCreateTs(createTs)
      setCursorType('down')
    }
  }

  const columns = createColumns(handleEdit, () => mutate())

  return (
    <>
      <ListPageContainer
        toolbar={
          <div className="flex items-center justify-between">
            {/* 左侧按钮组 */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingApp(null)
                  setCreateDrawerOpen(true)
                }}
              >
                <IconPlus />
                <span>创建应用</span>
              </Button>
            </div>

            {/* 右侧刷新按钮 */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading || isValidating}
              >
                {isValidating ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IconRefresh className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        }
        gap="md"
        padding="md"
      >
        <DataTable
          columns={columns}
          data={data}
          loading={isLoading || isValidating}
          showPagination={true}
          pagination={{
            pageSize: pageSize,
            hasNext: hasNext,
            hasPrevious: hasPrevious,
            onPageSizeChange: handlePageSizeChange,
            onPrevPage: handlePrevPage,
            onNextPage: handleNextPage,
          }}
        />
      </ListPageContainer>

      {/* 创建/编辑应用抽屉 */}
      <CreateAppDrawer
        open={createDrawerOpen}
        onOpenChange={handleDrawerClose}
        onSuccess={handleSubmitSuccess}
        editingApp={editingApp}
      />
    </>
  )
}
