/**
 * 格式化工具函数
 */

/**
 * 格式化时间戳
 */
export const formatTimestamp = (timestamp: string | number): string => {
	try {
		const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp);
		return date.toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	} catch {
		return String(timestamp);
	}
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化数字为千分位
 */
export const formatNumber = (num: number): string => {
	return num.toLocaleString('zh-CN');
};
