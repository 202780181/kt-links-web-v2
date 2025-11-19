import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Menu as MenuIcon, List, Loader2 } from 'lucide-react'
import { type ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'

import { getMenuById, getMenuPageList, type MenuItem } from '@/api/menu'
import { getMenuTypeList, type SystemTypeOption } from '@/api/systemTypes'
import { formatTimestamp } from '@/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/table'
import { DeleteConfirmButton } from '@/components/ui/delete-confirm'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { MenuDetailSkeleton } from '@/components/skeletons/MenuDetailSkeleton'

interface MenuDetailData {
  id: string
  menuName?: string
  parentName?: string | null
  menuStatus?: number
  menuType?: number
  menuCode?: string
  routePath?: string
  parentId?: string
  sort?: number
  visible?: boolean
  cached?: boolean
  componentPath?: string
  appName?: string | null
  updateTs?: string
  createTs?: string
  icon?: string
  additional?: Record<string, any>
  appId?: string
}

interface SubMenuData {
  key: string
  menuName: string
  menuId: string
  menuStatus: number
  menuType: number
  menuCode: string
  routePath: string
  sort: number
  visible: boolean
  cached: boolean
  createTs: string
}

interface BreadcrumbItem {
  id: string
  name: string
}

const MenuDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [menuDetail, setMenuDetail] = useState<MenuDetailData | null>(null)
  const [subMenus, setSubMenus] = useState<SubMenuData[]>([])
  const [subMenusLoading, setSubMenusLoading] = useState(false)
  const [menuTypes, setMenuTypes] = useState<SystemTypeOption[]>([])
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])

  // 加载菜单类型
  useEffect(() => {
    const loadMenuTypes = async () => {
      try {
        const response = await getMenuTypeList()
        if (response.code === 0 && response.data) {
          setMenuTypes(response.data)
        }
      } catch (error) {
        console.error('加载菜单类型失败:', error)
      }
    }
    loadMenuTypes()
  }, [])

  // 构建面包屑路径
  const buildBreadcrumbs = async (menuId: string) => {
    const crumbs: BreadcrumbItem[] = []
    let currentId = menuId

    try {
      // 递归获取父级菜单
      while (currentId && currentId !== '0') {
        const response = await getMenuById(currentId)
        if (response.code === 0 && response.data) {
          const menu = response.data
          crumbs.unshift({
            id: menu.id,
            name: menu.menuName,
          })
          currentId = menu.parentId
        } else {
          break
        }
      }
      setBreadcrumbs(crumbs)
    } catch (error) {
      console.error('构建面包屑失败:', error)
    }
  }

  // 加载菜单详情
  useEffect(() => {
    if (!id) return
    const loadMenuDetail = async () => {
      setLoading(true)
      try {
        // 获取当前菜单详情
        const response = await getMenuById(id)
        if (response.code === 0 && response.data) {
          setMenuDetail(response.data)
          // 构建面包屑路径
          await buildBreadcrumbs(id)
        }
      } catch (error) {
        console.error('加载菜单详情失败:', error)
        toast.error('加载菜单详情失败')
      } finally {
        setLoading(false)
      }
    }

    loadMenuDetail()
  }, [id])

  // 加载子菜单列表
  const loadSubMenus = async () => {
		if(!menuDetail?.id) return;
    setSubMenusLoading(true)
    try {
      const subResponse = await getMenuPageList({
        size: 100,
        parentId: menuDetail.id,
      })

      if (subResponse.code === 0 && subResponse.data) {
        const subData: SubMenuData[] = subResponse.data.data.map((item: MenuItem) => ({
          key: item.id,
          menuName: item.menuName,
          menuId: item.id,
          menuStatus: item.menuStatus,
          menuType: item.menuType,
          menuCode: item.menuCode,
          routePath: item.routePath,
          sort: item.sort,
          visible: item.visible,
          cached: item.cached,
          createTs: item.createTs,
        }))
        setSubMenus(subData)
      }
    } catch (error) {
      console.error('加载子菜单失败:', error)
      toast.error('加载子菜单失败')
    } finally {
      setSubMenusLoading(false)
    }
  }

  // 处理 Tab 切换
  const handleTabChange = (value: string) => {
    if (value === 'submenu') {
      loadSubMenus()
    }
  }

  // 子菜单表格列定义
  const subMenuColumns: ColumnDef<SubMenuData>[] = [
    {
      accessorKey: 'menuName',
      size: 120,
      header: '菜单名称',
      cell: ({ row }) => (
        <Button
          variant="link"
          className="p-0 h-auto font-medium text-primary hover:underline"
          onClick={() => navigate(`/menu/${row.original.menuId}`)}
        >
          {row.getValue('menuName')}
        </Button>
      ),
    },
    {
      accessorKey: 'menuStatus',
      size: 80,
      header: '状态',
      cell: ({ row }) => {
        const status = row.getValue('menuStatus') as number
        return (
          <Badge variant={status === 1 ? 'default' : 'secondary'}>
            {status === 1 ? '启用' : '禁用'}
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
        return <Badge variant="outline">{typeLabel}</Badge>
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
      accessorKey: 'sort',
      size: 60,
      header: () => <div className="text-center">排序</div>,
      cell: ({ row }) => <div className="text-center">{row.getValue('sort')}</div>,
    },
    {
      accessorKey: 'visible',
      size: 60,
      header: '可见',
      cell: ({ row }) => {
        const visible = row.getValue('visible') as boolean
        return <Badge variant="outline">{visible ? '是' : '否'}</Badge>
      },
    },
    {
      accessorKey: 'cached',
      size: 60,
      header: '缓存',
      cell: ({ row }) => {
        const cached = row.getValue('cached') as boolean
        return <Badge variant="outline">{cached ? '是' : '否'}</Badge>
      },
    },
    {
      accessorKey: 'createTs',
      size: 180,
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
      header: '操作',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 hover:text-primary hover:underline"
            onClick={() => navigate(`/menu/${row.original.menuId}`)}
          >
            查看
          </Button>
          <DeleteConfirmButton
            onConfirm={() => {
              toast.info('删除功能待实现')
            }}
            title="确认删除菜单"
            description={`确定要删除菜单"${row.original.menuName}"吗？此操作无法撤销。`}
          >
            <Button
              variant="ghost"
              size="sm"
              className="p-0 hover:text-destructive hover:underline"
            >
              删除
            </Button>
          </DeleteConfirmButton>
        </div>
      ),
    },
  ]

  if (loading) {
    return <MenuDetailSkeleton />
  }

  if (!menuDetail) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">菜单不存在</div>
      </div>
    )
  }

  return (
    <div className="w-full p-6 space-y-6 pb-20">
      {/* 面包屑导航 */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer"
              onClick={() => navigate('/menu')}
            >
              菜单管理
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id} className="flex items-center gap-1.5">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    className="cursor-pointer"
                    onClick={() => navigate(`/menu/${crumb.id}`)}
                  >
                    {crumb.name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面头部 */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/menu')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold tracking-tight fs-20">{menuDetail.menuName || '未命名菜单'}</h1>
          </div>
        </div>
        
        {/* 菜单基本信息 */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 pl-14">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground w-20">菜单名称</span>
            <span className="text-sm font-medium">{menuDetail.menuName || '-'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground w-20">菜单类型</span>
            <Badge variant="outline">
              {menuTypes.find((t) => Number(t.value) === menuDetail.menuType)?.label || '-'}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground w-20">父级名称</span>
            <span className="text-sm">{menuDetail.parentId === '0' ? '顶级菜单' : menuDetail.parentName || '-'}</span>
          </div>
        </div>
      </div>

      {/* Tabs 切换 */}
      <Tabs defaultValue="info" className="w-full" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="info" className="gap-2">
            <MenuIcon className="h-4 w-4" />
            菜单信息
          </TabsTrigger>
          <TabsTrigger value="submenu" className="gap-2">
            <List className="h-4 w-4" />
            子菜单 ({subMenus.length})
          </TabsTrigger>
        </TabsList>

        {/* 菜单信息 Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>菜单信息</CardTitle>
              <CardDescription>查看菜单的详细配置信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                {/* 菜单名称 */}
                <div className="flex items-center py-2">
                  <label className="text-sm font-medium text-muted-foreground w-24 shrink-0">
                    菜单名称
                  </label>
                  <p className="text-sm font-medium">{menuDetail.menuName || '-'}</p>
                </div>

                {/* 菜单类型 */}
                <div className="flex items-center py-2">
                  <label className="text-sm font-medium text-muted-foreground w-24 shrink-0">
                    菜单类型
                  </label>
                  <Badge variant="outline">
                    {menuTypes.find((t) => Number(t.value) === menuDetail.menuType)?.label || '-'}
                  </Badge>
                </div>

                {/* 父级名称 */}
                <div className="flex items-center py-2">
                  <label className="text-sm font-medium text-muted-foreground w-24 shrink-0">
                    父级名称
                  </label>
                  <p className="text-sm">{menuDetail.parentId === '0' ? '顶级菜单' : menuDetail.parentName || '-'}</p>
                </div>

                {/* 状态 */}
                <div className="flex items-center py-2">
                  <label className="text-sm font-medium text-muted-foreground w-24 shrink-0">
                    状态
                  </label>
                  <Badge variant={menuDetail.menuStatus === 1 ? 'default' : 'secondary'}>
                    {menuDetail.menuStatus === 1 ? '启用' : '禁用'}
                  </Badge>
                </div>

                {/* 菜单编码 */}
                <div className="flex items-center py-2">
                  <label className="text-sm font-medium text-muted-foreground w-24 shrink-0">
                    菜单编码
                  </label>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    {menuDetail.menuCode || '-'}
                  </code>
                </div>

                {/* 路由路径 */}
                <div className="flex items-center py-2">
                  <label className="text-sm font-medium text-muted-foreground w-24 shrink-0">
                    路由路径
                  </label>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    {menuDetail.routePath || '-'}
                  </code>
                </div>

                {/* 组件路径 */}
                <div className="flex items-center py-2">
                  <label className="text-sm font-medium text-muted-foreground w-24 shrink-0">
                    组件路径
                  </label>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    {menuDetail.componentPath || '-'}
                  </code>
                </div>

                {/* 应用名称 */}
                <div className="flex items-center py-2">
                  <label className="text-sm font-medium text-muted-foreground w-24 shrink-0">
                    应用名称
                  </label>
                  <p className="text-sm">{menuDetail.appName || '-'}</p>
                </div>

                {/* 排序 */}
                <div className="flex items-center py-2">
                  <label className="text-sm font-medium text-muted-foreground w-24 shrink-0">
                    排序
                  </label>
                  <p className="text-sm">{menuDetail.sort ?? '-'}</p>
                </div>

                {/* 可见 */}
                <div className="flex items-center py-2">
                  <label className="text-sm font-medium text-muted-foreground w-24 shrink-0">
                    可见
                  </label>
                  <Badge variant="outline">
                    {menuDetail.visible ? '是' : '否'}
                  </Badge>
                </div>

                {/* 缓存 */}
                <div className="flex items-center py-2">
                  <label className="text-sm font-medium text-muted-foreground w-24 shrink-0">
                    缓存
                  </label>
                  <Badge variant="outline">
                    {menuDetail.cached ? '是' : '否'}
                  </Badge>
                </div>

                {/* 图标 */}
                <div className="flex items-center py-2">
                  <label className="text-sm font-medium text-muted-foreground w-24 shrink-0">
                    图标
                  </label>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    {menuDetail.icon || '-'}
                  </code>
                </div>

                {/* 创建时间 */}
                <div className="flex items-center py-2">
                  <label className="text-sm font-medium text-muted-foreground w-24 shrink-0">
                    创建时间
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {menuDetail.createTs ? formatTimestamp(menuDetail.createTs) : '-'}
                  </p>
                </div>

                {/* 更新时间 */}
                <div className="flex items-center py-2">
                  <label className="text-sm font-medium text-muted-foreground w-24 shrink-0">
                    更新时间
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {menuDetail.updateTs ? formatTimestamp(menuDetail.updateTs) : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 子菜单 Tab */}
        <TabsContent value="submenu" className="space-y-4">
          <Card>
            <CardContent>
              {subMenusLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>加载中...</span>
                  </div>
                </div>
              ) : subMenus.length > 0 ? (
                <DataTable columns={subMenuColumns} data={subMenus} />
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  暂无子菜单
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MenuDetailPage
