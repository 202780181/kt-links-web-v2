import { get } from '@/services/base';

// 系统类型选项接口
export interface SystemTypeOption {
	code: string;
	value: string;
	label: string;
}

// 系统类型响应接口
export interface SystemTypeResponse {
	code: number;
	msg: string;
	data: SystemTypeOption[];
}

/**
 * 获取菜单类型列表
 * @returns Promise<SystemTypeResponse>
 */
export const getMenuTypeList = async (): Promise<SystemTypeResponse> => {
	return get<SystemTypeResponse>('/api/sys/types/menu-type');
};

/**
 * 通用系统类型获取函数
 * @param typeEndpoint - 类型接口端点（如 'menu-type', 'user-type' 等）
 * @returns Promise<SystemTypeResponse>
 */
export const getSystemTypeList = async (typeEndpoint: string): Promise<SystemTypeResponse> => {
	return get<SystemTypeResponse>(`/api/sys/types/${typeEndpoint}`);
};
