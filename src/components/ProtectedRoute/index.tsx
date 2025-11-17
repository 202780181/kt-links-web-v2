import React from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '@/context/AuthContext'
import Loading from '@/components/Loading'

interface ProtectedRouteProps {
  children: React.ReactNode
}

// 此页面是一个路由守卫组件，用于保护需要登录才能访问的页面
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loading type="app" />
  }

  if (!isLoggedIn) {
    // 保存当前路径，登录后可以跳转回来
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
