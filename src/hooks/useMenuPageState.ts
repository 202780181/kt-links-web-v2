/**
 * 菜单页状态管理 Hook
 * 用于在菜单列表页和详情页之间保存和恢复状态
 */

import { useCallback } from 'react';
import { globalStore } from '@/core/store/GlobalStore';
import { menuPageStoreModule, type MenuPageState } from '@/core/store/modules/menuPageStore';

// 注册模块（只注册一次）
let isRegistered = false;
if (!isRegistered) {
	globalStore.registerModule(menuPageStoreModule);
	isRegistered = true;
}

export const useMenuPageState = () => {
	// 获取当前状态
	const getState = useCallback((): MenuPageState => {
		return globalStore.getModuleState<MenuPageState>('menuPage') || menuPageStoreModule.initialState;
	}, []);

	// 保存完整状态
	const saveState = useCallback((state: Partial<MenuPageState>) => {
		globalStore.dispatch({
			type: 'menuPage/saveState',
			payload: state,
		});
	}, []);

	// 更新分页
	const updatePagination = useCallback((pagination: Partial<MenuPageState['pagination']>) => {
		globalStore.dispatch({
			type: 'menuPage/updatePagination',
			payload: pagination,
		});
	}, []);

	// 更新游标
	const updateCursor = useCallback((cursorInfo: MenuPageState['cursorInfo']) => {
		globalStore.dispatch({
			type: 'menuPage/updateCursor',
			payload: cursorInfo,
		});
	}, []);

	// 更新选中项
	const updateSelectedRows = useCallback((selectedRowKeys: React.Key[]) => {
		globalStore.dispatch({
			type: 'menuPage/updateSelectedRows',
			payload: selectedRowKeys,
		});
	}, []);

	// 更新滚动位置
	const updateScrollPosition = useCallback((position: number) => {
		globalStore.dispatch({
			type: 'menuPage/updateScrollPosition',
			payload: position,
		});
	}, []);

	// 重置状态
	const resetState = useCallback(() => {
		globalStore.dispatch({
			type: 'menuPage/resetState',
		});
	}, []);

	// 检查状态是否有效（例如，超过30分钟则认为过期）
	const isStateValid = useCallback((maxAge: number = 30 * 60 * 1000): boolean => {
		const state = getState();
		if (!state.lastVisitTime) return false;
		return Date.now() - state.lastVisitTime < maxAge;
	}, [getState]);

	return {
		getState,
		saveState,
		updatePagination,
		updateCursor,
		updateSelectedRows,
		updateScrollPosition,
		resetState,
		isStateValid,
	};
};

