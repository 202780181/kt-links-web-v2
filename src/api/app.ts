import api, { type ApiResponse } from '@/services/base';

/**
 * 应用数据接口
 */
export interface AppItem {
	id: string;
	createTs: string;
	updateTs: string;
	appName: string;
	appCode: string;
	appStatus: number;
	icon: string;
	additional: Record<string, any>;
}

/**
 * 应用分页查询参数
 */
export interface AppPageParams {
	size: number;
	cursorId?: string;
	cursorCreateTs?: string;
	cursorType?: string;
}

/**
 * 应用分页响应数据
 */
export interface AppPageResponse {
	data: AppItem[];
	total: number;
	size: number;
	hasNext: boolean;
	hasPrevious: boolean;
	nextCursor?: string;
	prevCursor?: string;
	cursorType?: string;
}

/**
 * 获取应用分页列表
 */
export const getAppPageList = async (params: AppPageParams): Promise<ApiResponse<AppPageResponse>> => {
	return await api.get<ApiResponse<AppPageResponse>>('/api/sys/app/page-list', { params });
};

/**
 * 获取应用详情
 */
export const getAppById = async (id: string): Promise<ApiResponse<AppItem>> => {
	return await api.get<ApiResponse<AppItem>>(`/api/sys/app/details?id=${id}`);
};

/**
 * 创建应用
 */
export const addApp = async (params: Omit<AppItem, 'id' | 'createTs' | 'updateTs'>): Promise<ApiResponse<boolean>> => {
	return await api.post<ApiResponse<boolean>>('/api/sys/app/add', params);
};

/**
 * 更新应用
 */
export const updateApp = async (id: string, params: Partial<Omit<AppItem, 'id' | 'createTs' | 'updateTs'>>): Promise<ApiResponse<boolean>> => {
	const updateParams = { ...params, id };
	return await api.post<ApiResponse<boolean>>('/api/sys/app/update', updateParams);
};

/**
 * 删除应用
 */
export const deleteApps = async (ids: string[]): Promise<ApiResponse<boolean>> => {
	return await api.del<ApiResponse<boolean>>('/api/sys/app/delete', { ids });
};

