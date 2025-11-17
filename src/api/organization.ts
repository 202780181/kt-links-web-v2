import api, { type ApiResponse } from '@/services/base';

// 组织类型选项接口
export interface OrgTypeOption {
	code: number;    // 字典code
	value: string;   // 字典值
}

// 组织查询参数接口
export interface OrgPageParams {
	size?: number;              // 分页大小，默认10
	cursorId?: string;          // 游标ID
	cursorCreateTs?: string;    // 游标创建时间
	cursorType?: string;        // 游标类型，up_上一页 down_下一页
	parentGroupId?: number;     // 父组织ID，没有默认为0
	groupName?: string;         // 组织名称模糊搜索
	orgType?: number;           // 组织类型筛选
}

// 组织项接口
export interface OrgItem {
	id: string;
	createTs: string;
	updateTs: string;
	parentId: string;           // 父级组织ID
	orgName: string;            // 组织名称
	orgType: number;            // 组织类型
	additional?: Record<string, any>; // 附加信息（可选）
}

// 分页响应接口
export interface OrgPageResponse {
	size: number;
	total: number;
	hasNext: boolean;
	hasPrevious: boolean;
	nextCursor: string;
	prevCursor: string;
	cursorType: string;
	data: OrgItem[];
}

// 新增组织参数接口
export interface AddOrgParams {
	orgName: string;            // 组织名称
	parentId: string;           // 父级组织ID
	orgType: number;            // 组织类型
	additional?: Record<string, any>; // 附加信息（可选）
}

// 更新组织参数接口
export interface UpdateOrgParams extends AddOrgParams {
	id: string;                 // 组织ID
}

// 类型已在上面导出，无需重复导出

// 获取组织分页列表
export const getOrgPageList = (params: OrgPageParams): Promise<ApiResponse<OrgPageResponse>> => {
	return api.get('/api/sys/org/page-list', { params });
};

// 删除组织
export const deleteOrgs = (ids: string[]): Promise<ApiResponse<any>> => {
	return api.del('/api/sys/org/delete', { ids });
};

// 新增组织
export const addOrg = (params: AddOrgParams): Promise<ApiResponse<any>> => {
	return api.post('/api/sys/org/add', params);
};

// 更新组织
export const updateOrg = (params: UpdateOrgParams): Promise<ApiResponse<any>> => {
	return api.post('/api/sys/org/update', params);
};

// 获取组织树结构
export const getOrgTree = (): Promise<ApiResponse<OrgItem[]>> => {
	return api.get('/api/sys/org/tree');
};

// 获取组织类型列表
export const getOrgTypeList = (): Promise<ApiResponse<OrgTypeOption[]>> => {
	return api.get('/api/sys/types/org-type');
};

// 工具函数：根据组织类型获取对应的文本
export const getOrgTypeText = (orgType: number, orgTypeOptions: OrgTypeOption[]): string => {
	const option = orgTypeOptions.find(opt => opt.code === orgType);
	return option ? option.value : '未知';
};
