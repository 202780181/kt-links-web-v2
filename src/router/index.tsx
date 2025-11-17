import { createBrowserRouter } from 'react-router'
import { lazy, Suspense } from 'react'
import App from '../App'
import ProtectedRoute from '../components/protected-route'
import Loading from '../components/loading'

// 懒加载页面组件
const HomePage = lazy(() => import('@/pages/home'))
const NotFoundPage = lazy(() => import('../pages/NotFound/NotFoundPage'))
const LoginPage = lazy(() => import('../pages/login'))
const AccountInfoPage = lazy(() => import('@/pages/account/InfoPage'))
const AccountVerificationPage = lazy(() =>
  import('@/pages/account/VerificationPage'),
)
const AccountSecurityPage = lazy(() => import('@/pages/account/SecurityPage'))
const AccountAccessPage = lazy(() => import('@/pages/account/AccessPage'))
const AccountLayout = lazy(() => import('@/pages/account/AccountLayout'))
const SimpleLayout = lazy(() =>
  import('../components/layout/simple-layout'),
)
const MenuListPage = lazy(() => import('../pages/menu'))
// 懒加载包装组件
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Loading />}>{children}</Suspense>
)

// 路由配置：仅保留概览
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <LazyWrapper>
            <HomePage />
          </LazyWrapper>
        ),
      },
       {
        path: 'menu',
        element: (
          <LazyWrapper>
            <MenuListPage />
          </LazyWrapper>
        )
      },
      // 本地静态路由：开发者中心（账号中心）
      {
        path: 'developer',
        element: (
          <LazyWrapper>
            <AccountLayout />
          </LazyWrapper>
        ),
        children: [
          {
            index: true,
            element: (
              <LazyWrapper>
                <AccountInfoPage />
              </LazyWrapper>
            ),
          }, // /developer -> 账号信息
          {
            path: 'info',
            element: (
              <LazyWrapper>
                <AccountInfoPage />
              </LazyWrapper>
            ),
          },
          {
            path: 'auth',
            element: (
              <LazyWrapper>
                <AccountVerificationPage />
              </LazyWrapper>
            ),
          }, // /developer/auth -> 实名认证
          {
            path: 'security',
            element: (
              <LazyWrapper>
                <AccountSecurityPage />
              </LazyWrapper>
            ),
          },
          {
            path: 'access',
            element: (
              <LazyWrapper>
                <AccountAccessPage />
              </LazyWrapper>
            ),
          },
        ],
      },
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
