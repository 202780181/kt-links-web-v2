'use client'

import * as React from 'react'
import { useLocation } from 'react-router'
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
} from 'lucide-react'

import { NavMain } from '@/components/navigation/nav-main'
import { TeamSwitcher } from '@/components/ui/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/layout/sidebar'
import { 
  generateSidebarItems, 
  generateDeveloperSidebarItems,
  routesConfig 
} from '@/router/routes.config'

const data = {
  teams: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
  // 从统一配置自动生成主导航菜单
  navMain: generateSidebarItems(routesConfig),
  // 从统一配置自动生成开发者中心菜单
  developerNav: generateDeveloperSidebarItems(),
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const isDeveloperPage = location.pathname.startsWith('/developer')

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={isDeveloperPage ? data.developerNav : data.navMain} />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
