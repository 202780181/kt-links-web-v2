/**
 * 全局状态管理系统导出文件
 */

// 核心类和实例
export { default as GlobalStore, globalStore } from './GlobalStore';
export type {
	StoreAction,
	StoreModule,
	StoreListener,
	StoreMiddleware,
	GlobalState
} from './GlobalStore';

// React 集成
export { default as StoreProvider, useStoreContext, withStore, connectStore } from './StoreProvider';

// Hooks
export {
	useGlobalStore,
	useSelector,
	useDispatch,
	useUser,
	useApp,
	useSession,
	useBatchDispatch,
	useAsyncAction,
	useLocalStorageSync,
	useStateHistory,
	useDebouncedDispatch,
	useThrottledDispatch
} from './hooks';

// 便捷的动作创建器
export const actions = {
	// 用户动作
	user: {
		setProfile: (profile: any) => ({
			type: 'user/setProfile' as const,
			payload: profile
		}),
		setAuthenticated: (isAuthenticated: boolean) => ({
			type: 'user/setAuthenticated' as const,
			payload: isAuthenticated
		}),
		updatePreferences: (preferences: Record<string, any>) => ({
			type: 'user/updatePreferences' as const,
			payload: preferences
		}),
		setPermissions: (permissions: string[]) => ({
			type: 'user/setPermissions' as const,
			payload: permissions
		})
	},

	// 应用动作
	app: {
		setLanguage: (language: string) => ({
			type: 'app/setLanguage' as const,
			payload: language
		}),
		setSidebarCollapsed: (collapsed: boolean) => ({
			type: 'app/setSidebarCollapsed' as const,
			payload: collapsed
		}),
		setLoading: (loading: boolean) => ({
			type: 'app/setLoading' as const,
			payload: loading
		}),
		setError: (error: string | null) => ({
			type: 'app/setError' as const,
			payload: error
		}),
		addNotification: (notification: any) => ({
			type: 'app/addNotification' as const,
			payload: {
				id: `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
				timestamp: Date.now(),
				...notification
			}
		}),
		removeNotification: (id: string) => ({
			type: 'app/removeNotification' as const,
			payload: id
		})
	},


	// 会话动作
	session: {
		updateActivity: () => ({
			type: 'session/updateActivity' as const
		}),
		setTemporaryData: (key: string, value: any) => ({
			type: 'session/setTemporaryData' as const,
			payload: { key, value }
		}),
		clearTemporaryData: (key?: string) => ({
			type: 'session/clearTemporaryData' as const,
			payload: key
		})
	}
};

// 选择器工厂函数
export const selectors = {
	// 用户选择器
	user: {
		profile: (state: any) => state.user.profile,
		isAuthenticated: (state: any) => state.user.isAuthenticated,
		preferences: (state: any) => state.user.preferences,
		permissions: (state: any) => state.user.permissions,
		hasPermission: (permission: string) => (state: any) =>
			state.user.permissions.includes(permission)
	},

	// 应用选择器
	app: {
		language: (state: any) => state.app.language,
		sidebarCollapsed: (state: any) => state.app.sidebarCollapsed,
		loading: (state: any) => state.app.loading,
		error: (state: any) => state.app.error,
		notifications: (state: any) => state.app.notifications,
		unreadNotifications: (state: any) =>
			state.app.notifications.filter((n: any) => !n.read)
	},


	// 会话选择器
	session: {
		sessionId: (state: any) => state.session.sessionId,
		startTime: (state: any) => state.session.startTime,
		lastActivity: (state: any) => state.session.lastActivity,
		temporaryData: (state: any) => state.session.temporaryData,
		getTemporaryData: (key: string) => (state: any) =>
			state.session.temporaryData[key],
		sessionDuration: (state: any) =>
			Date.now() - state.session.startTime
	}
};

// 工具函数
export const storeUtils = {
	/**
	 * 创建模块动作类型
	 */
	createActionType: (module: string, action: string) => `${module}/${action}`,

	/**
	 * 创建异步动作
	 */
	createAsyncAction: (type: string) => ({
		request: `${type}/request`,
		success: `${type}/success`,
		failure: `${type}/failure`
	}),

	/**
	 * 批量创建动作
	 */
	createBatchAction: (actions: any[]) => ({
		type: '@@BATCH',
		payload: actions,
		meta: {
			timestamp: Date.now(),
			source: 'batch',
			batch: true
		}
	}),

	/**
	 * 创建条件动作
	 */
	createConditionalAction: (
		condition: (state: any) => boolean,
		action: any
	) => (state: any) => {
		return condition(state) ? action : null;
	},

	/**
	 * 创建延迟动作
	 */
	createDelayedAction: (action: any, delay: number) => {
		return new Promise<any>((resolve) => {
			setTimeout(() => resolve(action), delay);
		});
	}
};

// 导入并重新导出全局 store 实例
import { globalStore } from './GlobalStore';
export default globalStore;
