import { useState, useCallback, useRef } from 'react';

/**
 * 游标信息接口
 */
export interface CursorInfo {
	cursorId: string;
	cursorCreateTs: string;
}

/**
 * 加载数据的参数接口
 */
export interface LoadDataParams {
	pageSize?: number;
	cursorType?: string;
	cursor?: CursorInfo;
	[key: string]: any; // 允许其他自定义参数（如 searchKeyword）
}

/**
 * API 响应数据接口（需要包含游标分页信息）
 */
export interface CursorPaginationResponse<T = any> {
	data: T[];
	total: number;
	hasNext: boolean;
	hasPrevious: boolean;
	nextCursor?: string;
	prevCursor?: string;
}

/**
 * 游标分页 Hook 的返回值接口
 */
export interface UseCursorPaginationReturn {
	// 状态
	pageSize: number;
	total: number;
	hasNext: boolean;
	hasPrevious: boolean;
	cursorInfo: CursorInfo;
	
	// 更新状态的方法
	setPageSize: (size: number) => void;
	setTotal: (total: number) => void;
	setHasNext: (hasNext: boolean) => void;
	setHasPrevious: (hasPrevious: boolean) => void;
	setCursorInfo: (info: CursorInfo) => void;
	
	// 设置加载数据函数
	setLoadDataFn: (fn: (params?: LoadDataParams) => void | Promise<void>) => void;
	
	// 创建加载数据的参数
	createLoadDataParams: (params?: LoadDataParams) => {
		size: number;
		cursorId: string;
		cursorCreateTs: string;
		cursorType: string;
	};
	
	// 处理分页响应数据
	handlePaginationResponse: (response: CursorPaginationResponse, params?: LoadDataParams) => void;
	
	// 重置分页状态
	resetPagination: () => void;
	
	// 分页控制函数
	handlePrevPage: () => void;
	handleNextPage: () => void;
	handlePageSizeChange: (size: number) => void;
	
	// SuperPagination 组件的 props（可以直接展开使用）
	paginationProps: {
		mode: 'cursor';
		total: number;
		pageSize: number;
		hasPrevious: boolean;
		hasNext: boolean;
		onPrevious: () => void;
		onNext: () => void;
		onShowSizeChange: (size: number) => void;
	};
}

/**
 * 游标分页自定义 Hook
 * 
 * @param options - 配置选项
 * @returns 分页状态和控制函数
 * 
 * @example
 * ```tsx
 * const { 
 *   pageSize, 
 *   cursorInfo, 
 *   paginationProps, 
 *   handlePaginationResponse,
 *   createLoadDataParams 
 * } = useCursorPagination();
 * 
 * const loadData = async (params?: LoadDataParams) => {
 *   const requestParams = createLoadDataParams(params);
 *   const response = await getDataFromAPI(requestParams);
 *   handlePaginationResponse(response.data, params);
 * };
 * 
 * // 在 JSX 中使用
 * <SuperPagination {...paginationProps} loading={loading} />
 * ```
 */
export function useCursorPagination(
	options: {
		initialPageSize?: number;
		onReset?: () => void; // 重置时的额外回调（如清空选中项）
	} = {}
): UseCursorPaginationReturn {
	const { initialPageSize = 10, onReset } = options;

	// 分页状态
	const [pageSize, setPageSize] = useState(initialPageSize);
	const [total, setTotal] = useState(0);
	const [hasNext, setHasNext] = useState(false);
	const [hasPrevious, setHasPrevious] = useState(false);
	const [prevCursor, setPrevCursor] = useState<string>('');
	const [nextCursor, setNextCursor] = useState<string>('');
	const [cursorInfo, setCursorInfo] = useState<CursorInfo>({
		cursorId: '',
		cursorCreateTs: '',
	});
	
	// 使用 ref 存储 loadData 函数，避免循环依赖
	const loadDataRef = useRef<((params?: LoadDataParams) => void | Promise<void>) | null>(null);
	
	/**
	 * 设置加载数据函数
	 */
	const setLoadDataFn = useCallback((fn: (params?: LoadDataParams) => void | Promise<void>) => {
		loadDataRef.current = fn;
	}, []);
	
	/**
	 * 创建加载数据的参数（用于组装 API 请求参数）
	 */
	const createLoadDataParams = useCallback((params?: LoadDataParams) => {
		// 使用传入的游标参数或默认使用状态中的游标
		const cursorToUse = params?.cursor || cursorInfo;
		
		return {
			size: params?.pageSize || pageSize,
			cursorId: cursorToUse.cursorId || '',
			cursorCreateTs: cursorToUse.cursorCreateTs || '',
			cursorType: params?.cursorType || ''
		};
	}, [pageSize, cursorInfo]);

	/**
	 * 处理 API 响应中的分页数据
	 */
	const handlePaginationResponse = useCallback((
		response: CursorPaginationResponse,
		params?: LoadDataParams
	) => {
		setTotal(response.total || 0);
		setHasNext(response.hasNext || false);
		setHasPrevious(response.hasPrevious || false);
		setPrevCursor(response.prevCursor || '');
		setNextCursor(response.nextCursor || '');
		
		// 如果提供了游标参数，更新当前游标信息
		if (params?.cursor) {
			setCursorInfo(params.cursor);
		}
	}, []);

	/**
	 * 解析游标字符串为 CursorInfo 对象
	 */
	const parseCursor = useCallback((cursor: string): CursorInfo | null => {
		if (!cursor || !cursor.includes('_')) {
			return null;
		}
		const [cursorCreateTs, cursorId] = cursor.split('_');
		return {
			cursorId: cursorId || '',
			cursorCreateTs: cursorCreateTs || '',
		};
	}, []);

	/**
	 * 处理上一页
	 */
	const handlePrevPage = useCallback(() => {
		if (!hasPrevious || !prevCursor || !loadDataRef.current) return;
		
		const cursor = parseCursor(prevCursor);
		if (cursor) {
			loadDataRef.current({ pageSize, cursorType: 'up', cursor });
		}
	}, [hasPrevious, prevCursor, pageSize, parseCursor]);

	/**
	 * 处理下一页
	 */
	const handleNextPage = useCallback(() => {
		if (!hasNext || !nextCursor || !loadDataRef.current) return;
		
		const cursor = parseCursor(nextCursor);
		if (cursor) {
			loadDataRef.current({ pageSize, cursorType: 'down', cursor });
		}
	}, [hasNext, nextCursor, pageSize, parseCursor]);

	/**
	 * 处理页面大小变化
	 */
	const handlePageSizeChange = useCallback((size: number) => {
		setPageSize(size);
		setCursorInfo({ cursorId: '', cursorCreateTs: '' });
		onReset?.(); // 触发额外的重置回调（如清空选中项）
		if (loadDataRef.current) {
			loadDataRef.current({ pageSize: size });
		}
	}, [onReset]);

	/**
	 * 重置分页状态
	 */
	const resetPagination = useCallback(() => {
		setCursorInfo({ cursorId: '', cursorCreateTs: '' });
		onReset?.(); // 触发额外的重置回调（如清空选中项）
		if (loadDataRef.current) {
			loadDataRef.current({ pageSize });
		}
	}, [pageSize, onReset]);

	// SuperPagination 组件的 props
	const paginationProps = {
		mode: 'cursor' as const,
		total,
		pageSize,
		hasPrevious,
		hasNext,
		onPrevious: handlePrevPage,
		onNext: handleNextPage,
		onShowSizeChange: handlePageSizeChange,
	};

	return {
		// 状态
		pageSize,
		total,
		hasNext,
		hasPrevious,
		cursorInfo,
		
		// 更新状态的方法
		setPageSize,
		setTotal,
		setHasNext,
		setHasPrevious,
		setCursorInfo,
		
		// 设置加载数据函数
		setLoadDataFn,
		
		// 创建加载数据的参数
		createLoadDataParams,
		
		// 处理分页响应数据
		handlePaginationResponse,
		
		// 重置分页状态
		resetPagination,
		
		// 分页控制函数
		handlePrevPage,
		handleNextPage,
		handlePageSizeChange,
		
		// SuperPagination 组件的 props
		paginationProps,
	};
}

