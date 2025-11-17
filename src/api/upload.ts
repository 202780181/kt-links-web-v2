import ClientAuthService from '@/services/clientAuthService';
import { API_BASE_URL } from '@/utils/api';

// 文件上传响应接口
export interface UploadResponse {
	code: number;
	msg: string;
	data: {
		id: string;
		url: string;
	};
}

/**
 * 上传公共文件（图片、附件等）
 * Dify 风格：直接返回完整响应，错误处理交给调用方
 * 注意：由于base.ts的post方法会对数据进行JSON.stringify()处理，
 * 这会破坏FormData对象，因此文件上传需要使用原生fetch
 */
export const uploadPublicFile = async (file: File): Promise<UploadResponse> => {
	const formData = new FormData();
	formData.append('file', file);

	// 构建请求头，包含认证信息
	const headers: Record<string, string> = {};

	// 合并通用认证头
	try {
		const commonAuthHeaders = ClientAuthService.getAuthHeaders();
		Object.assign(headers, commonAuthHeaders);
	} catch {
		// 获取公共头失败时忽略
	}

	// 添加用户认证 token
	// const token = getCookie('userToken');
	// if (token) {
	// 	headers.Authorization = `Bearer ${token}`;
	// }

	// 添加客户端认证信息
	// const clientToken = await ClientAuthService.getClientToken();
	// const tokenSecretKey = await ClientAuthService.getTokenSecretKey();
	// if (clientToken) {
	// 	headers['X-Client-Token'] = clientToken;
	// }
	// if (tokenSecretKey) {
	// 	headers['X-Token-Secret-Key'] = tokenSecretKey;
	// }

	// 添加 clientKey 到请求头
	const ck = import.meta.env.VITE_APP_CLIENT_KEY;
	if (ck) {
		headers['ck'] = ck;
	}

	// 构建完整URL
	const url = API_BASE_URL
		? `${API_BASE_URL}/api/c/attachment/file/upload-public`
		: '/api/c/attachment/file/upload-public';

	// 使用原生fetch处理文件上传
	// 不设置 Content-Type，让浏览器自动设置 multipart/form-data 和 boundary
	const response = await fetch(url, {
		method: 'POST',
		headers,
		body: formData,
	});

	// Dify风格：直接返回解析后的响应，让调用方处理错误
	return await response.json();
};

