import { useState } from "react"
import { X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import lightSvg from "@/assets/image/light.svg"
import darkSvg from "@/assets/image/dark.svg"
import followSvg from "@/assets/image/follow.svg"

interface SettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDrawer({ open, onOpenChange }: SettingsDrawerProps) {
  const { theme, setTheme } = useTheme()
  const [navigation, setNavigation] = useState<'single' | 'double'>('single')
  const [docView, setDocView] = useState<'in-page' | 'new-page'>('new-page')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">自定义设置</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* 主题设置 */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">主题</Label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  "flex flex-col items-center gap-2 p-1 hover:bg-accent transition-colors",
                  theme === 'light' ? "border-primary" : "border-muted"
                )}
              >
                <div className="w-full aspect-video overflow-hidden relative">
                  {theme === 'light' && (
                    <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center z-10">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <img src={lightSvg} alt="浅色模式" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm">浅色模式</span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  "flex flex-col items-center gap-2 p-1 hover:bg-accent transition-colors",
                  theme === 'dark' ? "border-primary" : "border-muted"
                )}
              >
                <div className="w-full aspect-video overflow-hidden relative">
                  {theme === 'dark' && (
                    <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center z-10">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <img src={darkSvg} alt="深色模式" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm">深色模式</span>
              </button>

              <button
                onClick={() => setTheme('system')}
                className={cn(
                  "flex flex-col items-center gap-2 p-1 hover:bg-accent transition-colors",
                  theme === 'system' ? "border-primary" : "border-muted"
                )}
              >
                <div className="w-full aspect-video overflow-hidden relative">
                  {theme === 'system' && (
                    <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center z-10">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <img src={followSvg} alt="跟随系统" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm">跟随系统</span>
              </button>
            </div>
          </div>

          {/* 顶部导航 */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">顶部导航</Label>
            <div className="space-y-4">
              <button
                onClick={() => setNavigation('single')}
                className={cn(
                  "flex w-full items-start gap-4 rounded-lg border-2 p-4 text-left hover:bg-accent transition-colors",
                  navigation === 'single' ? "border-primary" : "border-muted"
                )}
              >
                <div className={cn(
                  "mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center",
                  navigation === 'single' ? "border-primary" : "border-muted"
                )}>
                  {navigation === 'single' && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">单层导航</div>
                  <div className="text-sm text-muted-foreground">顶部导航栏保持一行</div>
                  <div className="mt-2 rounded border bg-muted/30 p-2">
                    <div className="h-8 rounded bg-slate-950" />
                    <div className="mt-2 space-y-2">
                      <div className="h-2 w-3/4 rounded bg-muted" />
                      <div className="h-2 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setNavigation('double')}
                className={cn(
                  "flex w-full items-start gap-4 rounded-lg border-2 p-4 text-left hover:bg-accent transition-colors",
                  navigation === 'double' ? "border-primary" : "border-muted"
                )}
              >
                <div className={cn(
                  "mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center",
                  navigation === 'double' ? "border-primary" : "border-muted"
                )}>
                  {navigation === 'double' && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">双层导航</div>
                  <div className="text-sm text-muted-foreground">将收藏云产品单独一行</div>
                  <div className="mt-2 rounded border bg-muted/30 p-2">
                    <div className="space-y-1">
                      <div className="h-6 rounded bg-slate-950" />
                      <div className="h-6 rounded bg-slate-800" />
                    </div>
                    <div className="mt-2 space-y-2">
                      <div className="h-2 w-3/4 rounded bg-muted" />
                      <div className="h-2 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 帮助文档 */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">帮助文档</Label>
            <div className="space-y-4">
              <button
                onClick={() => setDocView('in-page')}
                className={cn(
                  "flex w-full items-start gap-4 rounded-lg border-2 p-4 text-left hover:bg-accent transition-colors",
                  docView === 'in-page' ? "border-primary" : "border-muted"
                )}
              >
                <div className={cn(
                  "mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center",
                  docView === 'in-page' ? "border-primary" : "border-muted"
                )}>
                  {docView === 'in-page' && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">页面内查看</div>
                  <div className="text-sm text-muted-foreground">点击文档链接，在当前页面打开</div>
                  <div className="mt-2 rounded border bg-muted/30 p-2">
                    <div className="flex gap-2">
                      <div className="w-1/3 space-y-2 rounded bg-slate-950 p-2">
                        <div className="h-1 w-full rounded bg-slate-800" />
                        <div className="h-1 w-2/3 rounded bg-slate-800" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="h-2 w-3/4 rounded bg-muted" />
                        <div className="h-2 w-full rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setDocView('new-page')}
                className={cn(
                  "flex w-full items-start gap-4 rounded-lg border-2 p-4 text-left hover:bg-accent transition-colors",
                  docView === 'new-page' ? "border-primary" : "border-muted"
                )}
              >
                <div className={cn(
                  "mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center",
                  docView === 'new-page' ? "border-primary" : "border-muted"
                )}>
                  {docView === 'new-page' && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">新页面查看</div>
                  <div className="text-sm text-muted-foreground">点击文档链接，在新页面打开</div>
                  <div className="mt-2 rounded border bg-muted/30 p-2">
                    <div className="space-y-1">
                      <div className="h-6 rounded bg-slate-950" />
                      <div className="h-2 w-3/4 rounded bg-muted" />
                      <div className="h-2 w-full rounded bg-muted" />
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 视图管理 */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">视图管理</Label>
            <div className="text-sm text-muted-foreground">
              配置页面视图相关设置
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
