/**
 * 菜单页状态管理模块
 * 用于保存和恢复菜单列表页的状态（分页、选中项、滚动位置等）
 */

import type { StoreModule } from '../GlobalStore';

export interface MenuPageState {
	// 分页信息
	pagination: {
		current: number;
		pageSize: number;
		total: number;
	};
	// 游标信息
	cursorInfo: {
		cursorId: string;
		cursorCreateTs: string;
	};
	// 选中的行
	selectedRowKeys: React.Key[];
	// 滚动位置
	scrollPosition: number;
	// 最后访问时间
	lastVisitTime: number;
}

const initialState: MenuPageState = {
	pagination: {
		current: 1,
		pageSize: 10,
		total: 0,
	},
	cursorInfo: {
		cursorId: '',
		cursorCreateTs: '',
	},
	selectedRowKeys: [],
	scrollPosition: 0,
	lastVisitTime: 0,
};

export const menuPageStoreModule: StoreModule = {
	name: 'menuPage',
	initialState,
	reducers: {
		// 保存完整状态
		saveState: (state: MenuPageState, action) => {
			return {
				...state,
				...action.payload,
				lastVisitTime: Date.now(),
			};
		},
		// 更新分页
		updatePagination: (state: MenuPageState, action) => {
			return {
				...state,
				pagination: {
					...state.pagination,
					...action.payload,
				},
			};
		},
		// 更新游标
		updateCursor: (state: MenuPageState, action) => {
			return {
				...state,
				cursorInfo: action.payload,
			};
		},
		// 更新选中项
		updateSelectedRows: (state: MenuPageState, action) => {
			return {
				...state,
				selectedRowKeys: action.payload,
			};
		},
		// 更新滚动位置
		updateScrollPosition: (state: MenuPageState, action) => {
			return {
				...state,
				scrollPosition: action.payload,
			};
		},
		// 重置状态
		resetState: () => {
			return initialState;
		},
	},
	// 持久化到 sessionStorage（页面刷新后保留，关闭标签页后清除）
	persistKeys: ['pagination', 'cursorInfo', 'selectedRowKeys', 'scrollPosition', 'lastVisitTime'],
};

