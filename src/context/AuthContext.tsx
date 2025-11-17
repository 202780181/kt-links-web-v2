import React, { createContext, useContext, useEffect, useState } from 'react'
import UserAuthService, { type UserProfile } from '../services/userAuthService'

interface AuthContextType {
  isLoggedIn: boolean
  userProfile: UserProfile | null
  login: (account: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  error: string | null
}

interface AuthProviderProps {
  children: React.ReactNode
}


const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 初始化时检查登录状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 从cookie恢复认证状态
        const restored = UserAuthService.restoreAuthFromCookie()
        
        if (restored) {
          const loggedIn = UserAuthService.isLoggedIn()
          setIsLoggedIn(loggedIn)
          
          if (loggedIn) {
            // 尝试获取用户信息
            try {
              const profile = await UserAuthService.getUserProfile()
              setUserProfile(profile)
              console.log('成功恢复用户认证状态并获取用户信息')
            } catch (error) {
              console.warn('获取用户信息失败:', error)
              // 只有在明确的会话过期错误时才清除登录状态
              if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
                setIsLoggedIn(false)
                setUserProfile(null)
              } else {
                // 其他错误保持登录状态，但清除用户信息缓存
                console.log('保持登录状态，但清除用户信息缓存')
                setUserProfile(null)
              }
            }
          }
        } else {
          console.log('无法从cookie恢复认证状态')
          setIsLoggedIn(false)
          setUserProfile(null)
        }
      } catch (error) {
        console.error('初始化认证状态失败:', error)
        setIsLoggedIn(false)
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (account: string, password: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await UserAuthService.login({ account, password })
      setIsLoggedIn(true)
      
      // 获取用户信息
      const profile = await UserAuthService.getUserProfile()
      setUserProfile(profile)
    } catch (error) {
      setError(error instanceof Error ? error.message : '登录失败')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await UserAuthService.logout()
    setIsLoggedIn(false)
    setUserProfile(null)
    setError(null)
  }

  const value: AuthContextType = {
    isLoggedIn,
    userProfile,
    login,
    logout,
    loading,
    error
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
