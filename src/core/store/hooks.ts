/**
 * 全局状态 React Hooks - 提供便捷的状态访问和更新方法
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { globalStore, type GlobalState, type StoreAction } from './GlobalStore';

/**
 * 使用全局状态的基础 Hook
 */
export function useGlobalStore(): {
	state: GlobalState;
	dispatch: (action: StoreAction) => void;
} {
	const [state, setState] = useState<GlobalState>(globalStore.getState());

	useEffect(() => {
		const unsubscribe = globalStore.subscribe((newState) => {
			setState(newState);
		});

		return unsubscribe;
	}, []);

	const dispatch = useCallback((action: StoreAction) => {
		globalStore.dispatch(action);
	}, []);

	return { state, dispatch };
}

/**
 * 使用状态选择器的 Hook
 */
export function useSelector<T>(selector: (state: GlobalState) => T): T {
	const [selectedState, setSelectedState] = useState<T>(() =>
		selector(globalStore.getState())
	);

	const selectorRef = useRef(selector);
	const prevSelectedStateRef = useRef(selectedState);

	// 更新选择器引用
	selectorRef.current = selector;

	useEffect(() => {
		const unsubscribe = globalStore.subscribe((newState) => {
			const newSelectedState = selectorRef.current(newState);

			// 浅比较，避免不必要的重渲染
			if (newSelectedState !== prevSelectedStateRef.current) {
				prevSelectedStateRef.current = newSelectedState;
				setSelectedState(newSelectedState);
			}
		});

		return unsubscribe;
	}, []);

	return selectedState;
}

/**
 * 使用分发器的 Hook
 */
export function useDispatch(): (action: StoreAction) => void {
	return useCallback((action: StoreAction) => {
		globalStore.dispatch(action);
	}, []);
}

/**
 * 使用用户状态的 Hook
 */
export function useUser() {
	const user = useSelector(state => state.user);
	const dispatch = useDispatch();

	const actions = useMemo(() => ({
		setProfile: (profile: any) => dispatch({
			type: 'user/setProfile',
			payload: profile
		}),

		setAuthenticated: (isAuthenticated: boolean) => dispatch({
			type: 'user/setAuthenticated',
			payload: isAuthenticated
		}),

		updatePreferences: (preferences: Record<string, any>) => dispatch({
			type: 'user/updatePreferences',
			payload: preferences
		}),

		setPermissions: (permissions: string[]) => dispatch({
			type: 'user/setPermissions',
			payload: permissions
		})
	}), [dispatch]);

	return { user, ...actions };
}

/**
 * 使用应用状态的 Hook
 */
export function useApp() {
	const app = useSelector(state => state.app);
	const dispatch = useDispatch();

	const actions = useMemo(() => ({
		setLanguage: (language: string) => dispatch({
			type: 'app/setLanguage',
			payload: language
		}),

		setSidebarCollapsed: (collapsed: boolean) => dispatch({
			type: 'app/setSidebarCollapsed',
			payload: collapsed
		}),

		setLoading: (loading: boolean) => dispatch({
			type: 'app/setLoading',
			payload: loading
		}),

		setError: (error: string | null) => dispatch({
			type: 'app/setError',
			payload: error
		}),

		addNotification: (notification: any) => dispatch({
			type: 'app/addNotification',
			payload: {
				id: `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
				timestamp: Date.now(),
				...notification
			}
		}),

		removeNotification: (id: string) => dispatch({
			type: 'app/removeNotification',
			payload: id
		})
	}), [dispatch]);

	return { app, ...actions };
}


/**
 * 使用会话状态的 Hook
 */
export function useSession() {
	const session = useSelector(state => state.session);
	const dispatch = useDispatch();

	const actions = useMemo(() => ({
		updateActivity: () => dispatch({
			type: 'session/updateActivity'
		}),

		setTemporaryData: (key: string, value: any) => dispatch({
			type: 'session/setTemporaryData',
			payload: { key, value }
		}),

		clearTemporaryData: (key?: string) => dispatch({
			type: 'session/clearTemporaryData',
			payload: key
		})
	}), [dispatch]);

	// 自动更新活动时间
	useEffect(() => {
		const interval = setInterval(() => {
			actions.updateActivity();
		}, 60000); // 每分钟更新一次

		return () => clearInterval(interval);
	}, [actions]);

	return { session, ...actions };
}

/**
 * 使用批量分发的 Hook
 */
export function useBatchDispatch(): (actions: StoreAction[]) => void {
	return useCallback((actions: StoreAction[]) => {
		globalStore.batchDispatch(actions);
	}, []);
}

/**
 * 使用异步动作的 Hook
 */
export function useAsyncAction() {
	const dispatch = useDispatch();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const execute = useCallback(async (
		asyncFn: () => Promise<StoreAction | StoreAction[] | void>,
		options?: {
			onSuccess?: () => void;
			onError?: (error: Error) => void;
			loadingAction?: StoreAction;
			successAction?: StoreAction;
			errorAction?: StoreAction;
		}
	) => {
		try {
			setLoading(true);
			setError(null);

			if (options?.loadingAction) {
				dispatch(options.loadingAction);
			}

			const result = await asyncFn();

			if (result) {
				if (Array.isArray(result)) {
					globalStore.batchDispatch(result);
				} else {
					dispatch(result);
				}
			}

			if (options?.successAction) {
				dispatch(options.successAction);
			}

			options?.onSuccess?.();

		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			setError(errorMessage);

			if (options?.errorAction) {
				dispatch(options.errorAction);
			} else {
				dispatch({
					type: 'app/setError',
					payload: errorMessage
				});
			}

			options?.onError?.(err instanceof Error ? err : new Error(String(err)));

		} finally {
			setLoading(false);
		}
	}, [dispatch]);

	return { execute, loading, error };
}

/**
 * 使用本地状态同步的 Hook
 */
export function useLocalStorageSync<T>(
	key: string,
	selector: (state: GlobalState) => T,
	defaultValue: T
): [T, (value: T) => void] {
	const selectedState = useSelector(selector);

	// 从 localStorage 读取初始值
	const [localValue, setLocalValue] = useState<T>(() => {
		if (typeof window === 'undefined') return defaultValue;

		try {
			const stored = localStorage.getItem(key);
			return stored ? JSON.parse(stored) : defaultValue;
		} catch {
			return defaultValue;
		}
	});

	// 同步到 localStorage
	useEffect(() => {
		try {
			localStorage.setItem(key, JSON.stringify(selectedState));
			setLocalValue(selectedState);
		} catch (error) {
			console.warn(`Failed to sync ${key} to localStorage:`, error);
		}
	}, [key, selectedState]);

	const setValue = useCallback((value: T) => {
		try {
			localStorage.setItem(key, JSON.stringify(value));
			setLocalValue(value);
		} catch (error) {
			console.warn(`Failed to set ${key} in localStorage:`, error);
		}
	}, [key]);

	return [localValue, setValue];
}

/**
 * 使用状态历史的 Hook
 */
export function useStateHistory() {
	const [history] = useState(() => globalStore.getActionHistory());

	const actions = useMemo(() => ({
		getHistory: () => globalStore.getActionHistory(),

		reset: () => globalStore.reset()
	}), []);

	return { history, ...actions };
}

/**
 * 使用防抖分发的 Hook
 */
export function useDebouncedDispatch(delay: number = 300): (action: StoreAction) => void {
	const dispatch = useDispatch();
	const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

	return useCallback((action: StoreAction) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => {
			dispatch(action);
		}, delay);
	}, [dispatch, delay]);
}

/**
 * 使用节流分发的 Hook
 */
export function useThrottledDispatch(delay: number = 300): (action: StoreAction) => void {
	const dispatch = useDispatch();
	const lastCallRef = useRef<number>(0);

	return useCallback((action: StoreAction) => {
		const now = Date.now();

		if (now - lastCallRef.current >= delay) {
			lastCallRef.current = now;
			dispatch(action);
		}
	}, [dispatch, delay]);
}
