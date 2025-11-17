import { useNavigate } from 'react-router'
import { useAuth } from '@/context/AuthContext'
import ApiErrorHandler from '@/services/apiErrorHandler'

/**
 * API 错误处理 Hook
 * 处理全局的 API 错误，包括客户端授权过期和用户登录过期
 */
export const useApiErrorHandler = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleApiError = async (error: any, retryCallback?: () => Promise<any>) => {
    try {
      await ApiErrorHandler.handleApiError(error)
    } catch (handledError) {
      if (handledError instanceof Error) {
        // 用户登录过期，跳转到登录页
        if (ApiErrorHandler.shouldRedirectToLogin(handledError)) {
          await logout()
          navigate('/login', { replace: true })
          return
        }

        // 客户端认证刷新成功，重试原请求
        if (ApiErrorHandler.shouldRetryRequest(handledError) && retryCallback) {
          try {
            return await retryCallback()
          } catch (retryError) {
            console.error('重试请求失败:', retryError)
            throw retryError
          }
        }
      }

      // 其他错误直接抛出
      throw handledError
    }
  }

  return { handleApiError }
}

export default useApiErrorHandler
