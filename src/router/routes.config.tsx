import { lazy } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Home,
  Menu,
  Users,
  Key,
  AppWindow,
  Building2,
  User,
  Shield,
  Lock,
  Settings,
} from 'lucide-react'

// 懒加载页面组件
const HomePage = lazy(() => import('@/pages/home'))
const MenuListPage = lazy(() => import('@/pages/menu'))
const MenuDetailPage = lazy(() => import('@/pages/menu/detail'))
const ApplicationPage = lazy(() => import('@/pages/application'))
const PermissionsPage = lazy(() => import('@/pages/permissions'))
const UserPage = lazy(() => import('@/pages/user'))
const OrganizationPage = lazy(() => import('@/pages/organization'))
const OrganizationDetailPage = lazy(() => import('@/pages/organization/detail'))
const AccountInfoPage = lazy(() => import('@/pages/account/InfoPage'))
const AccountVerificationPage = lazy(() => import('@/pages/account/VerificationPage'))
const AccountSecurityPage = lazy(() => import('@/pages/account/SecurityPage'))
const AccountAccessPage = lazy(() => import('@/pages/account/AccessPage'))
const AccountLayout = lazy(() => import('@/pages/account/AccountLayout'))

// 路由配置项接口
export interface RouteConfig {
  path: string
  component: React.LazyExoticComponent<React.ComponentType<any>>
  title?: string // 菜单标题
  icon?: LucideIcon // 菜单图标
  showInSidebar?: boolean // 是否在侧边栏显示
  children?: RouteConfig[]
  index?: boolean // 是否为索引路由
}

// 统一路由配置 - 单一数据源
export const routesConfig: RouteConfig[] = [
  {
    path: '/',
    component: HomePage,
    title: '首页',
    icon: Home,
    showInSidebar: true,
    index: true,
  },
  {
    path: '/menu',
    component: MenuListPage,
    title: '菜单',
    icon: Menu,
    showInSidebar: true,
  },
  {
    path: '/menu/:id',
    component: MenuDetailPage,
    showInSidebar: false, // 详情页不在侧边栏显示
  },
  {
    path: '/users',
    component: UserPage,
    title: '用户',
    icon: Users,
    showInSidebar: true,
  },
  {
    path: '/application',
    component: ApplicationPage,
    title: '应用',
    icon: AppWindow,
    showInSidebar: true,
  },
  {
    path: '/permissions',
    component: PermissionsPage,
    title: '权限码',
    icon: Key,
    showInSidebar: true,
  },
  {
    path: '/organizations',
    component: OrganizationPage,
    title: '组织管理',
    icon: Building2,
    showInSidebar: true,
  },
  {
    path: '/organizations/:id',
    component: OrganizationDetailPage,
    showInSidebar: false, // 详情页不在侧边栏显示
  },
]

// 开发者中心路由配置
export const developerRoutesConfig: RouteConfig[] = [
  {
    path: '/developer',
    component: AccountLayout,
    showInSidebar: false,
    children: [
      {
        path: 'info',
        component: AccountInfoPage,
        title: '账号信息',
        icon: User,
        showInSidebar: true,
        index: true, // 默认子路由
      },
      {
        path: 'auth',
        component: AccountVerificationPage,
        title: '实名认证',
        icon: Shield,
        showInSidebar: true,
      },
      {
        path: 'security',
        component: AccountSecurityPage,
        title: '安全设置',
        icon: Settings,
        showInSidebar: true,
      },
      {
        path: 'access',
        component: AccountAccessPage,
        title: '访问管理',
        icon: Lock,
        showInSidebar: true,
      },
    ],
  },
]

// 工具函数：从路由配置生成侧边栏菜单数据
export const generateSidebarItems = (routes: RouteConfig[]) => {
  return routes
    .filter((route) => route.showInSidebar && route.title && route.icon)
    .map((route) => ({
      title: route.title!,
      url: route.path,
      icon: route.icon!,
    }))
}

// 工具函数：从路由配置生成开发者中心侧边栏菜单
export const generateDeveloperSidebarItems = () => {
  const developerRoute = developerRoutesConfig[0]
  if (!developerRoute.children) return []
  
  return developerRoute.children
    .filter((route) => route.showInSidebar && route.title && route.icon)
    .map((route) => ({
      title: route.title!,
      url: `${developerRoute.path}/${route.path}`,
      icon: route.icon!,
    }))
}
