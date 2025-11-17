/**
 * 通用类型定义
 */

export interface SelectOption {
	label: string;
	value: string | number;
	disabled?: boolean;
}

export interface TableColumn<T = any> {
	title: string;
	dataIndex: keyof T;
	key: string;
	width?: string | number;
	fixed?: 'left' | 'right';
	ellipsis?: boolean;
	sorter?: boolean | ((a: T, b: T) => number);
	render?: (value: any, record: T, index: number) => React.ReactNode;
}

export interface FormRule {
	required?: boolean;
	message?: string;
	pattern?: RegExp;
	min?: number;
	max?: number;
	type?: 'string' | 'number' | 'email' | 'url';
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
