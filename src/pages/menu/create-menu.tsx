import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface CreateMenuDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: MenuFormData) => void
}

interface MenuFormData {
  name: string
  code: string
  type: string
  status: string
  parentMenu: string
  sort: number
  routePath: string
  componentPath: string
  icon: string
  appId: string
  isVisible: boolean
  isCache: boolean
  additionalInfo: string
}

export function CreateMenuDrawer({ open, onOpenChange, onSubmit }: CreateMenuDrawerProps) {
  const [formData, setFormData] = useState<MenuFormData>({
    name: '',
    code: '',
    type: '目录',
    status: '启用',
    parentMenu: '',
    sort: 0,
    routePath: '',
    componentPath: '',
    icon: '',
    appId: '',
    isVisible: true,
    isCache: true,
    additionalInfo: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(formData)
    onOpenChange(false)
    // 重置表单
    setFormData({
      name: '',
      code: '',
      type: '目录',
      status: '启用',
      parentMenu: '',
      sort: 0,
      routePath: '',
      componentPath: '',
      icon: '',
      appId: '',
      isVisible: true,
      isCache: true,
      additionalInfo: '',
    })
  }

  const updateFormData = (field: keyof MenuFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className="w-[800px] sm:max-w-[800px] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
            创建菜单
          </SheetTitle>
          <SheetDescription>
            填写下面的信息来创建新的菜单项
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <form id="create-menu-form" onSubmit={handleSubmit} className="space-y-6 pb-20">
          {/* 第一行：菜单名称和菜单编码 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                <span className="text-red-500">*</span> 菜单名称
              </Label>
              <Input
                id="name"
                placeholder="请输入菜单名称"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium">
                <span className="text-red-500">*</span> 菜单编码
              </Label>
              <Input
                id="code"
                placeholder="例如: sys:menu:list"
                value={formData.code}
                onChange={(e) => updateFormData('code', e.target.value)}
                required
              />
            </div>
          </div>

          {/* 第二行：菜单类型和菜单状态 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <span className="text-red-500">*</span> 菜单类型
              </Label>
              <Select value={formData.type} onValueChange={(value) => updateFormData('type', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择菜单类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="目录">目录</SelectItem>
                  <SelectItem value="菜单">菜单</SelectItem>
                  <SelectItem value="按钮">按钮</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <span className="text-red-500">*</span> 菜单状态
              </Label>
              <Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择菜单状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="启用">启用</SelectItem>
                  <SelectItem value="禁用">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 第三行：父级菜单和排序 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                父级菜单
                <span className="text-xs text-muted-foreground">ⓘ</span>
              </Label>
              <Select value={formData.parentMenu} onValueChange={(value) => updateFormData('parentMenu', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择父级菜单" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">根菜单</SelectItem>
                  <SelectItem value="system">系统管理</SelectItem>
                  <SelectItem value="user">用户管理</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort" className="text-sm font-medium">
                排序
              </Label>
              <Input
                id="sort"
                type="number"
                placeholder="0"
                value={formData.sort}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('sort', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* 第四行：路由路径和组件路径 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="routePath" className="text-sm font-medium">
                路由路径
              </Label>
              <Input
                id="routePath"
                placeholder="例如: /views/menu/index"
                value={formData.routePath}
                onChange={(e) => updateFormData('routePath', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="componentPath" className="text-sm font-medium">
                组件路径
              </Label>
              <Input
                id="componentPath"
                placeholder="例如: views/menu/index.vue"
                value={formData.componentPath}
                onChange={(e) => updateFormData('componentPath', e.target.value)}
              />
            </div>
          </div>

          {/* 第五行：图标和应用ID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <span className="text-red-500">*</span> 图标
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="请选择图标"
                  value={formData.icon}
                  onChange={(e) => updateFormData('icon', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <span className="text-red-500">*</span> 应用ID
              </Label>
              <div className="relative">
                <Plus className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="请选择应用"
                  value={formData.appId}
                  onChange={(e) => updateFormData('appId', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* 第六行：开关选项 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">是否可见</Label>
              <Switch
                checked={formData.isVisible}
                onCheckedChange={(checked) => updateFormData('isVisible', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">是否缓存</Label>
              <Switch
                checked={formData.isCache}
                onCheckedChange={(checked) => updateFormData('isCache', checked)}
              />
            </div>
          </div>

          {/* 附加信息 */}
          <div className="space-y-2">
            <Label htmlFor="additionalInfo" className="text-sm font-medium">
              附加信息
            </Label>
            <Textarea
              id="additionalInfo"
              placeholder="请输入附加信息（JSON格式）"
              value={formData.additionalInfo}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData('additionalInfo', e.target.value)}
              rows={4}
            />
          </div>

          </form>
        </div>

        {/* 底部浮动按钮 */}
        <div className="sticky bottom-0 bg-background border-t p-4 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            type="submit" 
            form="create-menu-form"
            onClick={(e) => {
              e.preventDefault()
              const form = document.getElementById('create-menu-form') as HTMLFormElement
              if (form) {
                form.requestSubmit()
              }
            }}
          >
            创建菜单
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
