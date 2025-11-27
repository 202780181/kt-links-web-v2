import { createBrowserRouter } from 'react-router'
import { lazy, Suspense } from 'react'
import App from '../App'
import ProtectedRoute from '../components/protected-route'
import Loading from '../components/loading'
import { routesConfig, developerRoutesConfig, type RouteConfig } from '@/router/routes.config'

// 其他页面组件
const NotFoundPage = lazy(() => import('../pages/NotFound/NotFoundPage'))
const LoginPage = lazy(() => import('../pages/login'))
const SimpleLayout = lazy(() =>
  import('../components/layout/simple-layout'),
)

// 懒加载包装组件
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Loading />}>{children}</Suspense>
)

// 工具函数：将路由配置转换为 React Router 格式
const convertToRouterConfig = (config: RouteConfig) => {
  const Component = config.component
  
  const route: any = {
    path: config.index ? undefined : config.path.replace(/^\//, ''), // 移除开头的 /
    element: (
      <LazyWrapper>
        <Component />
      </LazyWrapper>
    ),
  }
  
  // 如果是索引路由
  if (config.index) {
    route.index = true
  }
  
  // 如果有子路由，需要特殊处理
  if (config.children && config.children.length > 0) {
    route.children = config.children.map(child => {
      const Component = child.component
      const childRoute: any = {
        path: child.path,
        element: (
          <LazyWrapper>
            <Component />
          </LazyWrapper>
        ),
      }
      
      // 注意：如果既有 path 又有 index，保留 path，不设置 index
      // 因为在 React Router 中，index 路由不能有 path
      
      return childRoute
    })
    
    // 如果有索引路由，添加一个索引路由重定向到第一个子路由
    const indexChild = config.children.find(child => child.index)
    if (indexChild && indexChild.path) {
      route.children.unshift({
        index: true,
        element: (
          <LazyWrapper>
            <indexChild.component />
          </LazyWrapper>
        ),
      })
    }
  }
  
  return route
}

// 路由配置：使用统一配置自动生成
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      // 从统一配置生成主路由
      ...routesConfig.map(convertToRouterConfig),
      // 从统一配置生成开发者中心路由
      ...developerRoutesConfig.map(convertToRouterConfig),
    ],
  },
  {
    path: 'login',
    element: (
      <LazyWrapper>
        <LoginPage />
      </LazyWrapper>
    ),
  },
  {
    path: '*',
    element: (
      <LazyWrapper>
        <SimpleLayout>
          <NotFoundPage />
        </SimpleLayout>
      </LazyWrapper>
    ),
  },
])

export default router
