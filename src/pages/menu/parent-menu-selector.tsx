import { useState, useEffect } from 'react'
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
	getMenuPageList, 
	type MenuItem, 
	type MenuPageParams
 } from '@/api/menu'
import { type SystemTypeOption } from '@/api/systemTypes'
import { toast } from 'sonner'
import { formatTimestamp } from '@/utils'
import type { ColumnDef } from '@tanstack/react-table'

interface ParentMenuSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (menu: MenuItem | null) => void
  menuTypeOptions: SystemTypeOption[]
  /**
   * 允许选择的菜单类型过滤
   * 例如：只允许选择"目录"类型的菜单作为父级
   * 传入目录类型的 code 值（如 0）
   */
  allowedMenuType?: number
  /**
   * 当前正在创建/编辑的菜单类型
   * 用于后端根据业务规则过滤可选的父级菜单
   * 例如：按钮类型只能选择菜单作为父级
   */
  currentMenuType?: number
}

export function ParentMenuSelector({ 
  open, 
  onOpenChange, 
  onSelect,
  menuTypeOptions,
  allowedMenuType,
  currentMenuType
}: ParentMenuSelectorProps) {
  const [menuList, setMenuList] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null)

  // 加载菜单列表
  useEffect(() => {
    const loadMenuList = async () => {
      if (!open) {
        // 对话框关闭时重置选中状态
        setSelectedMenuId(null)
        return
      }
      setLoading(true)
      try {
				const params: MenuPageParams = {
					size: 100,
					parentId: 0,
					menuType_equal: allowedMenuType,
					menuType: currentMenuType,
				}
        const response = await getMenuPageList(params)
        if (response.code === 0 && response.data?.data) {
          setMenuList(response.data.data)
        }
      } catch (error) {
        console.error('加载菜单列表失败:', error)
        toast.error('加载菜单列表失败')
      } finally {
        setLoading(false)
      }
    }

    loadMenuList()
  }, [open, allowedMenuType, currentMenuType])

  // 处理单选框变化
  const handleRadioChange = (menuId: string) => {
    setSelectedMenuId(menuId)
  }

  // 确认选择
  const handleConfirm = () => {
    if (selectedMenuId) {
      const selectedMenu = menuList.find(menu => menu.id === selectedMenuId)
      if (selectedMenu) {
        onSelect(selectedMenu)
        onOpenChange(false)
        setSelectedMenuId(null)
      }
    }
  }

  // 清空选择
  const handleClear = () => {
    setSelectedMenuId(null)
    onSelect(null)
    onOpenChange(false)
  }

  const columns: ColumnDef<MenuItem>[] = [
    {
      id: 'select',
      header: '选择',
      size: 60,
      cell: ({ row }) => (
        <div className="flex items-center">
          <input
            type="radio"
            name="parent-menu-radio"
            checked={selectedMenuId === row.original.id}
            onChange={() => handleRadioChange(row.original.id)}
            className="w-4 h-4 cursor-pointer"
          />
        </div>
      ),
    },
    {
      accessorKey: 'menuName',
      header: '菜单名称',
    },
    {
      accessorKey: 'menuCode',
      header: '菜单编码',
    },
    {
      accessorKey: 'menuType',
      header: '类型',
      size: 80,
      cell: ({ row }) => {
        const typeOption = menuTypeOptions.find(opt => parseInt(opt.code) === row.original.menuType)
        return typeOption?.label || row.original.menuType
      },
    },
    {
      accessorKey: 'menuStatus',
      header: '状态',
      size: 80,
      cell: ({ row }) => (row.original.menuStatus === 1 ? '启用' : '禁用'),
    },
    {
      accessorKey: 'createTs',
      header: '创建时间',
      size: 180,
      cell: ({ row }) => formatTimestamp(row.original.createTs),
    },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[900px] sm:max-w-[900px] flex flex-col">
        <SheetHeader className="pb-6">
          <SheetTitle>选择父级菜单</SheetTitle>
          <SheetDescription>从列表中选择一个菜单作为父级菜单</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <DataTable
            columns={columns}
            data={menuList}
            loading={loading}
          />
        </div>

        <div className="sticky bottom-0 bg-background border-t p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClear}>
            清空选择
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedMenuId}>
            确认选择
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
