/**
 * 全局状态管理系统 - 借鉴 Dify 的状态管理架构
 * 支持模块化状态、持久化、中间件等功能
 */

import { logger } from '@/core/logging/Logger';

export type StoreListener = (state: GlobalState, prevState: GlobalState) => void;
export type StoreMiddleware = (action: StoreAction, state: GlobalState, next: (action: StoreAction) => void) => void;

export interface StoreAction {
	type: string;
	payload?: any;
	meta?: {
		timestamp: number;
		source?: string;
		batch?: boolean;
	};
}

export interface StoreModule {
	name: string;
	initialState: any;
	reducers: Record<string, (state: any, action: StoreAction) => any>;
	actions?: Record<string, (...args: any[]) => StoreAction>;
	selectors?: Record<string, (state: any) => any>;
	middleware?: StoreMiddleware[];
	persistKeys?: string[]; // 需要持久化的状态键
}

export interface GlobalState {
	// 用户相关状态
	user: {
		profile: Record<string, unknown> | null;
		preferences: Record<string, unknown>;
		permissions: string[];
		isAuthenticated: boolean;
	};

	// 应用相关状态
	app: {
		language: string;
		sidebarCollapsed: boolean;
		loading: boolean;
		error: string | null;
		notifications: Record<string, unknown>[];
	};


	// 缓存和会话状态
	session: {
		sessionId: string;
		startTime: number;
		lastActivity: number;
		temporaryData: Record<string, unknown>;
	};
}

class GlobalStore {
	private state: GlobalState;
	private readonly modules = new Map<string, StoreModule>();
	private readonly listeners = new Set<StoreListener>();
	private middleware: StoreMiddleware[] = [];
	private isDispatching = false;
	private actionHistory: StoreAction[] = [];
	private readonly persistenceKeys: Set<string> = new Set();

	constructor() {
		this.state = this.getInitialState();
		// Initialize asynchronously to avoid constructor side effects
		setTimeout(() => this.init(), 0);
	}

	/**
	 * 获取初始状态
	 */
	private getInitialState(): GlobalState {
		return {
			user: {
				profile: null,
				preferences: {},
				permissions: [],
				isAuthenticated: false
			},
			app: {
				language: 'zh-CN',
				sidebarCollapsed: false,
				loading: false,
				error: null,
				notifications: []
			},
			session: {
				sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
				startTime: Date.now(),
				lastActivity: Date.now(),
				temporaryData: {}
			}
		};
	}

	/**
	 * 初始化存储
	 */
	private async init(): Promise<void> {
		// 从持久化存储恢复状态
		await this.restorePersistedState();

		// 注册内置中间件
		this.registerBuiltinMiddleware();

		// 注册内置模块
		this.registerBuiltinModules();

		logger.info('Global store initialized', {
			sessionId: this.state.session.sessionId
		}, ['store', 'init']);
	}

	/**
	 * 注册模块
	 */
	registerModule(module: StoreModule): void {
		if (this.modules.has(module.name)) {
			logger.warn(`Module ${module.name} already exists, overwriting`, {}, ['store', 'module']);
		}

		this.modules.set(module.name, module);

		// 初始化模块状态
		if (!(module.name in this.state)) {
			(this.state as any)[module.name] = module.initialState;
		}

		// 注册中间件
		if (module.middleware) {
			this.middleware.push(...module.middleware);
		}

		// 注册持久化键
		if (module.persistKeys) {
			module.persistKeys.forEach((key: string) => {
				this.persistenceKeys.add(`${module.name}.${key}`);
			});
		}

		logger.info(`Module ${module.name} registered`, {}, ['store', 'module']);
	}

	/**
	 * 分发动作
	 */
	dispatch(action: StoreAction): void {
		if (this.isDispatching) {
			throw new Error('Cannot dispatch action while dispatching');
		}

		// 添加元数据
		action.meta = {
			timestamp: Date.now(),
			source: action.meta?.source || 'unknown',
			batch: action.meta?.batch || false,
			...action.meta
		};

		const prevState = this.cloneState();

		try {
			this.isDispatching = true;

			// 执行中间件链
			this.executeMiddleware(action, (finalAction) => {
				this.executeAction(finalAction);
			});

			// 记录动作历史
			this.actionHistory.push(action);
			if (this.actionHistory.length > 100) {
				this.actionHistory.shift();
			}

			// 通知监听器
			this.notifyListeners(this.state, prevState);

			// 异步持久化
			setTimeout(() => this.persistState(), 0);

		} finally {
			this.isDispatching = false;
		}
	}

	/**
	 * 批量分发动作
	 */
	batchDispatch(actions: StoreAction[]): void {
		const batchAction: StoreAction = {
			type: '@@BATCH',
			payload: actions,
			meta: {
				timestamp: Date.now(),
				source: 'batch',
				batch: true
			}
		};

		this.dispatch(batchAction);
	}

	/**
	 * 执行中间件链
	 */
	private executeMiddleware(action: StoreAction, next: (action: StoreAction) => void): void {
		let index = 0;

		const executeNext = (currentAction: StoreAction) => {
			if (index >= this.middleware.length) {
				next(currentAction);
				return;
			}

			const middleware = this.middleware[index++];
			middleware(currentAction, this.state, executeNext);
		};

		executeNext(action);
	}

	/**
	 * 执行动作
	 */
	private executeAction(action: StoreAction): void {
		if (action.type === '@@BATCH') {
			// 批量处理
			const actions = action.payload as StoreAction[];
			actions.forEach(batchAction => {
				this.executeAction(batchAction);
			});
			return;
		}

		// 查找对应的模块和 reducer
		const [moduleName, actionType] = action.type.split('/');
		const module = this.modules.get(moduleName);

		if (!module) {
			logger.warn(`No module found for action: ${action.type}`, { action }, ['store', 'action']);
			return;
		}

		const reducer = module.reducers[actionType];
		if (!reducer) {
			logger.warn(`No reducer found for action: ${action.type}`, { action }, ['store', 'action']);
			return;
		}

		// 执行 reducer
		const moduleState = (this.state as any)[moduleName];
		const newModuleState = reducer(moduleState, action);

		if (newModuleState !== moduleState) {
			(this.state as any)[moduleName] = newModuleState;

			logger.debug(`Action ${action.type} executed`, {
				action,
				prevState: moduleState,
				newState: newModuleState
			}, ['store', 'action']);
		}
	}

	/**
	 * 获取状态
	 */
	getState(): GlobalState {
		return this.cloneState();
	}

	/**
	 * 获取模块状态
	 */
	getModuleState<T>(moduleName: string): T | undefined {
		return (this.state as any)[moduleName];
	}

	/**
	 * 选择状态片段
	 */
	select<T>(selector: (state: GlobalState) => T): T {
		return selector(this.state);
	}

	/**
	 * 订阅状态变化
	 */
	subscribe(listener: StoreListener): () => void {
		this.listeners.add(listener);

		return () => {
			this.listeners.delete(listener);
		};
	}

	/**
	 * 通知监听器
	 */
	private notifyListeners(state: GlobalState, prevState: GlobalState): void {
		this.listeners.forEach(listener => {
			try {
				listener(state, prevState);
			} catch (error) {
				logger.error('Error in store listener', { error }, ['store', 'listener']);
			}
		});
	}

	/**
	 * 克隆状态
	 */
	private cloneState(): GlobalState {
		return JSON.parse(JSON.stringify(this.state));
	}

	/**
	 * 持久化状态
	 */
	private async persistState(): Promise<void> {
		try {
			const persistData: Record<string, any> = {};

			for (const key of this.persistenceKeys) {
				const value = this.getNestedValue(this.state, key);
				if (value !== undefined) {
					persistData[key] = value;
				}
			}

			// 使用 localStorage 进行持久化
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('global_store_state', JSON.stringify(persistData));
			}

		} catch (error) {
			logger.error('Failed to persist state', { error }, ['store', 'persist']);
		}
	}

	/**
	 * 恢复持久化状态
	 */
	private async restorePersistedState(): Promise<void> {
		try {
			// 从 localStorage 恢复持久化数据
			let persistedData: Record<string, any> | null = null;
			if (typeof localStorage !== 'undefined') {
				const stored = localStorage.getItem('global_store_state');
				if (stored) {
					persistedData = JSON.parse(stored);
				}
			}

			if (persistedData) {
				for (const [key, value] of Object.entries(persistedData)) {
					this.setNestedValue(this.state, key, value);
				}

				logger.info('Restored persisted state', { keys: Object.keys(persistedData) }, ['store', 'persist']);
			}

		} catch (error) {
			logger.error('Failed to restore persisted state', { error }, ['store', 'persist']);
		}
	}

	/**
	 * 获取嵌套值
	 */
	private getNestedValue(obj: any, path: string): any {
		return path.split('.').reduce((current, key) => current?.[key], obj);
	}

	/**
	 * 设置嵌套值
	 */
	private setNestedValue(obj: any, path: string, value: any): void {
		const keys = path.split('.');
		const lastKey = keys.pop()!;
		const target = keys.reduce((current, key) => {
			if (!(key in current)) {
				current[key] = {};
			}
			return current[key];
		}, obj);

		target[lastKey] = value;
	}

	/**
	 * 注册内置中间件
	 */
	private registerBuiltinMiddleware(): void {
		// 日志中间件
		this.middleware.push((action, _state, next) => {
			const start = performance.now();

			logger.debug(`Dispatching action: ${action.type}`, {
				action,
				timestamp: action.meta?.timestamp
			}, ['store', 'action']);

			next(action);

			const duration = performance.now() - start;
			logger.debug(`Action ${action.type} completed`, {
				duration: `${duration.toFixed(2)}ms`
			}, ['store', 'action']);
		});

		// 错误处理中间件
		this.middleware.push((action, _state, next) => {
			try {
				next(action);
			} catch (error) {
				logger.error(`Error processing action: ${action.type}`, {
					action,
					error: error instanceof Error ? error.message : String(error)
				}, ['store', 'error']);

				// 分发错误动作
				if (action.type !== 'app/setError') {
					this.dispatch({
						type: 'app/setError',
						payload: error instanceof Error ? error.message : String(error)
					});
				}
			}
		});
	}

	/**
	 * 注册内置模块
	 */
	private registerBuiltinModules(): void {
		// 用户模块
		this.registerModule({
			name: 'user',
			initialState: this.state.user,
			reducers: {
				setProfile: (state: any, action: StoreAction) => ({
					...state,
					profile: action.payload
				}),
				setAuthenticated: (state: any, action: StoreAction) => ({
					...state,
					isAuthenticated: action.payload
				}),
				updatePreferences: (state: any, action: StoreAction) => ({
					...state,
					preferences: { ...state.preferences, ...action.payload }
				}),
				setPermissions: (state: any, action: StoreAction) => ({
					...state,
					permissions: action.payload
				})
			},
			persistKeys: ['profile', 'preferences', 'isAuthenticated']
		});

		// 应用模块
		this.registerModule({
			name: 'app',
			initialState: this.state.app,
			reducers: {
				setLanguage: (state: any, action: StoreAction) => ({
					...state,
					language: action.payload
				}),
				setSidebarCollapsed: (state: any, action: StoreAction) => ({
					...state,
					sidebarCollapsed: action.payload
				}),
				setLoading: (state: any, action: StoreAction) => ({
					...state,
					loading: action.payload
				}),
				setError: (state: any, action: StoreAction) => ({
					...state,
					error: action.payload
				}),
				addNotification: (state: any, action: StoreAction) => ({
					...state,
					notifications: [...state.notifications, action.payload]
				}),
				removeNotification: (state: any, action: StoreAction) => ({
					...state,
					notifications: state.notifications.filter((n: any) => n.id !== action.payload)
				})
			},
			persistKeys: ['language', 'sidebarCollapsed']
		});


		// 会话模块
		this.registerModule({
			name: 'session',
			initialState: this.state.session,
			reducers: {
				updateActivity: (state: any) => ({
					...state,
					lastActivity: Date.now()
				}),
				setTemporaryData: (state: any, action: StoreAction) => ({
					...state,
					temporaryData: {
						...state.temporaryData,
						[action.payload.key]: action.payload.value
					}
				}),
				clearTemporaryData: (state: any, action: StoreAction) => {
					const newTempData = { ...state.temporaryData };
					if (action.payload) {
						delete newTempData[action.payload];
					} else {
						Object.keys(newTempData).forEach((key: string) => delete newTempData[key]);
					}
					return {
						...state,
						temporaryData: newTempData
					};
				}
			}
		});
	}

	/**
	 * 获取动作历史
	 */
	getActionHistory(): StoreAction[] {
		return [...this.actionHistory];
	}

	/**
	 * 重置状态
	 */
	reset(): void {
		this.state = this.getInitialState();
		this.actionHistory = [];
		logger.info('Store reset', {}, ['store', 'reset']);
	}

	/**
	 * 销毁存储
	 */
	destroy(): void {
		this.listeners.clear();
		this.modules.clear();
		this.middleware = [];
		this.persistState(); // 最后一次持久化
	}
}

// 全局存储实例
export const globalStore = new GlobalStore();

export default GlobalStore;
