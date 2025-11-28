import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  IconX,
  IconLoader2,
  IconCheck,
} from '@tabler/icons-react'

import {
  addOrg,
  updateOrg,
  fetchOrgPageList,
  getOrgTypeText,
  type OrgItem,
  type AddOrgParams,
  type UpdateOrgParams,
} from '@/api/organization'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatTimestamp } from '@/utils'

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
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/table/data-table'
import type { ColumnDef } from '@tanstack/react-table'

// 表单验证模式
const formSchema = z.object({
  orgName: z.string().min(1, '组织名称不能为空').max(100, '组织名称不能超过100字符'),
  orgType: z.number().min(0).max(5),
  parentId: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

// 父级组织选择器
const ParentOrgSelector = ({
  value,
  onSelect,
  disabled,
}: {
  value?: string
  onSelect: (orgId: string, orgName: string) => void
  disabled?: boolean
}) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [orgs, setOrgs] = useState<OrgItem[]>([])
  const [selectedOrg, setSelectedOrg] = useState<OrgItem | null>(null)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)

  // 获取组织列表
  const fetchOrgs = async () => {
    if (!open) {
      setSelectedOrgId(null)
      return
    }
    try {
      setLoading(true)
      const response = await fetchOrgPageList({ size: 100 })
      setOrgs(response.data?.data || [])
    } catch (error) {
      console.error('获取组织列表失败:', error)
      toast.error('获取组织列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 根据 value 查找选中的组织
  useEffect(() => {
    if (value && orgs.length > 0) {
      const org = orgs.find(o => o.id === value)
      setSelectedOrg(org || null)
    } else {
      setSelectedOrg(null)
    }
  }, [value, orgs])

  // 加载组织列表
  useEffect(() => {
    fetchOrgs()
  }, [open])

  // 处理单选框变化
  const handleRadioChange = (orgId: string) => {
    setSelectedOrgId(orgId)
  }

  // 确认选择
  const handleConfirm = () => {
    if (selectedOrgId) {
      const selectedOrganization = orgs.find(org => org.id === selectedOrgId)
      if (selectedOrganization) {
        onSelect(selectedOrganization.id, selectedOrganization.orgName)
        setOpen(false)
        setSelectedOrgId(null)
      }
    }
  }

  // 清空选择
  const handleClear = () => {
    setSelectedOrgId(null)
    onSelect('', '')
    setOpen(false)
  }

  // 表格列定义
  const columns: ColumnDef<OrgItem>[] = [
    {
      id: 'select',
      header: '选择',
      size: 60,
      cell: ({ row }) => (
        <div className="flex items-center">
          <input
            type="radio"
            name="parent-org-radio"
            checked={selectedOrgId === row.original.id}
            onChange={() => handleRadioChange(row.original.id)}
            className="w-4 h-4 cursor-pointer"
          />
        </div>
      ),
    },
    {
      accessorKey: 'orgName',
      header: '组织名称',
    },
    {
      accessorKey: 'orgType',
      header: '类型',
      size: 100,
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs">
          {getOrgTypeText(row.original.orgType)}
        </Badge>
      ),
    },
    {
      accessorKey: 'parentId',
      header: '父级组织ID',
      size: 150,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.parentId || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'createTs',
      header: '创建时间',
      size: 180,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.createTs ? formatTimestamp(row.original.createTs) : '-'}
        </span>
      ),
    },
  ]

  return (
    <>
      <div className="relative">
        <Input
          value={selectedOrg?.orgName || ''}
          placeholder="点击选择父级组织"
          readOnly
          onClick={() => {
            if (!disabled) {
              setOpen(true)
            }
          }}
          disabled={disabled}
          className="cursor-pointer pr-16"
        />
        {selectedOrg && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => onSelect('', '')}
            disabled={disabled}
          >
            <IconX className="h-3 w-3" />
          </Button>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-[900px] sm:max-w-[900px] flex flex-col">
          <SheetHeader className="pb-6">
            <SheetTitle>选择父级组织</SheetTitle>
            <SheetDescription>
              从列表中选择一个组织作为父级组织
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <DataTable
              columns={columns}
              data={orgs}
              loading={loading}
            />
          </div>

          <div className="sticky bottom-0 bg-background border-t p-4 flex justify-end gap-3">
            <Button variant="outline" onClick={handleClear}>
              清空选择
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedOrgId}>
              确认
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

interface CreateOrgDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
  editData?: OrgItem | null
}

export const CreateOrgDrawer = ({ open, onOpenChange, onSubmit, editData }: CreateOrgDrawerProps) => {
  const [submitting, setSubmitting] = useState(false)
  const isEdit = !!editData

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orgName: '',
      orgType: 0,
      parentId: '',
    },
  })

  // 当编辑数据变化时，重置表单
  useEffect(() => {
    if (editData) {
      form.reset({
        orgName: editData.orgName,
        orgType: editData.orgType,
        parentId: editData.parentId || '',
      })
    } else {
      form.reset({
        orgName: '',
        orgType: 0,
        parentId: '',
      })
    }
  }, [editData, form])

  // 处理父级组织选择
  const handleParentSelect = (orgId: string, _orgName: string) => {
    form.setValue('parentId', orgId || undefined)
  }

  // 提交表单
  const handleSubmit = async (data: FormData) => {
    try {
      setSubmitting(true)

      if (isEdit && editData) {
        const params: UpdateOrgParams = {
          id: editData.id,
          orgName: data.orgName,
          orgType: data.orgType,
          parentId: data.parentId || '',
        }
        await updateOrg(params)
        toast.success('更新组织成功')
      } else {
        const params: AddOrgParams = {
          orgName: data.orgName,
          orgType: data.orgType,
          parentId: data.parentId || '',
        }
        await addOrg(params)
        toast.success('添加组织成功')
      }

      onSubmit()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('提交失败:', error)
      toast.error(isEdit ? '更新组织失败' : '添加组织失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px] flex flex-col pr-5">
        <SheetHeader>
          <SheetTitle>{isEdit ? '编辑组织' : '添加组织'}</SheetTitle>
          <SheetDescription>
            {isEdit ? '修改组织信息' : '请填写组织基本信息'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-6 pb-6">
              {/* 组织名称 */}
              <FormField
                control={form.control}
                name="orgName"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>组织名称</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="请输入组织名称"
                        {...field}
                        disabled={submitting}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 组织类型 */}
              <FormField
                control={form.control}
                name="orgType"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>组织类型</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      disabled={submitting}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="请选择组织类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">集团公司</SelectItem>
                        <SelectItem value="1">公司</SelectItem>
                        <SelectItem value="2">子公司</SelectItem>
                        <SelectItem value="3">部门</SelectItem>
                        <SelectItem value="4">团队</SelectItem>
                        <SelectItem value="5">项目组</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 父级组织 */}
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>父级组织（可选）</FormLabel>
                    <FormControl>
                      <ParentOrgSelector
                        value={field.value}
                        onSelect={handleParentSelect}
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* 固定在底部的按钮区域 */}
        <div className="sticky bottom-0 bg-background border-t p-4 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            取消
          </Button>
          <Button 
            type="submit" 
            disabled={submitting}
            onClick={form.handleSubmit(handleSubmit)}
          >
            {submitting ? (
              <>
                <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEdit ? '更新中...' : '添加中...'}
              </>
            ) : (
              <>
                <IconCheck className="w-4 h-4 mr-2" />
                {isEdit ? '更新' : '添加'}
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}