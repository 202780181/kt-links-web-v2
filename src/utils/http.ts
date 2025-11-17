/**
 * HTTP 工具函数 - 重新导出 services/base 中的常用方法
 * 这样可以保持简洁的导入路径
 */

export {
	get,
	post,
	put,
	patch,
	del,
	getAuthHeaders,
	mergeHeaders,
	type ApiResponse,
	type ApiError
} from '@/services/base';
