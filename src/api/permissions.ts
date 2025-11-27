import api, { type ApiResponse } from '@/services/base';
import type { Fetcher } from 'swr';

// 权限码类型选项接口
export interface AuthCodeTypeOption {
	code: string;
	value: string;
}

// 权限码查询参数接口
export interface AuthCodePageParams {
	size?: number;           // 分页大小，默认10
	cursorId?: string;       // 游标ID，第一次查询传空
	cursorCreateTs?: string; // 游标创建时间，第一次查询传空
	cursorType?: string;     // 游标类型，up_上一页 down_下一页
	name_like?: string;      // 权限码名称模糊搜索
}

// 权限码项接口
export interface AuthCodeItem {
	id: string;
	createTs: string;
	updateTs: string;
	name: string;                    // 权限码名称
	authCodeStatus: number;          // 状态
	moduleCode: string;              // 权限码模块
	groupCode: string;               // 组
	actionCode: string;              // 动作码/接口码
	category: string;                // 权限码类别
	defaultEffect: string;           // 默认效果
	autoAssign: string;              // 自动授予
	autoAssignEffect: string;        // 自动授予效果
	additional: Record<string, any>; // json 附加
}

// 新增权限码参数接口
export interface AddAuthCodeParams {
	name: string;                    // 权限码名称
	authCodeStatus: number;          // 状态
	moduleCode: string;              // 权限码模块
	groupCode: string;               // 组
	actionCode: string;              // 动作码/接口码
	category: string;                // 权限码类别
	defaultEffect: string;           // 默认效果
	autoAssign: string;              // 自动授予
	autoAssignEffect: string;        // 自动授予效果
	additional?: Record<string, any>; // json 附加（可选）
}

// 更新权限码参数接口（包含 id）
export interface UpdateAuthCodeParams extends AddAuthCodeParams {
	id: string;                      // 权限码ID
}

// 分页响应接口
export interface AuthCodePageResponse {
	size: number;
	total: number;
	hasNext: boolean;
	hasPrevious: boolean;
	nextCursor: string;
	prevCursor: string;
	cursorType: string;
	data: AuthCodeItem[];
}

// 获取权限码分页列表
export const getAuthCodePageList = (params: AuthCodePageParams): Promise<ApiResponse<AuthCodePageResponse>> => {
	return api.get('/api/auth/a-code/page-list', { params });
};

// 删除权限码
export const deleteAuthCodes = (ids: string[]): Promise<ApiResponse<any>> => {
	return api.del('/api/auth/a-code/delete', { ids });
};

// 新增权限码
export const addAuthCode = (params: AddAuthCodeParams): Promise<ApiResponse<any>> => {
	return api.post('/api/auth/a-code/add', params);
};

// 更新权限码
export const updateAuthCode = (params: UpdateAuthCodeParams): Promise<ApiResponse<any>> => {
	return api.post('/api/auth/a-code/update', params);
};

// 获取权限码类别列表
export const getAuthCodeCategoryList = (): Promise<ApiResponse<AuthCodeTypeOption[]>> => {
	return api.get('/api/auth/types/auth-code-category');
};

// 获取权限效果列表（默认效果、自动授予效果）
export const getAuthCodeEffectList = (): Promise<ApiResponse<AuthCodeTypeOption[]>> => {
	return api.get('/api/auth/types/auth-effect');
};

// 获取权限码自动授予类型列表
export const getAuthCodeAutoAssignList = (): Promise<ApiResponse<AuthCodeTypeOption[]>> => {
	return api.get('/api/auth/types/auth-code-category');
};


/**
 * SWR Fetcher: 获取权限码分页列表
 * 用法: useSWR({ params }, fetchAuthCodePageList)
 */
export const fetchAuthCodePageList: Fetcher<ApiResponse<AuthCodePageResponse>, AuthCodePageParams> = (params) => {
	return getAuthCodePageList(params);
};

/**
 * SWR Mutation Fetcher: 删除权限码
 * 用法: useSWRMutation('key', fetchDeleteAuthCode)
 */
export const fetchDeleteAuthCode = (_: string, { arg: ids }: { arg: string[] }) => {
	return deleteAuthCodes(ids);
};

