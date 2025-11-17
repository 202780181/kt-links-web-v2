import { useState } from "react"
import { Search, Settings, Bell, User, FileText, Github, Lock, LogOut, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { SettingsDrawer } from "@/components/settings-drawer"

export function SiteHeader() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4">
      {/* Logo 和标题 */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary-foreground" fill="currentColor">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
          </svg>
        </div>
        <span className="text-sm font-medium">控制台</span>
      </div>

      {/* 搜索框 */}
      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="支持搜索实例ID、IP、资源标签搜索"
            className="w-full pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* 右侧操作区 */}
      <div className="ml-auto flex items-center gap-4">
        {/* 帮助和通知组 */}
        <div className="flex items-center">
          {/* 通知 */}
          <Button variant="ghost" size="icon" className="h-10 w-10 relative">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute top-0 right-0 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
            >
              3
            </Badge>
          </Button>
          {/* 页面设置 */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-primary text-primary-foreground">V</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {/* 用户信息头部 */}
            <div className="flex items-center gap-3 p-3">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="" alt="Vben" />
                  <AvatarFallback className="bg-gradient-to-br from-pink-400 to-orange-400 text-white text-lg">
                    V
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Vben</span>
                  <Badge variant="secondary" className="text-xs">Pro</Badge>
                </div>
                <span className="text-xs text-muted-foreground">ann.vben@gmail.com</span>
              </div>
            </div>
            
            <DropdownMenuSeparator />
            
            {/* 菜单项 */}
            <DropdownMenuItem className="gap-2 py-2">
              <User className="h-4 w-4" />
              <span>个人中心</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="gap-2 py-2">
              <FileText className="h-4 w-4" />
              <span>文档</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="gap-2 py-2">
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="gap-2 py-2">
              <HelpCircle className="h-4 w-4" />
              <span>问题 & 帮助</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="gap-2 py-2">
              <Lock className="h-4 w-4" />
              <span>锁定屏幕</span>
              <span className="ml-auto text-xs text-muted-foreground">⌃ L</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="gap-2 py-2">
              <LogOut className="h-4 w-4" />
              <span>退出登录</span>
              <span className="ml-auto text-xs text-muted-foreground">⌃ Q</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>

    <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
