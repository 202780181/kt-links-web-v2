import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import {
  IconPlus,
  IconRefresh,
  IconSearch,
  IconLoader2
} from '@tabler/icons-react'
import useSWR from 'swr'

import { toast } from 'sonner'
import useSWRMutation from 'swr/mutation'
import {
  fetchAuthCodePageList,
  fetchDeleteAuthCode,
  type AuthCodeItem,
  type AuthCodePageParams,
} from '@/api/permissions'
import { formatTimestamp } from '@/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/table'
import { ListPageContainer } from '@/components/list-page-warpper'
import { DeleteConfirmButton } from '@/components/ui/delete-confirm'
import { CreatePermissionDrawer } from './CreatePermission'

// 删除操作组件
const DeleteAction = ({ id, onDeleted }: { id: string, onDeleted: () => void }) => {
  const { trigger, isMutating } = useSWRMutation('/api/auth/a-code/delete', fetchDeleteAuthCode)

  const handleDelete = async () => {
    try {
      await trigger([id])
      toast.success('删除成功')
      onDeleted()
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败')
    }
  }

  return (
    <DeleteConfirmButton
      title="删除权限码"
      description="确定要删除这个权限码吗？此操作无法撤销。"
      onConfirm={handleDelete}
    >
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-destructive hover:text-destructive"
        disabled={isMutating}
      >
        {isMutating ? (
          <>
            <IconLoader2 className="h-4 w-4 mr-1 animate-spin" />
            删除中...
          </>
        ) : (
          '删除'
        )}
      </Button>
    </DeleteConfirmButton>
  )
}

// 定义表格列
const createColumns = (
  onEdit: (item: AuthCodeItem) => void,
  onDeleted: () => void
): ColumnDef<AuthCodeItem>[] => [
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
    accessorKey: 'name',
    size: 150,
    header: '权限码名称',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('name')}</div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: 'authCodeStatus',
    size: 80,
    header: '状态',
    cell: ({ row }) => {
      const status = row.getValue('authCodeStatus') as number
      return (
        <Badge variant='secondary'>
          {status === 1 ? '启用' : '禁用'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'moduleCode',
    size: 120,
    header: '模块码',
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.getValue('moduleCode') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'groupCode',
    size: 120,
    header: '组码',
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.getValue('groupCode') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'actionCode',
    size: 120,
    header: '动作码',
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.getValue('actionCode') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'category',
    size: 100,
    header: '类别',
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.getValue('category') || '-'}
      </Badge>
    ),
  },
  {
    accessorKey: 'defaultEffect',
    size: 100,
    header: '默认效果',
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.getValue('defaultEffect') || '-'}
      </Badge>
    ),
  },
  {
    accessorKey: 'autoAssign',
    size: 100,
    header: '自动授权',
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.getValue('autoAssign') || '-'}
      </Badge>
    ),
  },
  {
    accessorKey: 'createTs',
    size: 160,
    header: '创建时间',
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatTimestamp(row.getValue('createTs'))}
      </div>
    ),
  },
  {
    id: 'actions',
    size: 120,
    header: () => <div className="text-center">操作</div>,
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(row.original)}
        >
          编辑
        </Button>
        <DeleteAction id={row.original.id} onDeleted={onDeleted} />
      </div>
    ),
    meta: {
      sticky: 'right', // 固定在右侧
    },
  },
]

const PermissionsPage = () => {
  const [searchName, setSearchName] = useState('')
  const [pageSize, setPageSize] = useState(50)
  const [cursorId, setCursorId] = useState<string | undefined>()
  const [cursorCreateTs, setCursorCreateTs] = useState<string | undefined>()
  const [cursorType, setCursorType] = useState<string | undefined>()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AuthCodeItem | null>(null)

  // 构建请求参数
  const params: AuthCodePageParams = {
    size: pageSize,
    cursorId,
    cursorCreateTs,
    cursorType,
    name_like: searchName || undefined,
  }

  // 使用 SWR (Dify Pattern)
  const { data: response, isLoading, isValidating, mutate } = useSWR(
    params,
    fetchAuthCodePageList,
    {
      revalidateOnFocus: false,
    }
  )

  const data = response?.data?.data || []
  const hasNext = response?.data?.hasNext || false
  const hasPrevious = response?.data?.hasPrevious || false
  const nextCursor = response?.data?.nextCursor || ''
  const prevCursor = response?.data?.prevCursor || ''

  // 处理搜索
  const handleSearch = () => {
    setCursorId(undefined)
    setCursorCreateTs(undefined)
    setCursorType(undefined)
    mutate()
  }

  // 处理刷新
  const handleRefresh = () => {
    setSearchName('')
    setCursorId(undefined)
    setCursorCreateTs(undefined)
    setCursorType(undefined)
    mutate()
  }

  // 处理添加
  const handleAdd = () => {
    setEditingItem(null)
    setDrawerOpen(true)
  }

  // 处理编辑
  const handleEdit = (item: AuthCodeItem) => {
    setEditingItem(item)
    setDrawerOpen(true)
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

  // 处理页面大小变化
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
  }

  // 处理抽屉提交
  const handleDrawerSubmit = () => {
    mutate()
  }

  const columns = createColumns(handleEdit, () => mutate())

  return (
    <>
    <ListPageContainer
      toolbar={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleAdd}>
            <IconPlus className="h-4 w-4"/>
            <span className="hidden lg:inline">添加</span>
          </Button>
          <div className="flex-1 flex items-center gap-2 justify-end">
            <div className="relative w-64">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索权限码名称"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
                className="pl-9"
              />
            </div>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading || isValidating}>
              {isValidating ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                <IconRefresh className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      }
    >
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading || isValidating}
        showPagination={true}
        pageSizeOptions={[10, 20, 50, 100, 200]}
        pagination={{
          pageSize,
          hasNext,
          hasPrevious,
          onPageSizeChange: handlePageSizeChange,
          onPrevPage: handlePrevPage,
          onNextPage: handleNextPage,
        }}
      />
    </ListPageContainer>

    {/* 新增/编辑权限码抽屉 */}
    <CreatePermissionDrawer
      open={drawerOpen}
      onOpenChange={setDrawerOpen}
      onSubmit={handleDrawerSubmit}
      editData={editingItem}
    />
    </>
  )
}

export default PermissionsPage
