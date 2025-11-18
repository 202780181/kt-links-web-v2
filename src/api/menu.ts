import api, { type ApiResponse } from '@/services/base';

// 菜单查询参数接口
interface MenuPageParams {
	size?: number;           // 分页大小，默认10
	cursorId?: string;       // 游标ID，第一次查询传空
	cursorCreateTs?: string; // 游标创建时间，第一次查询传空
	parentId: number | string;        // 父级ID，传0表示查询顶级菜单
	cursorType?: string;     // 游标类型，up_上一页 down_下一页
	menuType?: number;
	menuType_equal?: number; // 菜单类型过滤，可选
}

// 菜单项接口 - 根据实际API返回格式定义
interface MenuItem {
	id: string;
	createTs: string;
	updateTs: string;
	menuStatus: number;
	parentId: string;
	menuName: string;
	menuType: number;
	menuCode: string;
	routePath: string;
	componentPath: string;
	sort: number;
	visible: boolean;
	cached: boolean;
	icon: string;
	additional: Record<string, any>;
	appId: string;
	appName: string | null;
	parentName: string | null;
}

// 分页响应接口 - 根据实际返回格式定义
interface MenuPageResponse {
	size: number;
	total: number;
	hasNext: boolean;
	hasPrevious: boolean;
	nextCursor: string;
	prevCursor: string;
	cursorType: string;
	cursorCreateTs?: string;  // 游标创建时间，可选
	data: MenuItem[];
}

// 添加菜单参数接口
interface AddMenuParams {
	menuStatus: number;     // 菜单状态 0-禁止 1-启用
	parentId: string;       // 父级菜单ID
	menuName: string;       // 菜单名
	menuType: number;       // 菜单类型 0-目录 1-菜单 2-按钮
	menuCode: string;       // 菜单编码，eg: xxx:vvv:fff
	routePath: string;      // 页面路径 eg:views/xx/xx
	componentPath: string;  // 页面组件路径 views/xx/xx/xx.vue
	sort: number;           // 菜单排序 从小到大
	visible: boolean;       // 是否可见 true/false
	cached: boolean;        // 是否可缓存 true/false
	icon: string;           // 图标
	appId: string;          // 应用ID
	additional: Record<string, any>; // 附加
}

/**
 * 获取菜单分页列表
 */
export const getMenuPageList = async (params: MenuPageParams): Promise<ApiResponse<MenuPageResponse>> => {
	return await api.get<ApiResponse<MenuPageResponse>>('/api/sys/menu/page-list', {
		params
	});
};

/**
 * 获取菜单详情
 */
export const getMenuById = async (id: string): Promise<ApiResponse<MenuItem>> => {
	return await api.get<ApiResponse<MenuItem>>(`/api/sys/menu/details?id=${id}`);
};

/**
 * 添加菜单
 */
export const addMenu = async (params: AddMenuParams): Promise<ApiResponse<boolean>> => {
	return await api.post<ApiResponse<boolean>>('/api/sys/menu/add', params);
};

/**
 * 更新菜单
 */
export const updateMenu = async (id: string, params: Partial<AddMenuParams>): Promise<ApiResponse<boolean>> => {
	const updateParams = { ...params, id };
	return await api.post<ApiResponse<boolean>>('/api/sys/menu/update', updateParams);
};

/**
 * 删除菜单
 */
export const deleteMenus = async (ids: string[]): Promise<ApiResponse<boolean>> => {
	return await api.del<ApiResponse<boolean>>('/api/sys/menu/delete', { ids });
};


// 导出类型供其他文件使用
export type {
	MenuPageParams,
	MenuItem,
	MenuPageResponse,
	AddMenuParams
};
