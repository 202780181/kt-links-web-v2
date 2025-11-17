/**
 * 全局状态提供者组件 - 为应用提供状态管理上下文
 */

import React, { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { globalStore, type GlobalState, type StoreAction } from './GlobalStore';
import { logger } from '@/core/logging/Logger';

interface StoreContextValue {
	state: GlobalState;
	dispatch: (action: StoreAction) => void;
	store: typeof globalStore;
}

const StoreContext = createContext<StoreContextValue | null>(null);

interface StoreProviderProps {
	children: ReactNode;
	initialState?: Partial<GlobalState>;
	enableDevTools?: boolean;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({
	children,
	initialState,
	enableDevTools = process.env.NODE_ENV === 'development'
}) => {
	const [state, setState] = React.useState<GlobalState>(globalStore.getState());

	useEffect(() => {
		// 如果提供了初始状态，合并到全局状态中
		if (initialState) {
			Object.entries(initialState).forEach(([key, value]) => {
				if (value !== undefined) {
					globalStore.dispatch({
						type: `${key}/setState`,
						payload: value,
						meta: {
							timestamp: Date.now(),
							source: 'StoreProvider'
						}
					});
				}
			});
		}

		// 订阅状态变化
		const unsubscribe = globalStore.subscribe((newState) => {
			setState(newState);
		});

		// 启用开发者工具
		if (enableDevTools && typeof window !== 'undefined') {
			setupDevTools();
		}

		logger.info('StoreProvider initialized', {
			enableDevTools,
			hasInitialState: !!initialState
		}, ['store', 'provider']);

		return () => {
			unsubscribe();
			if (enableDevTools && typeof window !== 'undefined') {
				cleanupDevTools();
			}
		};
	}, [initialState, enableDevTools]);

	const contextValue: StoreContextValue = useMemo(() => ({
		state,
		dispatch: globalStore.dispatch.bind(globalStore),
		store: globalStore
	}), [state]);

	return (
		<StoreContext.Provider value={contextValue}>
			{children}
		</StoreContext.Provider>
	);
};

/**
 * 使用 Store 上下文的 Hook
 */
export function useStoreContext(): StoreContextValue {
	const context = useContext(StoreContext);

	if (!context) {
		throw new Error('useStoreContext must be used within a StoreProvider');
	}

	return context;
}

/**
 * 设置开发者工具
 */
function setupDevTools(): void {
	// 将 store 暴露到全局，方便调试
	(window as any).__GLOBAL_STORE__ = globalStore;

	// 添加一些调试方法
	(window as any).__STORE_DEBUG__ = {
		getState: () => globalStore.getState(),
		getHistory: () => globalStore.getActionHistory(),
		dispatch: (action: StoreAction) => globalStore.dispatch(action),
		reset: () => globalStore.reset(),

		// 状态快照
		takeSnapshot: () => {
			const snapshot = {
				timestamp: Date.now(),
				state: globalStore.getState(),
				history: globalStore.getActionHistory()
			};
			console.log('State snapshot:', snapshot);
			return snapshot;
		},

		// 状态比较
		compareSnapshots: (snapshot1: any, snapshot2: any) => {
			console.log('Snapshot comparison:', {
				snapshot1,
				snapshot2,
				diff: findStateDiff(snapshot1.state, snapshot2.state)
			});
		},

		// 模拟动作
		simulateAction: (type: string, payload?: any) => {
			const action: StoreAction = {
				type,
				payload,
				meta: {
					timestamp: Date.now(),
					source: 'devtools'
				}
			};
			globalStore.dispatch(action);
			console.log('Simulated action:', action);
		},

		// 批量动作
		simulateBatch: (actions: Array<{ type: string; payload?: any; }>) => {
			const storeActions = actions.map(({ type, payload }) => ({
				type,
				payload,
				meta: {
					timestamp: Date.now(),
					source: 'devtools-batch'
				}
			}));
			globalStore.batchDispatch(storeActions);
			console.log('Simulated batch actions:', storeActions);
		}
	};

	logger.info('Store dev tools enabled', {
		globalStore: '__GLOBAL_STORE__',
		debugUtils: '__STORE_DEBUG__'
	}, ['store', 'devtools']);
}

/**
 * 清理开发者工具
 */
function cleanupDevTools(): void {
	delete (window as any).__GLOBAL_STORE__;
	delete (window as any).__STORE_DEBUG__;
}

/**
 * 查找状态差异
 */
function findStateDiff(obj1: any, obj2: any, path: string = ''): any[] {
	const diffs: any[] = [];

	const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

	for (const key of keys) {
		const currentPath = path ? `${path}.${key}` : key;
		const val1 = obj1?.[key];
		const val2 = obj2?.[key];

		if (val1 !== val2) {
			if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
				diffs.push(...findStateDiff(val1, val2, currentPath));
			} else {
				diffs.push({
					path: currentPath,
					before: val1,
					after: val2
				});
			}
		}
	}

	return diffs;
}

/**
 * 高阶组件：为组件提供 Store
 */
export function withStore<P extends object>(
	Component: React.ComponentType<P>
): React.ComponentType<P> {
	const WithStoreComponent: React.FC<P> = (props) => {
		return (
			<StoreProvider>
				<Component {...props} />
			</StoreProvider>
		);
	};

	WithStoreComponent.displayName = `withStore(${Component.displayName || Component.name})`;

	return WithStoreComponent;
}

/**
 * Store 连接器高阶组件 - 简化版本
 */
export function connectStore(
	mapStateToProps?: (state: GlobalState, ownProps: any) => any,
	mapDispatchToProps?: (dispatch: (action: StoreAction) => void, ownProps: any) => any
) {
	return function (Component: React.ComponentType<any>): React.ComponentType<any> {
		const ConnectedComponent: React.FC<any> = (ownProps) => {
			const { state, dispatch } = useStoreContext();

			const stateProps = mapStateToProps ? mapStateToProps(state, ownProps) : {};
			const dispatchProps = mapDispatchToProps ? mapDispatchToProps(dispatch, ownProps) : {};

			const combinedProps = {
				...ownProps,
				...stateProps,
				...dispatchProps
			};

			return React.createElement(Component, combinedProps);
		};

		ConnectedComponent.displayName = `connectStore(${Component.displayName || Component.name})`;

		return ConnectedComponent;
	};
}

export default StoreProvider;
