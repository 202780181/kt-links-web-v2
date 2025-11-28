import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { Building2, List } from 'lucide-react'
import { toast } from 'sonner'
import useSWR from 'swr'

import { 
  getOrgTypeText, 
  getOrgTypeVariant,
  fetchOrgPageList,
  type OrgItem,
  type OrgPageParams
} from '@/api/organization'
import { formatTimestamp } from '@/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/table'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface OrgDetailData {
  id: string
  orgName?: string
  orgType?: number
  parentId?: string
  createTs?: string
  updateTs?: string
}

const OrganizationDetailPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [orgDetail] = useState<OrgDetailData | null>(() => {
    // 从路由 state 中获取组织信息
    const state = location.state as { orgItem?: OrgItem } | undefined
    return state?.orgItem || null
  })

  // 获取子组织列表
  const subOrgParams: OrgPageParams = {
    size: 100,
    parentGroupId: orgDetail?.id
  }
  
  const { data: subOrgResponse, isLoading: subOrgLoading } = useSWR(
    orgDetail?.id ? ['/api/sys/org/page-list', JSON.stringify(subOrgParams)] : null,
    () => fetchOrgPageList(subOrgParams),
    {
      revalidateOnFocus: false,
    }
  )

  const subOrgs = subOrgResponse?.data?.data ?? []
  const subOrgCount = subOrgs.length

  useEffect(() => {
    // 如果没有从路由传递的数据，重定向到列表页
    if (!orgDetail) {
      toast.error('未找到组织信息，请从列表页重新进入')
      navigate('/organizations', { replace: true })
    }
  }, [orgDetail, navigate])

  // 返回列表
  const handleGoBack = () => {
    navigate('/organizations')
  }

  // 子组织点击处理
  const handleSubOrgClick = (org: OrgItem) => {
    navigate(`/organizations/${org.id}`, {
      state: { orgItem: org }
    })
  }

  // 子组织表格列定义
  const subOrgColumns: ColumnDef<OrgItem>[] = [
    {
      accessorKey: 'orgName',
      header: '组织名称',
      cell: ({ row }) => (
        <button
          onClick={() => handleSubOrgClick(row.original)}
          className="text-left hover:text-primary hover:underline"
        >
          {row.getValue('orgName')}
        </button>
      ),
    },
    {
      accessorKey: 'orgType',
      header: '组织类型',
      cell: ({ row }) => {
        const type = row.getValue('orgType') as number
        return (
          <Badge variant={getOrgTypeVariant(type)}>
            {getOrgTypeText(type)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'createTs',
      header: '创建时间',
      cell: ({ row }) => {
        const createTs = row.getValue('createTs') as string
        return createTs ? formatTimestamp(createTs) : '-'
      },
    },
    {
      accessorKey: 'updateTs',
      header: '更新时间',
      cell: ({ row }) => {
        const updateTs = row.getValue('updateTs') as string
        return updateTs ? formatTimestamp(updateTs) : '-'
      },
    },
  ]

  if (!orgDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">未找到组织信息</h2>
        <p className="text-muted-foreground mb-4">该组织可能已被删除或不存在</p>
      </div>
    )
  }

  return (
    <div className="flex p-6 flex-col gap-6">
      {/* 面包屑导航 */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                href="/organizations" 
                className="cursor-pointer hover:text-primary"
                onClick={(e) => {
                  e.preventDefault()
                  handleGoBack()
                }}
              >
                组织管理
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{orgDetail.orgName || '组织详情'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* 组织信息 */}
      <div className="p-3">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {/* 组织名称 */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground w-20 shrink-0">组织名称</span>
            <span className="text-sm font-medium">{orgDetail.orgName || '-'}</span>
          </div>

          {/* 组织类型 */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground w-20 shrink-0">组织类型</span>
            <span className="text-sm">{getOrgTypeText(orgDetail.orgType || 0)}</span>
          </div>

          {/* 父级名称 */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground w-20 shrink-0">父级名称</span>
            <span className="text-sm">{orgDetail.parentId || '顶级组织'}</span>
          </div>

          {/* 组织编码 */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground w-20 shrink-0">组织编码</span>
            <span className="text-sm font-mono">{orgDetail.id}</span>
          </div>

          {/* 创建时间 */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground w-20 shrink-0">创建时间</span>
            <span className="text-sm">
              {orgDetail.createTs ? formatTimestamp(orgDetail.createTs) : '-'}
            </span>
          </div>

          {/* 更新时间 */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground w-20 shrink-0">更新时间</span>
            <span className="text-sm">
              {orgDetail.updateTs ? formatTimestamp(orgDetail.updateTs) : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* 子组织 Tab */}
      <Tabs defaultValue="suborg" className="w-full">
        <TabsList>
          <TabsTrigger value="suborg" className="gap-2">
            <List className="h-4 w-4" />
            子组织 ({subOrgCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suborg" className="space-y-4">
					{subOrgCount > 0 ? (
						<DataTable
							columns={subOrgColumns}
							data={subOrgs}
							loading={subOrgLoading}
						/>
					) : (
						<div className="flex items-center justify-center h-32 text-muted-foreground">
							<span>暂无子组织</span>
						</div>
					)}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default OrganizationDetailPage