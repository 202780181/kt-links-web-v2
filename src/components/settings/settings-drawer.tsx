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
import { useTheme } from "@/components/theme/theme-provider"
import lightSvg from "@/assets/image/light.svg"
import darkSvg from "@/assets/image/dark.svg"
import followSvg from "@/assets/image/follow.svg"

interface SettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDrawer({ open, onOpenChange }: SettingsDrawerProps) {
  const { theme, setTheme } = useTheme()
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        showClose={false}
        showOverlay={false}
        offsetTop="3.5rem"
        side="right" 
        className="w-[400px] sm:w-[540px] p-0 flex flex-col"
      >
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
          
          {/* 更多功能 */}
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            更多功能待开放中...
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
