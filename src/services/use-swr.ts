// SWR hooks 工具 - 参考 Dify 项目实现

import useSWR from 'swr';
import type { SWRConfiguration, SWRResponse } from 'swr';
import useSWRMutation from 'swr/mutation';
import type { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation';
import { get, post, put, del, patch } from './base';

// 基础 SWR 配置
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  dedupingInterval: 2000,
};

// 通用 fetcher 函数
export const fetcher = {
  get: (url: string) => get(url),
  post: (url: string, data?: any) => post(url, data),
  put: (url: string, data?: any) => put(url, data),
  patch: (url: string, data?: any) => patch(url, data),
  delete: (url: string) => del(url),
};

// GET 请求 hook
export function useSwrGet<T = any>(
  key: string | null,
  config?: SWRConfiguration<T>
): SWRResponse<T, Error> {
  return useSWR(
    key,
    fetcher.get,
    {
      ...swrConfig,
      ...config,
    }
  );
}

// POST 请求 mutation hook
export function useSwrPost<T = any, K = any>(
  key: string,
  config?: SWRMutationConfiguration<T, Error, string, K>
): SWRMutationResponse<T, Error, string, K> {
  return useSWRMutation(
    key,
    (url: string, { arg }: { arg: K; }) => post<T>(url, arg),
    config
  );
}

// PUT 请求 mutation hook
export function useSwrPut<T = any, K = any>(
  key: string,
  config?: SWRMutationConfiguration<T, Error, string, K>
): SWRMutationResponse<T, Error, string, K> {
  return useSWRMutation(
    key,
    (url: string, { arg }: { arg: K; }) => put<T>(url, arg),
    config
  );
}

// PATCH 请求 mutation hook
export function useSwrPatch<T = any, K = any>(
  key: string,
  config?: SWRMutationConfiguration<T, Error, string, K>
): SWRMutationResponse<T, Error, string, K> {
  return useSWRMutation(
    key,
    (url: string, { arg }: { arg: K; }) => patch<T>(url, arg),
    config
  );
}

// DELETE 请求 mutation hook
export function useSwrDelete<T = any>(
  key: string,
  config?: SWRMutationConfiguration<T, Error, string, void>
): SWRMutationResponse<T, Error, string, void> {
  return useSWRMutation(
    key,
    (url: string) => del<T>(url),
    config
  );
}

// 带参数的 GET 请求 hook
export function useSwrGetWithParams<T = any>(
  endpoint: string,
  params?: Record<string, any>,
  config?: SWRConfiguration<T>
): SWRResponse<T, Error> {
  const key = params ? `${endpoint}?${new URLSearchParams(params).toString()}` : endpoint;
  return useSwrGet<T>(key, config);
}

// 条件性 GET 请求 hook
export function useSwrConditional<T = any>(
  shouldFetch: boolean,
  key: string,
  config?: SWRConfiguration<T>
): SWRResponse<T, Error> {
  return useSwrGet<T>(shouldFetch ? key : null, config);
}

// 分页数据 hook
export function useSwrPagination<T = any>(
  endpoint: string,
  page: number,
  pageSize: number = 10,
  config?: SWRConfiguration<T>
): SWRResponse<T, Error> {
  const key = `${endpoint}?page=${page}&pageSize=${pageSize}`;
  return useSwrGet<T>(key, config);
}

// 无限滚动 hook
export function useSwrInfinite<T = any>(
  getKey: (pageIndex: number, previousPageData: T | null) => string | null,
  config?: SWRConfiguration<T>
) {
  const { default: useSWRInfinite } = require('swr/infinite');
  return useSWRInfinite(
    getKey,
    fetcher.get,
    {
      ...swrConfig,
      ...config,
    }
  );
}

// 预加载数据
export function preloadData(key: string): void {
  const { mutate } = require('swr');
  mutate(key, fetcher.get(key), false);
}

// 清除缓存
export function clearCache(key?: string): void {
  const { mutate } = require('swr');
  if (key) {
    mutate(key, undefined, false);
  } else {
    // 清除所有缓存
    mutate(() => true, undefined, false);
  }
}

// 刷新数据
export function refreshData(key: string): void {
  const { mutate } = require('swr');
  mutate(key);
}

// 乐观更新
export function optimisticUpdate<T>(
  key: string,
  data: T,
  shouldRevalidate: boolean = true
): void {
  const { mutate } = require('swr');
  mutate(key, data, shouldRevalidate);
}

// 导出常用的 SWR 工具
export { useSWR, useSWRMutation };
export type { SWRConfiguration, SWRResponse, SWRMutationConfiguration, SWRMutationResponse };

// 默认导出
export default {
  useSwrGet,
  useSwrPost,
  useSwrPut,
  useSwrPatch,
  useSwrDelete,
  useSwrGetWithParams,
  useSwrConditional,
  useSwrPagination,
  useSwrInfinite,
  preloadData,
  clearCache,
  refreshData,
  optimisticUpdate,
  swrConfig,
  fetcher,
};