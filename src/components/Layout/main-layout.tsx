import React from 'react';
import { Outlet } from 'react-router';
import { NotificationCenterProvider } from '@/context/NotificationCenterContext';
import {
  SidebarProvider,
} from '@/components/layout/sidebar';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SiteHeader } from '@/components/navigation/site-header';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';

const getSidebarStateFromCookie = (): boolean => {
  if (typeof document === 'undefined') return true;
  const cookies = document.cookie.split('; ');
  const sidebarCookie = cookies.find(cookie => cookie.startsWith(`${SIDEBAR_COOKIE_NAME}=`));
  if (sidebarCookie) {
    return sidebarCookie.split('=')[1] === 'true';
  }
  return true; // 默认展开
};

const MainLayout: React.FC = () => {
  const [defaultOpen] = React.useState(getSidebarStateFromCookie);

  return (
    <NotificationCenterProvider>
      <div className="flex h-screen flex-col overflow-hidden">
        {/* Header 在最顶部占据整行 */}
        <SiteHeader />
        
        {/* 下面是容器：左边 Sidebar，右边内容区 */}
        <SidebarProvider
          defaultOpen={defaultOpen}
          style={
            {
              '--sidebar-width': '250px',
              '--sidebar-width-icon': '3rem',
            } as React.CSSProperties
          }
        >
          <div className="flex flex-1 overflow-hidden">
            <AppSidebar variant="inset" />
            <main className="flex flex-1 flex-col overflow-y-auto">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  <Outlet />
                </div>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </div>
    </NotificationCenterProvider>
  );
};

export default MainLayout;
