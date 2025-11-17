/**
 * API 相关类型定义
 */

export interface ApiResponse<T = any> {
	code: number;
	success: boolean;
	message?: string;
	msg?: string;
	data: T;
}

export interface PaginationParams {
	size?: number;
	cursorId?: string;
	cursorCreateTs?: string;
	cursorType?: string;
}

export interface PaginationResponse<T> {
	size: number;
	total: number;
	hasNext: boolean;
	hasPrevious: boolean;
	nextCursor: string;
	prevCursor: string;
	cursorType: string;
	data: T[];
}

export interface BaseEntity {
	id: string;
	createTs: string;
	updateTs: string;
}
