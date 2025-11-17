'use client'

import * as React from 'react'
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Home,
  Menu,
  Users,
  Key,
  AppWindow,
  Building2,
} from 'lucide-react'

import { NavMain } from '@/components/navigation/nav-main'
import { TeamSwitcher } from '@/components/ui/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/layout/sidebar'

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
  navMain: [
    {
      title: '首页',
      url: '/',
      icon: Home,
      isActive: true,
    },
    {
      title: '菜单',
      url: '/menu',
      icon: Menu,
    },
    {
      title: '用户',
      url: '/users',
      icon: Users,
    },
    {
      title: '应用',
      url: '/apps',
      icon: AppWindow,
    },
    {
      title: '权限码',
      url: '/permissions',
      icon: Key,
    },
    {
      title: '组织管理',
      url: '/organizations',
      icon: Building2,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
