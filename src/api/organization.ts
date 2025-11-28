import api, { type ApiResponse } from '@/services/base'

// 组织查询参数接口
export interface OrgPageParams {
  size?: number           // 分页大小，默认10
  cursorId?: string       // 游标ID，第一次查询传空
  cursorCreateTs?: string // 游标创建时间，第一次查询传空
  cursorType?: string     // 游标类型，up_上一页 down_下一页
  groupName?: string      // 组织名称模糊查询
  parentGroupId?: string  // 父级组织ID，用于查询子组织
}

// 组织项接口
export interface OrgItem {
  id: string
  createTs: string        // 数据创建时间，自创建开始不可更新
  updateTs: string        // 数据更新时会修改该字段
  parentId: string        // 父级组织ID
  orgName: string         // 组织名称
  orgType: number         // 组织类型 0-集团公司 1-公司 2-子公司 3-部门 4-团队 5-项目组
}

// 分页响应接口
export interface OrgPageResponse {
  size: number
  total: number
  hasNext: boolean
  hasPrevious: boolean
  nextCursor: string
  prevCursor: string
  cursorType: string
  cursorCreateTs?: string
  data: OrgItem[]
}

// 添加组织参数接口
export interface AddOrgParams {
  parentId: string
  orgName: string
  orgType: number
}

// 更新组织参数接口
export interface UpdateOrgParams {
  id: string
  parentId: string
  orgName: string
  orgType: number
}

// 获取组织类型文本
export const getOrgTypeText = (type: number): string => {
  const typeMap: Record<number, string> = {
    0: '集团公司',
    1: '公司',
    2: '子公司',
    3: '部门',
    4: '团队',
    5: '项目组',
  }
  return typeMap[type] || `--`
}

// 获取组织类型颜色
export const getOrgTypeVariant = (type: number) => {
  const variantMap: Record<number, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    0: 'default',     // 集团公司
    1: 'secondary',   // 公司
    2: 'outline',     // 子公司
    3: 'secondary',   // 部门
    4: 'outline',     // 团队
    5: 'outline',     // 项目组
  }
  return variantMap[type] || 'outline'
}

// SWR Fetcher: 获取组织列表
export const fetchOrgPageList = async (params: OrgPageParams): Promise<ApiResponse<OrgPageResponse>> => {
  return api.get('/api/sys/org/page-list', { params })
}

// SWR Mutator: 删除组织
export const fetchDeleteOrg = async (_url: string, { arg: ids }: { arg: string[] }) => {
  return api.del('/api/sys/org/delete', { ids })
}

// 添加组织
export const addOrg = async (params: AddOrgParams): Promise<ApiResponse<any>> => {
  return api.post('/api/sys/org/add', params)
}

// 更新组织
export const updateOrg = async (params: UpdateOrgParams): Promise<ApiResponse<any>> => {
  return api.post('/api/sys/org/update', params)
}


