// API 配置工具 - 统一导出接口

// 重新导出基础 API 方法 (推荐使用方式)
export { get, post, put, patch, del, ssePost, ApiError } from '../services/base';

// 获取当前环境
export const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';

// 导出环境信息
export const isDevelopment = APP_ENV === 'development';
export const isProduction = APP_ENV === 'production';
export const isTest = APP_ENV === 'test';

// 动态获取API基础URL
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // 开发环境：空字符串使用代理，否则使用指定URL
  if (isDevelopment) {
    return envUrl || '';
  }
  
  // 生产环境：如果为空则使用当前域名，否则使用指定值
  if (isProduction) {
    return envUrl || `${window.location.protocol}//${window.location.host}`;
  }
  
  // 测试环境：使用指定值或空字符串
  return envUrl || '';
};

export const API_BASE_URL = getApiBaseUrl();

// 调试信息
if (isDevelopment) {
  console.log('API Configuration:', {
    baseURL: API_BASE_URL,
    environment: APP_ENV,
  });
}