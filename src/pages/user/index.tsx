import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import {
  IconPlus,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react'
import { toast } from 'sonner'


import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/table'
import { ListPageContainer } from '@/components/list-page-warpper'
import { DeleteConfirmButton } from '@/components/ui/delete-confirm'

// 用户数据接口
interface UserData {
  key: string
  userId: string
  userName: string
  userType: string
  status: number
  createTime: string
  updateTime: string
}

// 模拟用户类型
const getUserTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    'admin': '管理员',
    'normal': '普通用户',
    'guest': '访客',
  }
  return typeMap[type] || type
}

// 定义表格列
const createColumns = (
  onView: (id: string) => void,
  onDelete: (id: string, name: string) => void
): ColumnDef<UserData>[] => [
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
    accessorKey: 'userName',
    size: 150,
    header: '用户名称',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('userName')}</div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: 'userType',
    size: 120,
    header: '用户类型',
    cell: ({ row }) => {
      const type = row.getValue('userType') as string
      return (
        <Badge variant="outline">
          {getUserTypeText(type)}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'status',
    size: 80,
    header: '状态',
    cell: ({ row }) => {
      const status = row.getValue('status') as number
      return (
				<Badge variant='secondary'>
          {status === 1 ? '启用' : '禁用'}
        </Badge>
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
    accessorKey: 'updateTime',
    size: 180,
    header: '更新时间',
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.getValue('updateTime')}
      </div>
    ),
  },
  {
    id: 'actions',
    size: 120,
    header: '操作',
    meta: {
      sticky: 'right',
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="p-0 hover:text-primary hover:underline"
          onClick={() => onView(row.original.userId)}
        >
          <span>查看</span>
        </Button>
        <DeleteConfirmButton
          onConfirm={() => onDelete(row.original.userId, row.original.userName)}
          title="确认删除用户"
          description={`确定要删除用户"${row.original.userName}"吗？此操作无法撤销。`}
        >
          <Button
            variant="ghost"
            size="sm"
            className="p-0 hover:text-destructive hover:underline"
          >
            <span>删除</span>
          </Button>
        </DeleteConfirmButton>
      </div>
    ),
  },
]

export default function UserPage() {
  const [searchValue, setSearchValue] = useState('')
  const [loading] = useState(false)

  // 模拟数据
  const mockData: UserData[] = [
    {
      key: '1',
      userId: '1',
      userName: '张三',
      userType: 'admin',
      status: 1,
      createTime: '2024-01-15 10:30:00',
      updateTime: '2024-01-20 14:20:00',
    },
    {
      key: '2',
      userId: '2',
      userName: '李四',
      userType: 'normal',
      status: 1,
      createTime: '2024-01-16 11:00:00',
      updateTime: '2024-01-21 09:15:00',
    },
    {
      key: '3',
      userId: '3',
      userName: '王五',
      userType: 'normal',
      status: 0,
      createTime: '2024-01-17 09:45:00',
      updateTime: '2024-01-22 16:30:00',
    },
    {
      key: '4',
      userId: '4',
      userName: '赵六',
      userType: 'guest',
      status: 1,
      createTime: '2024-01-18 14:20:00',
      updateTime: '2024-01-23 10:45:00',
    },
  ]

  // 处理查看
  const handleView = (id: string) => {
    toast.info(`查看用户: ${id}`)
    // TODO: 实现查看逻辑
  }

  // 处理删除
  const handleDelete = (_id: string, name: string) => {
    toast.success(`用户"${name}"删除成功`)
    // TODO: 实现删除逻辑
  }

  // 处理搜索
  const handleSearch = () => {
    toast.info(`搜索: ${searchValue}`)
    // TODO: 实现搜索逻辑
  }

  // 处理刷新
  const handleRefresh = () => {
    setSearchValue('')
    toast.success('刷新成功')
    // TODO: 实现刷新逻辑
  }

  // 处理添加
  const handleAdd = () => {
    toast.info('打开添加用户对话框')
    // TODO: 实现添加逻辑
  }

  const columns = createColumns(handleView, handleDelete)

  return (
    <ListPageContainer
      toolbar={
        <div className="flex items-center justify-between">
          {/* 左侧按钮 */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleAdd}>
              <IconPlus className="h-4 w-4" />
              <span>添加用户</span>
            </Button>
          </div>

          {/* 右侧搜索和刷新 */}
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索用户名称"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
                className="pl-9"
              />
            </div>
            <Button
							variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
            >
							<IconRefresh className="h-4 w-4" />
            </Button>
          </div>
        </div>
      }
      gap="md"
      padding="md"
    >
      <DataTable
        columns={columns}
        data={mockData}
        loading={loading}
        showPagination={true}
        pageSizeOptions={[10, 20, 50, 100, 200]}
        pagination={{
          pageSize: 50,
          hasNext: false,
          hasPrevious: false,
          onPageSizeChange: (size) => console.log('Page size:', size),
          onPrevPage: () => console.log('Previous page'),
          onNextPage: () => console.log('Next page'),
        }}
      />
    </ListPageContainer>
  )
}
