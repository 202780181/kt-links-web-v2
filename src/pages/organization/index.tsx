import { useState } from 'react'
import { useNavigate } from 'react-router'
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
  fetchOrgPageList,
  fetchDeleteOrg,
  getOrgTypeText,
  type OrgItem,
  type OrgPageParams,
} from '@/api/organization'
import { CreateOrgDrawer } from './CreateOrg'
import { formatTimestamp } from '@/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/table'
import { ListPageContainer } from '@/components/list-page-warpper'
import { DeleteConfirmButton } from '@/components/ui/delete-confirm'

// 删除操作组件
const DeleteAction = ({ id, onDeleted }: { id: string, onDeleted: () => void }) => {
  const { trigger, isMutating } = useSWRMutation('/api/sys/org/delete', fetchDeleteOrg)

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
      title="删除组织"
      description="确定要删除这个组织吗？此操作无法撤销。"
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
  onNameClick: (orgItem: OrgItem) => void,
  onEdit: (item: OrgItem) => void,
  onDeleted: () => void
): ColumnDef<OrgItem>[] => [
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
    accessorKey: 'orgName',
    size: 200,
    header: '组织名称',
    cell: ({ row }) => (
      <Button
        variant="link"
        className="p-0 h-auto font-medium text-primary hover:underline justify-start"
        onClick={() => onNameClick(row.original)}
      >
        {row.getValue('orgName')}
      </Button>
    ),
    enableHiding: false,
  },
  {
    accessorKey: 'orgType',
    size: 120,
    header: '组织类型',
    cell: ({ row }) => {
      const type = row.getValue('orgType') as number
      return (
				<Badge variant='secondary'>
          {getOrgTypeText(type)}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'parentId',
    size: 150,
    header: '父级组织ID',
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        {row.getValue('parentId') || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'createTs',
    size: 180,
    header: '创建时间',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatTimestamp(row.getValue('createTs'))}
      </span>
    ),
  },
  {
    accessorKey: 'updateTs',
    size: 180,
    header: '更新时间',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatTimestamp(row.getValue('updateTs'))}
      </span>
    ),
  },
  {
    id: 'actions',
    size: 180,
    header: '操作',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNameClick(row.original)}
        >
          查看
        </Button>
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
      sticky: 'right',
    },
  },
]

const OrganizationPage = () => {
  const navigate = useNavigate()
  const [searchName, setSearchName] = useState('')
  const [searchQuery, setSearchQuery] = useState('') // 实际用于搜索的状态
  const [pageSize, setPageSize] = useState(50)
  const [cursorId, setCursorId] = useState<string | undefined>()
  const [cursorCreateTs, setCursorCreateTs] = useState<string | undefined>()
  const [cursorType, setCursorType] = useState<string | undefined>()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<OrgItem | null>(null)

  // 构建请求参数 - 使用 JSON 字符串作为 key 以避免对象引用问题
  const params: OrgPageParams = {
    size: pageSize,
    cursorId,
    cursorCreateTs,
    cursorType,
    groupName: searchQuery || undefined,
  }

  // 使用 SWR
  const { data: response, isLoading, isValidating, mutate } = useSWR(
    ['/api/sys/org/page-list', JSON.stringify(params)],
    () => fetchOrgPageList(params),
    {
      revalidateOnFocus: false,
    }
  )

  const data = response?.data?.data ?? []
  const hasNext = response?.data?.hasNext ?? false
  const hasPrevious = response?.data?.hasPrevious ?? false
  const nextCursor = response?.data?.nextCursor ?? ''
  const prevCursor = response?.data?.prevCursor ?? ''

  // 处理搜索
  const handleSearch = () => {
    setSearchQuery(searchName) // 只在搜索时更新实际查询参数
    setCursorId(undefined)
    setCursorCreateTs(undefined)
    setCursorType(undefined)
  }

  // 处理刷新
  const handleRefresh = () => {
    setSearchName('')
    setSearchQuery('') // 同时清空搜索查询
    setCursorId(undefined)
    setCursorCreateTs(undefined)
    setCursorType(undefined)
  }

  // 处理添加
  const handleAdd = () => {
    setEditingItem(null)
    setDrawerOpen(true)
  }

  // 处理编辑
  const handleEdit = (item: OrgItem) => {
    setEditingItem(item)
    setDrawerOpen(true)
  }

  // 处理抽屉提交
  const handleDrawerSubmit = () => {
    mutate()
  }

  // 处理名称点击 - 跳转到详情页，传递组织信息
  const handleNameClick = (orgItem: OrgItem) => {
    navigate(`/organizations/${orgItem.id}`, { 
      state: { orgItem } 
    })
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

  const columns = createColumns(handleNameClick, handleEdit, () => mutate())

  return (
    <ListPageContainer
      toolbar={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleAdd}>
            <IconPlus className="h-4 w-4"/>
            <span className="hidden lg:inline">添加组织</span>
          </Button>
          <div className="flex-1 flex items-center gap-2 justify-end">
            <div className="relative w-64">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索组织名称"
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
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading || isValidating}>
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

      <CreateOrgDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        editData={editingItem}
        onSubmit={handleDrawerSubmit}
      />
    </ListPageContainer>
  )
}

export default OrganizationPage