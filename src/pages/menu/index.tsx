import { useState, useEffect } from 'react'
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
import { CreateMenuDrawer } from './create-menu'

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
  onDelete: (id: string) => void
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
      <div className="font-medium">{row.getValue('menuName')}</div>
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
        <Button
          variant="ghost"
          size="sm"
          className="p-0 hover:text-destructive hover:underline"
          onClick={() => onDelete(row.original.menuId)}
        >
          <span>删除</span>
        </Button>
      </div>
    ),
  },
]

export default function MenuPage() {
  const [data, setData] = useState<MenuData[]>([])  
  const [menuTypes, setMenuTypes] = useState<SystemTypeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)

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
  const loadMenuList = async () => {
    setLoading(true)
    try {
      const response = await getMenuPageList({
        size: 50,
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

        // 创建40条假数据
        const fakeData: MenuData[] = Array.from({ length: 40 }, (_, index) => ({
          key: `fake-${index + 1}`,
          menuName: `测试菜单${index + 1}`,
          menuId: `fake-${index + 1}`,
          menuStatus: index % 2 === 0 ? '1' : '0',
          menuType: (index % 3) as 0 | 1 | 2,
          menuCode: `test_menu_${index + 1}`,
          routePath: `/test/menu${index + 1}`,
          parentId: '0',
          sort: index + 1,
          visible: index % 3 === 0 ? 'false' : 'true',
          cached: index % 2 === 0 ? 'true' : 'false',
          createTime: formatTimestamp(Date.now() - index * 86400000),
        }))

        // 合并真实数据和假数据
        setData([...realData, ...fakeData])
      }
    } catch (error) {
      console.error('加载菜单列表失败:', error)
      toast.error('加载菜单列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMenuList()
  }, [])

  // 查看菜单
  const handleView = (id: string) => {
    toast.info(`查看菜单: ${id}`)
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
      loadMenuList() // 重新加载数据
    } catch (error) {
      console.error('创建菜单失败:', error)
      toast.error('创建菜单失败')
    }
  }

  const columns = createColumns(menuTypes, handleView, handleDelete)

  return (
    <div className="flex w-full flex-col gap-4 p-4" style={{ height: 'calc(100vh - 64px)' }}>
      {/* 工具栏 */}
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

      {/* 表格 */}
      <div className="flex-1 min-h-0">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          showPagination={true}
          initialPageSize={10}
        />
      </div>

      {/* 创建菜单抽屉 */}
      <CreateMenuDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        onSubmit={handleCreateMenu}
      />
    </div>
  )
}
