import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface NotificationDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Notification {
  id: string
  title: string
  category: string
  time: string
  isRead: boolean
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "腾讯云SSL证书即将过期通知",
    category: "产品消息",
    time: "2025-11-16 11:31:12",
    isRead: false,
  },
  {
    id: "2",
    title: "【腾讯云CDN】证书即将过期提醒",
    category: "产品消息",
    time: "2025-11-16 09:44:59",
    isRead: false,
  },
  {
    id: "3",
    title: "【SSL 证书】关于2025年11月27日腾讯云 SSL 证书服...",
    category: "运维消息",
    time: "2025-11-14 19:22:29",
    isRead: false,
  },
  {
    id: "4",
    title: "【对象存储 COS】资源包购买成功通知",
    category: "产品消息",
    time: "2025-11-04 13:56:55",
    isRead: false,
  },
]

export function NotificationDrawer({ open, onOpenChange }: NotificationDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        showClose={false} 
        showOverlay={false}
        offsetTop="3.5rem"
        side="right" 
        className="w-[600px] p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">站内信</SheetTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 text-sm">
                <Check className="h-4 w-4 mr-1" />
                全部已读
              </Button>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="divide-y">
            {mockNotifications.map((notification) => (
              <div
                key={notification.id}
                className="px-6 py-4 hover:bg-accent/50 cursor-pointer transition-colors border-l-4 border-l-blue-500"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm mb-2 truncate">
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {notification.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {notification.time}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
