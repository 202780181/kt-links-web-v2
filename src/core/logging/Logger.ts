/**
 * 统一日志系统 - 借鉴 Dify 的日志管理机制
 * 支持分级日志、结构化日志、远程上报等功能
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
	timestamp: number;
	level: LogLevel;
	message: string;
	context?: Record<string, any>;
	tags?: string[];
	source?: string;
	userId?: string;
	sessionId?: string;
	requestId?: string;
	stack?: string;
}

export interface LoggerConfig {
	level: LogLevel;
	enableConsole: boolean;
	enableRemote: boolean;
	enableStorage: boolean;
	remoteEndpoint?: string;
	maxStorageEntries: number;
	batchSize: number;
	flushInterval: number; // milliseconds
	includeStack: boolean;
}

class Logger {
	private config: LoggerConfig;
	private logBuffer: LogEntry[] = [];
	private flushTimer?: NodeJS.Timeout;
	private sessionId: string;

	private static readonly levelPriority: Record<LogLevel, number> = {
		debug: 0,
		info: 1,
		warn: 2,
		error: 3,
		fatal: 4
	};

	constructor(config: Partial<LoggerConfig> = {}) {
		this.config = {
			level: 'info',
			enableConsole: true,
			enableRemote: false,
			enableStorage: true,
			maxStorageEntries: 1000,
			batchSize: 10,
			flushInterval: 5000, // 5 seconds
			includeStack: false,
			...config
		};

		this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
		this.init();
	}

	/**
	 * 初始化日志系统
	 */
	private init(): void {
		// 启动定期刷新
		if (this.config.enableRemote || this.config.enableStorage) {
			this.startPeriodicFlush();
		}

		// 监听页面卸载，确保日志被保存
		if (typeof window !== 'undefined') {
			window.addEventListener('beforeunload', () => {
				this.flush();
			});

			// 监听未捕获的错误
			window.addEventListener('error', (event) => {
				this.error('Uncaught error', {
					message: event.message,
					filename: event.filename,
					lineno: event.lineno,
					colno: event.colno,
					stack: event.error?.stack
				}, ['uncaught', 'error']);
			});

			// 监听未处理的 Promise 拒绝
			window.addEventListener('unhandledrejection', (event) => {
				this.error('Unhandled promise rejection', {
					reason: event.reason,
					stack: event.reason?.stack
				}, ['unhandled', 'promise', 'rejection']);
			});
		}
	}

	/**
	 * 记录调试日志
	 */
	debug(message: string, context?: Record<string, any>, tags?: string[]): void {
		this.log('debug', message, context, tags);
	}

	/**
	 * 记录信息日志
	 */
	info(message: string, context?: Record<string, any>, tags?: string[]): void {
		this.log('info', message, context, tags);
	}

	/**
	 * 记录警告日志
	 */
	warn(message: string, context?: Record<string, any>, tags?: string[]): void {
		this.log('warn', message, context, tags);
	}

	/**
	 * 记录错误日志
	 */
	error(message: string, context?: Record<string, any>, tags?: string[]): void {
		this.log('error', message, context, tags);
	}

	/**
	 * 记录致命错误日志
	 */
	fatal(message: string, context?: Record<string, any>, tags?: string[]): void {
		this.log('fatal', message, context, tags);
	}

	/**
	 * 记录日志条目
	 */
	private log(level: LogLevel, message: string, context?: Record<string, any>, tags?: string[]): void {
		// 检查日志级别
		if (Logger.levelPriority[level] < Logger.levelPriority[this.config.level]) {
			return;
		}

		const entry: LogEntry = {
			timestamp: Date.now(),
			level,
			message,
			context,
			tags,
			sessionId: this.sessionId,
			source: this.getSource()
		};

		// 添加堆栈信息（仅对错误级别或配置要求时）
		if ((level === 'error' || level === 'fatal' || this.config.includeStack) && typeof Error !== 'undefined') {
			const stack = new Error().stack;
			entry.stack = stack?.split('\n').slice(2).join('\n'); // 移除当前函数的堆栈
		}

		// 输出到控制台
		if (this.config.enableConsole) {
			this.logToConsole(entry);
		}

		// 添加到缓冲区
		this.logBuffer.push(entry);

		// 如果是严重错误，立即刷新
		if (level === 'fatal' || level === 'error') {
			setTimeout(() => this.flush(), 0);
		}

		// 检查缓冲区大小
		if (this.logBuffer.length >= this.config.batchSize) {
			this.flush();
		}
	}

	/**
	 * 输出到控制台
	 */
	private logToConsole(entry: LogEntry): void {
		const timestamp = new Date(entry.timestamp).toISOString();
		const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
		const message = `${prefix} ${entry.message}`;

		const consoleMethod = this.getConsoleMethod(entry.level);

		if (entry.context || entry.tags) {
			consoleMethod(message, {
				context: entry.context,
				tags: entry.tags,
				sessionId: entry.sessionId,
				stack: entry.stack
			});
		} else {
			consoleMethod(message);
		}
	}

	/**
	 * 获取对应的控制台方法
	 */
	private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
		switch (level) {
			case 'debug':
				return console.debug;
			case 'info':
				return console.info;
			case 'warn':
				return console.warn;
			case 'error':
			case 'fatal':
				return console.error;
			default:
				return console.log;
		}
	}

	/**
	 * 获取日志来源信息
	 */
	private getSource(): string {
		if (typeof window !== 'undefined') {
			return `${window.location.pathname}${window.location.search}`;
		}
		return 'unknown';
	}

	/**
	 * 刷新日志缓冲区
	 */
	async flush(): Promise<void> {
		if (this.logBuffer.length === 0) {
			return;
		}

		const entries = [...this.logBuffer];
		this.logBuffer = [];

		// 存储到本地存储
		if (this.config.enableStorage) {
			this.storeToLocal(entries);
		}

		// 发送到远程服务器
		if (this.config.enableRemote && this.config.remoteEndpoint) {
			await this.sendToRemote(entries);
		}
	}

	/**
	 * 存储到本地存储
	 */
	private storeToLocal(entries: LogEntry[]): void {
		if (typeof localStorage === 'undefined') return;

		try {
			const existingLogs = this.getStoredLogs();
			const allLogs = [...existingLogs, ...entries];

			// 限制存储条目数量
			const logsToStore = allLogs.slice(-this.config.maxStorageEntries);

			localStorage.setItem('app_logs', JSON.stringify(logsToStore));
		} catch (error) {
			console.warn('Failed to store logs to localStorage:', error);
		}
	}

	/**
	 * 发送到远程服务器
	 */
	private async sendToRemote(entries: LogEntry[]): Promise<void> {
		try {
			const response = await fetch(this.config.remoteEndpoint!, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					logs: entries,
					sessionId: this.sessionId,
					userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
					url: typeof window !== 'undefined' ? window.location.href : undefined
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
		} catch (error) {
			console.warn('Failed to send logs to remote server:', error);

			// 如果远程发送失败，重新加入缓冲区
			this.logBuffer.unshift(...entries);
		}
	}

	/**
	 * 获取存储的日志
	 */
	getStoredLogs(): LogEntry[] {
		if (typeof localStorage === 'undefined') return [];

		try {
			const logsJson = localStorage.getItem('app_logs');
			return logsJson ? JSON.parse(logsJson) : [];
		} catch (error) {
			console.warn('Failed to parse stored logs:', error);
			return [];
		}
	}

	/**
	 * 清除存储的日志
	 */
	clearStoredLogs(): void {
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('app_logs');
		}
	}

	/**
	 * 获取日志统计信息
	 */
	getLogStats(timeRange?: { start: number; end: number; }): Record<LogLevel, number> {
		const logs = this.getStoredLogs();
		const filteredLogs = timeRange
			? logs.filter(log => log.timestamp >= timeRange.start && log.timestamp <= timeRange.end)
			: logs;

		const stats: Record<LogLevel, number> = {
			debug: 0,
			info: 0,
			warn: 0,
			error: 0,
			fatal: 0
		};

		for (const log of filteredLogs) {
			stats[log.level]++;
		}

		return stats;
	}

	/**
	 * 搜索日志
	 */
	searchLogs(query: {
		level?: LogLevel[];
		message?: string;
		tags?: string[];
		timeRange?: { start: number; end: number; };
	}): LogEntry[] {
		const logs = this.getStoredLogs();

		return logs.filter(log => {
			// 级别过滤
			if (query.level && !query.level.includes(log.level)) {
				return false;
			}

			// 消息过滤
			if (query.message && !log.message.toLowerCase().includes(query.message.toLowerCase())) {
				return false;
			}

			// 标签过滤
			if (query.tags && query.tags.length > 0) {
				if (!log.tags || !query.tags.some(tag => log.tags!.includes(tag))) {
					return false;
				}
			}

			// 时间范围过滤
			if (query.timeRange) {
				if (log.timestamp < query.timeRange.start || log.timestamp > query.timeRange.end) {
					return false;
				}
			}

			return true;
		});
	}

	/**
	 * 启动定期刷新
	 */
	private startPeriodicFlush(): void {
		this.flushTimer = setInterval(() => {
			this.flush();
		}, this.config.flushInterval);
	}

	/**
	 * 停止定期刷新
	 */
	private stopPeriodicFlush(): void {
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = undefined;
		}
	}

	/**
	 * 更新配置
	 */
	updateConfig(newConfig: Partial<LoggerConfig>): void {
		this.config = { ...this.config, ...newConfig };

		// 重新启动定期刷新
		this.stopPeriodicFlush();
		if (this.config.enableRemote || this.config.enableStorage) {
			this.startPeriodicFlush();
		}
	}

	/**
	 * 创建子日志器
	 */
	createChild(source: string, defaultContext?: Record<string, any>): Logger {
		const child = new Logger(this.config);
		child.sessionId = this.sessionId;

		// 重写 log 方法以添加默认上下文
		const originalLog = child.log.bind(child);
		child.log = (level: LogLevel, message: string, context?: Record<string, any>, tags?: string[]) => {
			const mergedContext = { ...defaultContext, ...context };
			originalLog(level, `[${source}] ${message}`, mergedContext, tags);
		};

		return child;
	}

	/**
	 * 销毁日志器
	 */
	destroy(): void {
		this.stopPeriodicFlush();
		this.flush(); // 最后一次刷新
	}
}

// 全局日志器实例
export const logger = new Logger();

export default Logger;
