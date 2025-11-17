import ClientAuthService from './clientAuthService'
import { ApiError } from './base'
import { removeCookie } from '../utils/cookieUtils'

/**
 * 统一的 API 错误处理器
 * 401: 客户端授权过期，需要刷新客户端授权
 * 403: 用户登录过期，需要重新登录
 */
export class ApiErrorHandler {
  /**
   * 处理 API 响应错误
   */
  static async handleApiError(error: any): Promise<never> {
    if (error instanceof ApiError) {
      switch (error.code) {
        case 401:
          // 客户端授权过期，先清除所有认证信息，然后尝试重新初始化
          console.warn('客户端授权过期，清除认证信息并重新初始化...')
          // 先清除客户端认证信息和用户信息
          this.clearAllAuthInfo()
          try {
            await ClientAuthService.initialize()
            throw new Error('CLIENT_AUTH_EXPIRED')
          } catch (refreshError) {
            console.error('客户端授权刷新失败:', refreshError)
            throw new Error('CLIENT_AUTH_REFRESH_FAILED')
          }

        case 403:
          // 用户登录过期，需要重新登录
          console.warn('用户登录过期，需要重新登录')
          // 清除用户登录状态但保留客户端认证
          this.clearUserAuthOnly()
          throw new Error('USER_LOGIN_EXPIRED')

        default:
          // 其他错误直接抛出
          throw error
      }
    }
    
    // 非 ApiError 类型的错误直接抛出
    throw error
  }

  /**
   * 清除所有认证信息（客户端认证 + 用户认证）
   */
  private static clearAllAuthInfo(): void {
    // 清除客户端认证信息（包括相关 cookies）
    ClientAuthService.clearAuth()
    
    // 清除用户相关的 cookie
    this.clearUserCookies()
  }

  /**
   * 清除用户相关的 cookies
   */
  private static clearUserCookies(): void {
    removeCookie('userToken')
    removeCookie('userTokenSecretKey')
  }

  /**
   * 只清除用户登录信息，保留客户端认证
   */
  private static clearUserAuthOnly(): void {
    // 清除用户相关的 cookie
    this.clearUserCookies()
  }

  /**
   * 检查是否需要重定向到登录页
   */
  static shouldRedirectToLogin(error: Error): boolean {
    return error.message === 'USER_LOGIN_EXPIRED'
  }

  /**
   * 检查是否需要重试请求（客户端认证刷新后）
   */
  static shouldRetryRequest(error: Error): boolean {
    return error.message === 'CLIENT_AUTH_EXPIRED'
  }
}

export default ApiErrorHandler
