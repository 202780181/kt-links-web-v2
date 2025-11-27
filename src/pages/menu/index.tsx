import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { type ColumnDef } from '@tanstack/react-table'
import {
  IconPlus,
  IconRefresh,
  IconSearch
} from '@tabler/icons-react'
import { toast } from 'sonner'

import {
  getMenuPageList,
  deleteMenus,
  type MenuItem,
} from '@/api/menu'
import { getMenuTypeList, type SystemTypeOption } from '@/api/systemTypes'
import { formatTimestamp } from '@/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/table'
import { DeleteConfirmButton } from '@/components/ui/delete-confirm'
import { CreateMenuDrawer } from './CreateMenu'
import { ListPageContainer } from '@/components/layout'

// 菜单数据接口
interface MenuData {
  key: string
  menuName: string
  menuId: string
  menuStatus: string
  menuType: number
  menuCode: string
  routePath: string
  parentId: string
  sort: number
  visible: string
  cached: string
  createTime: string
}

// 定义表格列
const createColumns = (
  menuTypes: SystemTypeOption[],
  onView: (id: string) => void,
  onDelete: (id: string) => void,
  onNameClick: (id: string) => void
): ColumnDef<MenuData>[] => [
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
    accessorKey: 'menuName',
    size: 120,
    header: '菜单名称',
    cell: ({ row }) => (
      <Button
        variant="link"
        className="p-0 h-auto font-medium text-primary hover:underline"
        onClick={() => onNameClick(row.original.menuId)}
      >
        {row.getValue('menuName')}
      </Button>
    ),
    enableHiding: false,
  },
  {
    accessorKey: 'menuStatus',
    size: 80,
    header: '状态',
    cell: ({ row }) => {
      const status = row.getValue('menuStatus') as string
      return (
        <Badge variant="outline">
          {status === '1' ? '启用' : '禁用'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'menuType',
    size: 80,
    header: '类型',
    cell: ({ row }) => {
      const typeValue = row.getValue('menuType') as number
      const typeLabel =
        menuTypes.find((t) => t.code === String(typeValue))?.label || String(typeValue)
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {typeLabel}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'menuCode',
    size: 120,
    header: '菜单编码',
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.getValue('menuCode') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'routePath',
    size: 150,
    header: '路由路径',
    cell: ({ row }) => (
      <div className="text-sm font-mono">{row.getValue('routePath') || '-'}</div>
    ),
  },
  {
    accessorKey: 'parentId',
    size: 100,
    header: '父级菜单',
    cell: ({ row }) => {
      const parentId = row.getValue('parentId') as string
      return (
        <div className="text-sm text-muted-foreground">
          {parentId === '0' ? '顶级菜单' : parentId}
        </div>
      )
    },
  },
  {
    accessorKey: 'sort',
    size: 60,
    header: () => <div className="text-center">排序</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('sort')}</div>
    ),
  },
  {
    accessorKey: 'cached',
    size: 60,
    header: '缓存',
    cell: ({ row }) => {
      const cached = row.getValue('cached') as string
      return (
        <Badge variant="outline">
          {cached === 'true' ? '是' : '否'}
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
        {formatTimestamp(row.getValue('createTime'))}
      </div>
    ),
  },
  {
    id: 'actions',
    size: 120,
    header: '操作',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="p-0 hover:text-primary hover:underline"
          onClick={() => onView(row.original.menuId)}
        >
          <span>查看</span>
        </Button>
        <DeleteConfirmButton
          onConfirm={() => onDelete(row.original.menuId)}
          title="确认删除菜单"
          description={`确定要删除菜单"${row.original.menuName}"吗？此操作无法撤销。`}
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

export default function MenuPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<MenuData[]>([])  
  const [menuTypes, setMenuTypes] = useState<SystemTypeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  
  // 分页状态
  const [pageSize, setPageSize] = useState(50)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [nextCursor, setNextCursor] = useState('')
  const [prevCursor, setPrevCursor] = useState('')
  const [cursorType, setCursorType] = useState<string>('')
  const [cursorCreateTs, setCursorCreateTs] = useState<string>('')

  // 加载菜单类型
  useEffect(() => {
    const loadMenuTypes = async () => {
      try {
        const response = await getMenuTypeList()
        if (response.code === 0) {
          setMenuTypes(response.data)
        }
      } catch (error) {
        console.error('加载菜单类型失败:', error)
        toast.error('加载菜单类型失败')
      }
    }
    loadMenuTypes()
  }, [])

  // 加载菜单列表
  const loadMenuList = useCallback(async (params?: {
    size?: number
    cursorId?: string
    cursorCreateTs?: string
    cursorType?: 'up' | 'down'
  }) => {
    setLoading(true)
    try {
      const response = await getMenuPageList({
        size: params?.size || pageSize,
        cursorId: params?.cursorId,
        cursorCreateTs: params?.cursorCreateTs,
        cursorType: params?.cursorType,
        parentId: 0, // 查询顶级菜单
      })

      if (response.code === 0 && response.data) {
        // 转换真实数据
        const realData: MenuData[] = response.data.data.map((item: MenuItem) => ({
          key: item.id,
          menuName: item.menuName,
          menuId: item.id,
          menuStatus: String(item.menuStatus),
          menuType: item.menuType,
          menuCode: item.menuCode,
          routePath: item.routePath,
          parentId: item.parentId,
          sort: item.sort,
          visible: String(item.visible),
          cached: String(item.cached),
          createTime: formatTimestamp(item.createTs),
        }))

        // 设置真实数据
        setData(realData)
        
        // 更新分页信息
        setHasNext(response.data.hasNext)
        setHasPrevious(response.data.hasPrevious)
        setNextCursor(response.data.nextCursor || '')
        setPrevCursor(response.data.prevCursor || '')
        setCursorType(response.data.cursorType || '')
        setCursorCreateTs(response.data.cursorCreateTs || '')
      }
    } catch (error) {
      console.error('加载菜单列表失败:', error)
      toast.error('加载菜单列表失败')
    } finally {
      setLoading(false)
    }
  }, [pageSize]) // 依赖 pageSize

  useEffect(() => {
    loadMenuList() 
  }, [])

  // 查看菜单
  const handleView = (id: string) => {
    toast.error(`查看菜单: ${id}`)
    // TODO: 实现查看逻辑
  }

  // 删除菜单
  const handleDelete = async (id: string) => {
    try {
      const response = await deleteMenus([id])
      if (response.code === 0) {
        toast.success('删除成功')
        loadMenuList()
      } else {
        toast.error(response.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除菜单失败:', error)
      toast.error('删除菜单失败')
    }
  }

  const handleCreateMenu = async (formData: any) => {
    try {
      // 这里应该调用创建菜单的 API
      console.log('创建菜单:', formData)
      toast.success('菜单创建成功')
      loadMenuList() // 使用当前页面大小重新加载数据
    } catch (error) {
      console.error('创建菜单失败:', error)
      toast.error('创建菜单失败')
    }
  }

  // 处理分页大小变化
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    loadMenuList({ size: newSize })
  }
  
  // 处理上一页
  const handlePrevPage = () => {
    if (hasPrevious && prevCursor) {
      loadMenuList({ 
        cursorId: prevCursor, 
        cursorCreateTs: cursorCreateTs || undefined,
        cursorType: cursorType ? cursorType as 'up' | 'down' : 'up'
      })
    }
  }
  
  // 处理下一页
  const handleNextPage = () => {
    if (hasNext && nextCursor) {
      loadMenuList({ 
        cursorId: nextCursor, 
        cursorCreateTs: cursorCreateTs || undefined,
        cursorType: cursorType ? cursorType as 'up' | 'down' : 'down'
      })
    }
  }

  // 处理菜单名称点击
  const handleNameClick = (id: string) => {
    navigate(`/menu/${id}`)
  }

  const columns = createColumns(menuTypes, handleView, handleDelete, handleNameClick)

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
                onClick={() => setCreateDrawerOpen(true)}
              >
                <IconPlus />
                <span className="hidden lg:inline">添加</span>
              </Button>
            </div>

            {/* 右侧搜索和刷新 */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索菜单名称"
                  className="w-64 pl-9 h-9"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadMenuList()}
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
          data={data}
          loading={loading}
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

      {/* 创建菜单抽屉 */}
      <CreateMenuDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        onSubmit={handleCreateMenu}
        menuTypeOptions={menuTypes}
      />
    </>
  )
}
