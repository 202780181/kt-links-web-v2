import api, { type ApiResponse } from '@/services/base';
import type { Fetcher } from 'swr';

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
	size?: number;           // 分页大小，默认50
	cursorId?: string;       // 游标ID，第一次查询传空
	cursorCreateTs?: string; // 游标创建时间，第一次查询传空
	cursorType?: string;     // 游标类型，up_上一页 down_下一页
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
	cursorCreateTs?: string;
}

/**
 * 新增应用参数接口
 */
export interface AddAppParams {
	appName: string;
	appCode: string;
	appStatus: number;
	icon?: string;
	additional?: Record<string, any>;
}

/**
 * 更新应用参数接口
 */
export interface UpdateAppParams extends AddAppParams {
	id: string;
}

/**
 * 获取应用分页列表
 */
export const getAppPageList = (params: AppPageParams): Promise<ApiResponse<AppPageResponse>> => {
	return api.get('/api/sys/app/page-list', { params });
};

/**
 * 获取应用详情
 */
export const getAppById = (id: string): Promise<ApiResponse<AppItem>> => {
	return api.get(`/api/sys/app/details?id=${id}`);
};

/**
 * 新增应用
 */
export const addApp = (params: AddAppParams): Promise<ApiResponse<boolean>> => {
	return api.post('/api/sys/app/add', params);
};

/**
 * 更新应用
 */
export const updateApp = (params: UpdateAppParams): Promise<ApiResponse<boolean>> => {
	return api.post('/api/sys/app/update', params);
};

/**
 * 删除应用
 */
export const deleteApps = (ids: string[]): Promise<ApiResponse<boolean>> => {
	return api.del('/api/sys/app/delete', { ids });
};

/**
 * SWR Fetcher: 获取应用分页列表
 * 用法: useSWR(params, fetchAppPageList)
 */
export const fetchAppPageList: Fetcher<ApiResponse<AppPageResponse>, AppPageParams> = (params) => {
	return getAppPageList(params);
};

/**
 * SWR Mutation Fetcher: 删除应用
 * 用法: useSWRMutation('key', fetchDeleteApp)
 */
export const fetchDeleteApp = (_: string, { arg: ids }: { arg: string[] }) => {
	return deleteApps(ids);
};
