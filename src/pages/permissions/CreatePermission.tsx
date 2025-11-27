import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { FormFields, FormFieldWrapper, FormConfigProvider } from '@/components/form/FormFieldWrapper'
import {
  addAuthCode,
  updateAuthCode,
  getAuthCodeCategoryList,
  getAuthCodeEffectList,
  getAuthCodeAutoAssignList,
  type AuthCodeItem,
  type AddAuthCodeParams,
  type UpdateAuthCodeParams,
  type AuthCodeTypeOption,
} from '@/api/permissions'
import { toast } from 'sonner'

interface CreatePermissionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: () => void
  editData?: AuthCodeItem | null
}

// Zod Schema 定义
const permissionFormSchema = z.object({
  name: z.string().min(1, '请输入权限码名称'),
  authCodeStatus: z.string(),
  moduleCode: z.string().min(1, '请输入模块码'),
  groupCode: z.string().min(1, '请输入组码'),
  actionCode: z.string().min(1, '请输入动作码'),
  category: z.string().min(1, '请选择类别'),
  defaultEffect: z.string().min(1, '请选择默认效果'),
  autoAssign: z.string().min(1, '请选择自动授予'),
  autoAssignEffect: z.string().min(1, '请选择自动授予效果'),
  additional: z.string().optional(),
})

type PermissionFormData = z.infer<typeof permissionFormSchema>

export function CreatePermissionDrawer({ 
  open, 
  onOpenChange, 
  onSubmit,
  editData 
}: CreatePermissionDrawerProps) {
  const [submitting, setSubmitting] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState<AuthCodeTypeOption[]>([])
  const [effectOptions, setEffectOptions] = useState<AuthCodeTypeOption[]>([])
  const [autoAssignOptions, setAutoAssignOptions] = useState<AuthCodeTypeOption[]>([])

  const isEditMode = !!editData

  const form = useForm<PermissionFormData>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: {
      name: '',
      authCodeStatus: '1',
      moduleCode: '',
      groupCode: '',
      actionCode: '',
      category: '',
      defaultEffect: '',
      autoAssign: '',
      autoAssignEffect: '',
      additional: '',
    },
  })

  // 加载类型选项
  useEffect(() => {
    const loadTypeOptions = async () => {
      try {
        const [categoryRes, effectRes, autoAssignRes] = await Promise.all([
          getAuthCodeCategoryList(),
          getAuthCodeEffectList(),
          getAuthCodeAutoAssignList(),
        ])

        let newCategoryOptions: AuthCodeTypeOption[] = []
        let newEffectOptions: AuthCodeTypeOption[] = []
        let newAutoAssignOptions: AuthCodeTypeOption[] = []

        if (categoryRes.code === 0 && categoryRes.data) {
          newCategoryOptions = categoryRes.data
          setCategoryOptions(categoryRes.data)
        }
        if (effectRes.code === 0 && effectRes.data) {
          newEffectOptions = effectRes.data
          setEffectOptions(effectRes.data)
        }
        if (autoAssignRes.code === 0 && autoAssignRes.data) {
          newAutoAssignOptions = autoAssignRes.data
          setAutoAssignOptions(autoAssignRes.data)
        }

        // 如果是新增模式且没有编辑数据，设置默认值
        if (!isEditMode && newCategoryOptions.length > 0 && newEffectOptions.length > 0 && newAutoAssignOptions.length > 0) {
          form.setValue('category', String(newCategoryOptions[0].code))
          form.setValue('defaultEffect', String(newEffectOptions[0].code))
          form.setValue('autoAssignEffect', String(newEffectOptions[0].code))
          form.setValue('autoAssign', String(newAutoAssignOptions[0].code))
        }
      } catch (error) {
        console.error('加载类型选项失败:', error)
        toast.error('加载选项失败')
      }
    }

    if (open) {
      loadTypeOptions()
    }
  }, [open, isEditMode, form])

  // 编辑模式时填充数据
  useEffect(() => {
    if (open && editData) {
      form.reset({
        name: editData.name,
        authCodeStatus: String(editData.authCodeStatus),
        moduleCode: editData.moduleCode,
        groupCode: editData.groupCode,
        actionCode: editData.actionCode,
        category: String(editData.category),
        defaultEffect: String(editData.defaultEffect),
        autoAssign: String(editData.autoAssign),
        autoAssignEffect: String(editData.autoAssignEffect),
        additional: editData.additional ? JSON.stringify(editData.additional, null, 2) : '',
      })
    }
  }, [open, editData, form])

  const onFormSubmit = async (data: PermissionFormData) => {
    setSubmitting(true)
    try {
      // 解析附加信息
      let additionalData = {}
      if (data.additional && data.additional.trim()) {
        try {
          additionalData = JSON.parse(data.additional)
        } catch (error) {
          toast.error('附加信息格式错误，请输入有效的 JSON')
          setSubmitting(false)
          return
        }
      }

      const baseParams = {
        name: data.name,
        authCodeStatus: Number(data.authCodeStatus),
        moduleCode: data.moduleCode,
        groupCode: data.groupCode,
        actionCode: data.actionCode,
        category: data.category,
        defaultEffect: data.defaultEffect,
        autoAssign: data.autoAssign,
        autoAssignEffect: data.autoAssignEffect,
        additional: additionalData,
      }

      let response
      if (isEditMode && editData) {
        const updateParams: UpdateAuthCodeParams = {
          ...baseParams,
          id: editData.id,
        }
        response = await updateAuthCode(updateParams)
      } else {
        const addParams: AddAuthCodeParams = baseParams
        response = await addAuthCode(addParams)
      }

      if (response.code === 0) {
        toast.success(isEditMode ? '更新权限码成功' : '添加权限码成功')
        onOpenChange(false)
        form.reset()
        onSubmit?.()
      } else {
        toast.error(response.message || response.msg || (isEditMode ? '更新权限码失败' : '添加权限码失败'))
      }
    } catch (error) {
      console.error(`${isEditMode ? '更新' : '添加'}权限码失败:`, error)
      toast.error(`${isEditMode ? '更新' : '添加'}权限码失败，请稍后重试`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        // 关闭时重置表单
        form.reset()
      }
      onOpenChange(isOpen)
    }}>
      <SheetContent 
        className="w-[800px] sm:max-w-[800px] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
            {isEditMode ? '编辑权限码' : '新增权限码'}
          </SheetTitle>
          <SheetDescription>
            {isEditMode ? '修改权限码信息' : '填写下面的信息来创建新的权限码'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <FormConfigProvider labelAlign="right" labelWidth="w-[90px]">
              <form id="permission-form" onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6 pr-5">
                {/* 第一行：权限码名称和状态 */}
                <FormFields
                  control={form.control}
                  columns={2}
                  gap="gap-8"
                  fields={[
                    { name: 'name', label: '权限码名称', placeholder: '请输入权限码名称' },
                    {
                      name: 'authCodeStatus',
                      label: '状态',
                      type: 'select',
                      placeholder: '请选择状态',
                      options: [
                        { label: '启用', value: '1' },
                        { label: '禁用', value: '0' },
                      ],
                    },
                  ]}
                />

                {/* 第二行：模块码和组码 */}
                <FormFields
                  control={form.control}
                  columns={2}
                  gap="gap-8"
                  fields={[
                    { name: 'moduleCode', label: '模块码', placeholder: '例如: sys' },
                    { name: 'groupCode', label: '组码', placeholder: '例如: user' },
                  ]}
                />

                {/* 第三行：动作码/接口码 和 类别 */}
                <FormFields
                  control={form.control}
                  columns={2}
                  gap="gap-8"
                  fields={[
                    { name: 'actionCode', label: '动作码/接口码', placeholder: '例如: view' },
                    ...(categoryOptions.length > 0 ? [{
                      name: 'category' as const,
                      label: '类别',
                      type: 'select' as const,
                      placeholder: '请选择权限码类别',
                      options: categoryOptions.map(option => ({
                        label: option.value,
                        value: String(option.code),
                      })),
                    }] : []),
                  ]}
                />

                {/* 第四行：默认效果 和 自动授予 */}
                {effectOptions.length > 0 && autoAssignOptions.length > 0 && (
                  <FormFields
                    control={form.control}
                    columns={2}
                    gap="gap-8"
                    fields={[
                      {
                        name: 'defaultEffect',
                        label: '默认效果',
                        type: 'select',
                        placeholder: '请选择默认效果',
                        options: effectOptions.map(option => ({
                          label: option.value,
                          value: String(option.code),
                        })),
                      },
                      {
                        name: 'autoAssign',
                        label: '自动授予',
                        type: 'select',
                        placeholder: '请选择自动授予类型',
                        options: autoAssignOptions.map(option => ({
                          label: option.value,
                          value: String(option.code),
                        })),
                      },
                    ]}
                  />
                )}

                {/* 第五行：自动授予效果 */}
                {effectOptions.length > 0 && (
                  <div className="grid grid-cols-2 gap-8">
                    <FormFieldWrapper
                      control={form.control}
                      config={{
                        name: 'autoAssignEffect',
                        label: '自动授予效果',
                        type: 'select',
                        placeholder: '请选择自动授予效果',
                        options: effectOptions.map(option => ({
                          label: option.value,
                          value: String(option.code),
                        })),
                      }}
                    />
                  </div>
                )}

                {/* 第六行：附加信息 */}
                <FormFieldWrapper
                  control={form.control}
                  config={{
                    name: 'additional',
                    label: '附加信息',
                    type: 'textarea',
                    placeholder: '请输入附加信息（JSON格式，例如: {"key": "value"})',
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
              onOpenChange(false)
            }}
          >
            取消
          </Button>
          <Button 
            type="submit" 
            form="permission-form"
            disabled={submitting}
          >
            {submitting ? (isEditMode ? '保存中...' : '创建中...') : (isEditMode ? '保存' : '创建')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
