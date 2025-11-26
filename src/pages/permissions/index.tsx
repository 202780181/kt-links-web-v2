import { useState, useEffect, useCallback } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import {
  IconPlus,
  IconRefresh,
  IconSearch
} from '@tabler/icons-react'
import { toast } from 'sonner'

import {
  getAuthCodePageList,
  deleteAuthCodes,
  type AuthCodeItem,
} from '@/api/authCode'
import { formatTimestamp } from '@/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/table'
import { DeleteConfirmButton } from '@/components/ui/delete-confirm'
import { ListPageContainer } from '@/components/list-page-warpper'
import { CreatePermissionDrawer } from './create-permission-drawer'

// 定义表格列
const createColumns = (
  onEdit: (item: AuthCodeItem) => void,
  onDelete: (id: string) => void
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
        <DeleteConfirmButton
          title="删除权限码"
          description="确定要删除这个权限码吗？此操作无法撤销。"
          onConfirm={() => onDelete(row.original.id)}
        >
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            删除
          </Button>
        </DeleteConfirmButton>
      </div>
    ),
    meta: {
      sticky: 'right', // 固定在右侧
    },
  },
]

const PermissionsPage = () => {
  const [data, setData] = useState<AuthCodeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [pageSize, setPageSize] = useState(50)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [nextCursor, setNextCursor] = useState('')
  const [prevCursor, setPrevCursor] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AuthCodeItem | null>(null)

  // 加载权限码列表
  const loadAuthCodes = useCallback(async (
    cursorId?: string,
    cursorCreateTs?: string,
    cursorType?: string
  ) => {
    setLoading(true)
    try {
      const response = await getAuthCodePageList({
        size: pageSize,
        cursorId,
        cursorCreateTs,
        cursorType,
        name_like: searchName || undefined,
      })

      if (response.code === 0 && response.data) {
        setData(response.data.data)
        setHasNext(response.data.hasNext)
        setHasPrevious(response.data.hasPrevious)
        setNextCursor(response.data.nextCursor)
        setPrevCursor(response.data.prevCursor)
      }
    } catch (error) {
      console.error('加载权限码列表失败:', error)
      toast.error('加载权限码列表失败')
    } finally {
      setLoading(false)
    }
  }, [pageSize, searchName])

  // 初始加载
  useEffect(() => {
    loadAuthCodes()
  }, [loadAuthCodes])

  // 处理搜索
  const handleSearch = () => {
    loadAuthCodes()
  }

  // 处理刷新
  const handleRefresh = () => {
    setSearchName('')
    loadAuthCodes()
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

  // 处理删除
  const handleDelete = async (id: string) => {
    try {
      const response = await deleteAuthCodes([id])
      if (response.code === 0) {
        toast.success('删除成功')
        loadAuthCodes()
      } else {
        toast.error(response.message || '删除失败')
      }
    } catch (error) {
      console.error('删除权限码失败:', error)
      toast.error('删除权限码失败')
    }
  }

  // 处理上一页
  const handlePrevPage = () => {
    if (hasPrevious && prevCursor) {
      const [cursorId, cursorCreateTs] = prevCursor.split('_')
      loadAuthCodes(cursorId, cursorCreateTs, 'up')
    }
  }

  // 处理下一页
  const handleNextPage = () => {
    if (hasNext && nextCursor) {
      const [cursorId, cursorCreateTs] = nextCursor.split('_')
      loadAuthCodes(cursorId, cursorCreateTs, 'down')
    }
  }

  // 处理页面大小变化
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
  }

  // 处理抽屉提交
  const handleDrawerSubmit = () => {
    loadAuthCodes()
  }

  const columns = createColumns(handleEdit, handleDelete)

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
            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <IconRefresh className="h-4 w-4" />
            </Button>
          </div>
        </div>
      }
    >
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
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
