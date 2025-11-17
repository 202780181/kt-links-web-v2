// 基础 API 请求工具 - 参考 Dify 项目实现

import ClientAuthService from './clientAuthService';
import ApiErrorHandler from './apiErrorHandler';
import {API_BASE_URL} from '../utils/api';

// 请求配置接口
interface RequestConfig extends RequestInit {
  params?: Record<string, any>;
  timeout?: number;
}

// API 响应接口
export interface ApiResponse<T = any> {
  data: T;
  code: number;
  message?: string;
  msg?: string;
  success: boolean;
}

// 错误类型
export class ApiError extends Error {
  public code: number;
  public response?: Response;

  constructor(message: string, code: number, response?: Response) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.response = response;
  }
}

// 获取认证 token
// const getAuthToken = (): string | null => {
//   return getCookie('userToken');
// };

// 获取通用请求头（包含认证信息）
export const getAuthHeaders = (): Record<string, string> => {
  return ClientAuthService.getAuthHeaders();
};

// 合并请求头
export const mergeHeaders = (customHeaders: Record<string, string> = {}): Record<string, string> => {
  return {
    ...getAuthHeaders(),
    ...customHeaders
  };
};

// 构建查询参数
const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
};

// 构建完整 URL
const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  const baseUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  if (params && Object.keys(params).length > 0) {
    const queryString = buildQueryString(params);
    return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${queryString}`;
  }
  return baseUrl;
};

// 基础请求函数
const request = async <T = any>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<any> => {
  const { params, timeout = 30000, ...requestConfig } = config;

  // 构建 URL
  const url = buildUrl(endpoint, params);

  // 构建请求头
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...requestConfig.headers as Record<string, string>,
  };

  // 合并通用认证头（kc-token、ku-token、ck、sId 等）
  try {
    const commonAuthHeaders = ClientAuthService.getAuthHeaders();
    Object.assign(headers, commonAuthHeaders);
  } catch {
    // 获取公共头失败时忽略，继续后续逻辑
  }

  // 添加用户认证 token
  // const token = getAuthToken();
  // if (token) {
  //   headers.Authorization = `Bearer ${token}`;
  // }

  // 添加客户端认证信息（避免认证接口的循环调用）
  // if (endpoint !== '/api/auth/token/c/session') {
  //   const clientToken = await ClientAuthService.getClientToken();
  //   const tokenSecretKey = await ClientAuthService.getTokenSecretKey();
  //   if (clientToken) {
  //     headers['X-Client-Token'] = clientToken;
  //   }
  //   if (tokenSecretKey) {
  //     headers['X-Token-Secret-Key'] = tokenSecretKey;
  //   }
  // }

  // 添加 clientKey 到请求头
    headers['ck'] = import.meta.env.VITE_APP_CLIENT_KEY;

  // 创建 AbortController 用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...requestConfig,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 处理 HTTP 错误
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // 如果无法解析错误响应，使用默认错误信息
      }

      throw new ApiError(errorMessage, response.status, response);
    }

    // 处理空响应
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return response.text() as unknown as T;
    }

    const result: ApiResponse<T> = await response.json();

    return result;
  } catch (error) {
    clearTimeout(timeoutId);

    // 仅对 401（客户端授权过期）与 403（用户登录过期）进行全局错误处理
    // 其他错误交由页面局部处理（不触发全局处理）
    const maybeStatus = (error as any)?.response?.status ?? (error as any)?.code;
    if (maybeStatus === 401 || maybeStatus === 403) {
      try {
        await ApiErrorHandler.handleApiError(error);
      } catch (handledError) {
        console.error('全局错误处理失败:', handledError);
        // 全局处理后仍然抛出，保持调用方可感知
        throw handledError;
      }
    }

    if (error instanceof ApiError) {
      // 把错误抛给调用方（页面自身 try/catch 处理）
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('请求超时', 408);
      }
      throw new ApiError(error.message, 0);
    }

    throw new ApiError('未知错误', 0);
  }
};

// HTTP 方法封装
export const get = <T = any>(
  endpoint: string,
  config?: Omit<RequestConfig, 'method' | 'body'>
): Promise<T> => {
  return request<T>(endpoint, { ...config, method: 'GET' });
};

export const post = <T = any>(
  endpoint: string,
  data?: any,
  config?: Omit<RequestConfig, 'method'>
): Promise<T> => {
  return request<T>(endpoint, {
    ...config,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

export const put = <T = any>(
  endpoint: string,
  data?: any,
  config?: Omit<RequestConfig, 'method'>
): Promise<T> => {
  return request<T>(endpoint, {
    ...config,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

export const patch = <T = any>(
  endpoint: string,
  data?: any,
  config?: Omit<RequestConfig, 'method'>
): Promise<T> => {
  return request<T>(endpoint, {
    ...config,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
};

export const del = <T = any>(
  endpoint: string,
  data?: any,
  config?: Omit<RequestConfig, 'method'>
): Promise<T> => {
  return request<T>(endpoint, {
    ...config,
    method: 'DELETE',
    body: data ? JSON.stringify(data) : undefined,
  });
};

// SSE (Server-Sent Events) 请求
export const ssePost = (
  endpoint: string,
  data?: any,
  config?: Omit<RequestConfig, 'method'>
): Promise<Response> => {
  const { params, ...requestConfig } = config || {};
  const url = buildUrl(endpoint, params);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache',
    ...requestConfig.headers as Record<string, string>,
  };

  // 合并通用认证头（kc-token、ku-token、ck、sId 等）
  try {
    const commonAuthHeaders = ClientAuthService.getAuthHeaders();
    Object.assign(headers, commonAuthHeaders);
  } catch {
    // 获取公共头失败时忽略
  }

  // const token = getAuthToken();
  // if (token) {
  //   headers.Authorization = `Bearer ${token}`;
  // }

  return fetch(url, {
    ...requestConfig,
    method: 'POST',
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
};

// 导出默认对象
export default {
  get,
  post,
  put,
  patch,
  del,
  ssePost,
  ApiError,
};
