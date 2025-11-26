import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'

import {
  addApp,
  updateApp,
  type AppItem,
} from '@/api/app'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'

// 表单验证 Schema
const appFormSchema = z.object({
  appName: z.string().min(1, '请输入应用名称'),
  appCode: z.string().min(1, '请输入应用编码'),
  appStatus: z.number().min(0).max(1),
  icon: z.string().optional(),
  additional: z.string().optional(),
})

type AppFormValues = z.infer<typeof appFormSchema>

interface CreateAppDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingApp?: AppItem | null
}

export function CreateAppDrawer({
  open,
  onOpenChange,
  onSuccess,
  editingApp,
}: CreateAppDrawerProps) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!editingApp

  const form = useForm<AppFormValues>({
    resolver: zodResolver(appFormSchema),
    defaultValues: {
      appName: '',
      appCode: '',
      appStatus: 1,
      icon: '',
      additional: '',
    },
  })

  // 当编辑应用时，填充表单
  useEffect(() => {
    if (editingApp) {
      form.reset({
        appName: editingApp.appName,
        appCode: editingApp.appCode,
        appStatus: editingApp.appStatus,
        icon: editingApp.icon || '',
        additional: editingApp.additional ? JSON.stringify(editingApp.additional, null, 2) : '',
      })
    } else {
      form.reset({
        appName: '',
        appCode: '',
        appStatus: 1,
        icon: '',
        additional: '',
      })
    }
  }, [editingApp, form])

  const onSubmit = async (values: AppFormValues) => {
    setLoading(true)
    try {
      // 解析 additional 字段
      let additional = {}
      if (values.additional && values.additional.trim()) {
        try {
          additional = JSON.parse(values.additional)
        } catch (e) {
          toast.error('附加信息格式错误，请输入有效的JSON')
          setLoading(false)
          return
        }
      }

      const params = {
        appName: values.appName,
        appCode: values.appCode,
        appStatus: values.appStatus,
        icon: values.icon || '',
        additional,
      }

      if (isEdit && editingApp) {
        // 更新应用
        const response = await updateApp(editingApp.id, params)
        if (response.code === 0) {
          toast.success('应用更新成功')
          onSuccess()
        } else {
          toast.error(response.msg || '更新失败')
        }
      } else {
        // 创建应用
        const response = await addApp(params)
        if (response.code === 0) {
          toast.success('应用创建成功')
          onSuccess()
        } else {
          toast.error(response.msg || '创建失败')
        }
      }
    } catch (error) {
      console.error('提交失败:', error)
      toast.error(isEdit ? '更新应用失败' : '创建应用失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className="w-[600px] sm:max-w-[600px] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
            {isEdit ? '编辑应用' : '创建应用'}
          </SheetTitle>
          <SheetDescription>
            {isEdit ? '修改应用信息' : '填写应用信息以创建新应用'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form id="app-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pr-5">
                <FormField
                  control={form.control}
                  name="appName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>应用名称</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入应用名称" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>应用编码</FormLabel>
                      <FormControl>
                        <Input placeholder="例如: sys-app" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>应用状态</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="请选择应用状态" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">启用</SelectItem>
                          <SelectItem value="0">禁用</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>应用图标</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additional"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>附加信息</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='请输入附加信息（JSON格式）&#10;例如: {"key": "value"}'
                          className="min-h-[100px] font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
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
              form="app-form"
              disabled={loading}
            >
              {loading ? '提交中...' : isEdit ? '保存' : '创建'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }
