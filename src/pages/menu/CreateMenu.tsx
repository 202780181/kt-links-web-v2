import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { FormFields, FormFieldWrapper, FormConfigProvider } from '@/components/form/FormFieldWrapper'
import { addMenu, type MenuItem } from '@/api/menu'
import { type AppItem } from '@/api/application'
import { type SystemTypeOption } from '@/api/systemTypes'
import { toast } from 'sonner'
import { ParentMenuSelector } from './ParentMenu'
import { AppSelector } from './AppSelector'

interface CreateMenuDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: MenuFormData) => void
  menuTypeOptions: SystemTypeOption[]
}

// Zod Schema 定义
const menuFormSchema = z.object({
  name: z.string().min(1, '请输入菜单名称'),
  code: z.string().min(1, '请输入菜单编码'),
  type: z.string(),
  status: z.string(),
  parentMenu: z.string().optional(),
  sort: z.coerce.number().int().min(0, '排序必须大于等于0'),
  routePath: z.string().min(1, '请输入路由路径'),
  componentPath: z.string().min(1, '请输入组件路径'),
  icon: z.string().min(1, '请输入图标'),
  appId: z.string().min(1, '请输入应用ID'),
  isVisible: z.boolean(),
  isCache: z.boolean(),
  additionalInfo: z.string().optional(),
})

type MenuFormData = z.infer<typeof menuFormSchema>

export function CreateMenuDrawer({ open, onOpenChange, onSubmit, menuTypeOptions }: CreateMenuDrawerProps) {
  const [submitting, setSubmitting] = useState(false)
  const [parentMenuDialogOpen, setParentMenuDialogOpen] = useState(false)
  const [selectedParentMenu, setSelectedParentMenu] = useState<MenuItem | null>(null)
  const [appSelectorOpen, setAppSelectorOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<AppItem | null>(null)

  const form = useForm<MenuFormData>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      name: '',
      code: '',
      type: '',
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
    },
  })

  // 设置默认菜单类型
  useEffect(() => {
    if (open && menuTypeOptions.length > 0 && !form.getValues('type')) {
      form.setValue('type', menuTypeOptions[0].value)
    }
  }, [open, menuTypeOptions, form])

  // 打开父级菜单选择对话框
  const handleOpenParentMenuDialog = () => {
    setParentMenuDialogOpen(true)
  }

  // 选择父级菜单
  const handleSelectParentMenu = (menu: MenuItem | null) => {
    setSelectedParentMenu(menu)
    form.setValue('parentMenu', menu?.id || '')
  }

  // 打开应用选择对话框
  const handleOpenAppSelector = () => {
    setAppSelectorOpen(true)
  }

  // 选择应用
  const handleSelectApp = (app: AppItem | null) => {
    setSelectedApp(app)
    form.setValue('appId', app?.id || '')
  }

  // 监听菜单类型变化，如果是模块则清空并禁用父级菜单
  const menuType = form.watch('type')
  useEffect(() => {
    // 找到“模块”类型的选项
    const moduleOption = menuTypeOptions.find(option => option.label === '模块')
    if (moduleOption && menuType === moduleOption.value) {
      form.setValue('parentMenu', '')
      setSelectedParentMenu(null)
    }
  }, [menuType, menuTypeOptions, form])

  const onFormSubmit = async (data: MenuFormData) => {
    setSubmitting(true)
    try {
      // 从菜单类型选项中找到对应的 code
      const selectedMenuType = menuTypeOptions.find(option => option.value === data.type)
      const menuTypeCode = selectedMenuType ? parseInt(selectedMenuType.code) : 0
      
      const menuStatusMap: Record<string, number> = {
        '启用': 1,
        '禁用': 0,
      }

      const params = {
        menuStatus: menuStatusMap[data.status],
        parentId: data.parentMenu || '0',
        menuName: data.name,
        menuType: menuTypeCode,
        menuCode: data.code,
        routePath: data.routePath,
        componentPath: data.componentPath,
        sort: data.sort,
        visible: data.isVisible,
        cached: data.isCache,
        icon: data.icon,
        appId: data.appId,
        additional: data.additionalInfo ? JSON.parse(data.additionalInfo) : {},
      }

      const response = await addMenu(params)
      console.log('创建菜单响应:', response)
      
      if (response.code === 0) {
        console.log('菜单创建成功，显示 toast')
        toast.success('菜单创建成功')
        onSubmit?.(data)
        onOpenChange(false)
        form.reset()
        setSelectedParentMenu(null)
        setSelectedApp(null)
      } else {
        console.log('菜单创建失败，code:', response.code, 'msg:', response.msg)
        toast.error(response.msg || '创建失败')
      }
    } catch (error) {
      console.error('创建菜单失败:', error)
      toast.error('创建菜单失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
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
          <Form {...form}>
            <FormConfigProvider labelAlign="right">
              <form id="create-menu-form" onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6 pb-20">
                {/* 第一行：菜单名称和菜单编码 */}
                <FormFields
                  control={form.control}
                  columns={2}
                  gap="gap-8"
                  fields={[
                    { name: 'name', label: '菜单名称', placeholder: '请输入菜单名称' },
                    { name: 'code', label: '菜单编码', placeholder: '例如: system:menu:list' },
                  ]}
                />

              {/* 第二行：菜单类型和菜单状态 */}
              <FormFields
                control={form.control}
                columns={2}
                gap="gap-8"
                fields={[
                  {
                    name: 'type',
                    label: '菜单类型',
                    type: 'select',
                    placeholder: '选择菜单类型',
                    options: menuTypeOptions.map(option => ({
                      label: option.label,
                      value: option.value,
                    })),
                  },
                  {
                    name: 'status',
                    label: '菜单状态',
                    type: 'select',
                    placeholder: '选择菜单状态',
                    options: [
                      { label: '启用', value: '启用' },
                      { label: '禁用', value: '禁用' },
                    ],
                  },
                ]}
              />

              {/* 第三行：父级菜单和排序 */}
              <div className="grid grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="parentMenu"
                  render={() => {
                    const isModuleType = (() => {
                      const moduleOption = menuTypeOptions.find(option => option.label === '模块')
                      return moduleOption ? menuType === moduleOption.value : false
                    })()
                    
                    return (
                      <FormItem className="flex items-center gap-3">
                        <FormLabel className="w-20 text-right shrink-0">父级菜单</FormLabel>
                        <div className="flex-1">
                          <FormControl>
                            <div className="relative">
                              <Input
                                value={selectedParentMenu?.menuName || ''}
                                placeholder={isModuleType ? '模块类型不允许选择父级菜单' : '点击选择父级菜单'}
                                readOnly
                                disabled={isModuleType}
                                onClick={() => !isModuleType && handleOpenParentMenuDialog()}
                                className="cursor-pointer"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )
                  }}
                />
                <FormFieldWrapper
                  control={form.control}
                  config={{
                    name: 'sort',
                    label: '排序',
                    type: 'number',
                    placeholder: '0',
                  }}
                />
              </div>

              {/* 第四行：路由路径和组件路径 */}
              <FormFields
                control={form.control}
                columns={2}
                gap="gap-8"
                fields={[
                  { name: 'routePath', label: '路由路径', placeholder: '例如: /views/menu/index' },
                  { name: 'componentPath', label: '组件路径', placeholder: '例如: views/menu/index.vue' },
                ]}
              />

              {/* 第五行：图标和应用ID */}
              <div className="grid grid-cols-2 gap-8">
                <FormFieldWrapper
                  control={form.control}
                  config={{
                    name: 'icon',
                    label: '图标',
                    placeholder: '例如: menu',
                  }}
                />
                <FormField
                  control={form.control}
                  name="appId"
                  render={() => (
                    <FormItem className="flex items-center gap-3">
                      <FormLabel className="w-20 text-right shrink-0">应用ID</FormLabel>
                      <div className="flex-1">
                        <FormControl>
                          <div className="relative">
                            <Input
                              value={selectedApp?.appName || ''}
                              placeholder="点击选择应用"
                              readOnly
                              onClick={handleOpenAppSelector}
                              className="cursor-pointer"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* 第六行：开关选项 */}
              <FormFields
                control={form.control}
                columns={2}
                gap="gap-8"
                fields={[
                  { name: 'isVisible', label: '是否可见', type: 'switch' },
                  { name: 'isCache', label: '是否缓存', type: 'switch' },
                ]}
              />

              {/* 第七行：附加信息 */}
              <FormFieldWrapper
                control={form.control}
                config={{
                  name: 'additionalInfo',
                  label: '附加信息',
                  type: 'textarea',
                  placeholder: '例如: {"key": "value"}',
                  inputClassName: 'min-h-[100px]',
                }}
              />
              </form>
            </FormConfigProvider>
          </Form>
        </div>

        {/* 底部浮动按钮 */}
        <div className="sticky bottom-0 bg-background border-t p-4 flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              form.reset()
              form.clearErrors()
              setSelectedParentMenu(null)
              setSelectedApp(null)
              onOpenChange(false)
            }}
          >
            取消
          </Button>
          <Button 
            type="submit" 
            form="create-menu-form"
            disabled={submitting}
          >
            {submitting ? '创建中...' : '创建菜单'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>

    {/* 父级菜单选择对话框 */}
    <ParentMenuSelector
      open={parentMenuDialogOpen}
      onOpenChange={setParentMenuDialogOpen}
      onSelect={handleSelectParentMenu}
      menuTypeOptions={menuTypeOptions}
      currentMenuType={(() => {
        const selectedType = menuTypeOptions.find(opt => opt.value === menuType)
        return selectedType ? parseInt(selectedType.code) : undefined
      })()}
    />

    {/* 应用选择对话框 */}
    <AppSelector
      open={appSelectorOpen}
      onOpenChange={setAppSelectorOpen}
      onSelect={handleSelectApp}
    />
    </>
  )
}
