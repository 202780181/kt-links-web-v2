import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { PanelLeftIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

// 选择器常量
const DROPDOWN_SELECTORS = [
  '[data-radix-popper-content-wrapper]',
  '[role="menu"]',
  '[data-radix-dropdown-menu-content]',
  '.dropdown-menu',
] as const

const SIDEBAR_SELECTORS = [
  '[data-slot="sidebar"]',
  '[data-slot="sidebar-container"]',
] as const

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  toggleSidebar: () => void
  isHovered: boolean
  setIsHovered: (hovered: boolean) => void
  setHoveredWithDelay: (hovered: boolean, delay?: number) => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [isHovered, setIsHovered] = React.useState(false)
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const userActionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // 这是侧边栏的内部状态
  // 我们使用 openProp 和 setOpenProp 从组件外部进行控制
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }

      // 设置 cookie 以保持侧边栏状态
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  // 切换侧边栏的辅助函数
  const toggleSidebar = React.useCallback(() => {
    // 当用户手动切换时清除任何悬停状态
    setIsHovered(false)
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    
    // 用户操作后暂时禁用悬停逻辑
    if (userActionTimeoutRef.current) {
      clearTimeout(userActionTimeoutRef.current)
    }
    userActionTimeoutRef.current = setTimeout(() => {
      userActionTimeoutRef.current = null
    }, 1000) // 用户操作后禁用悬停 1 秒
    
    return setOpen((open) => !open)
  }, [setOpen])

  // 为离开事件设置带延迟的悬停状态的辅助函数
  const setHoveredWithDelay = React.useCallback((hovered: boolean, delay = 0) => {
    // 如果用户最近执行了操作，则不处理悬停事件
    if (userActionTimeoutRef.current) {
      return
    }
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    
    if (delay > 0) {
      hoverTimeoutRef.current = setTimeout(() => {
        // 再次检查用户在延迟期间是否执行了操作
        if (!userActionTimeoutRef.current) {
          setIsHovered(hovered)
        }
        hoverTimeoutRef.current = null
      }, delay)
    } else {
      setIsHovered(hovered)
    }
  }, [setIsHovered])

  // 组件卸载时清理定时器
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      if (userActionTimeoutRef.current) {
        clearTimeout(userActionTimeoutRef.current)
      }
    }
  }, [])

  // 添加键盘快捷键以切换侧边栏
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  // 全局鼠标监听器以处理下拉菜单交互
  React.useEffect(() => {
    if (!isHovered || open) return

    // 辅助函数：检查元素是否匹配选择器列表
    const matchesAnySelector = (element: Element | null, selectors: readonly string[]) => {
      if (!element || typeof element.closest !== 'function') return false
      return selectors.some(selector => element.closest(selector))
    }

    const handleGlobalMouseMove = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target || typeof target.closest !== 'function') return
      
      const isOverSidebar = matchesAnySelector(target, SIDEBAR_SELECTORS)
      const isOverDropdown = matchesAnySelector(target, DROPDOWN_SELECTORS)

      // 如果鼠标在下拉菜单内容上，保持侧边栏展开
      if (isOverDropdown) {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current)
          hoverTimeoutRef.current = null
        }
      }
      // 如果鼠标不在侧边栏或下拉菜单上，启动收起定时器
      else if (!isOverSidebar && !isOverDropdown) {
        setHoveredWithDelay(false, 100)
      }
    }

    // 监听下拉菜单的鼠标离开事件
    const handleGlobalMouseLeave = (event: MouseEvent) => {
      const target = event.target as Element
      const relatedTarget = event.relatedTarget as Element
      
      // 检查 target 和 relatedTarget 是否为有效的 DOM 元素
      if (!target || typeof target.closest !== 'function') return
      
      // 检查是否正在离开下拉菜单
      const isLeavingDropdown = matchesAnySelector(target, DROPDOWN_SELECTORS)
      
      // 检查是否正在移动到侧边栏或另一个下拉菜单
      const isGoingToSidebar = matchesAnySelector(relatedTarget, SIDEBAR_SELECTORS)
      const isGoingToDropdown = matchesAnySelector(relatedTarget, DROPDOWN_SELECTORS)

      // 如果离开下拉菜单且不移动到侧边栏或另一个下拉菜单，则收起
      if (isLeavingDropdown && !isGoingToSidebar && !isGoingToDropdown) {
        setHoveredWithDelay(false, 100)
      }
    }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseleave', handleGlobalMouseLeave, true)
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseleave', handleGlobalMouseLeave, true)
    }
  }, [isHovered, open, setHoveredWithDelay])

  // 我们添加一个状态，以便可以设置 data-state="expanded" 或 "collapsed"
  // 这使得使用 Tailwind 类样式化侧边栏变得更容易
  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      toggleSidebar,
      isHovered,
      setIsHovered,
      setHoveredWithDelay,
    }),
    [state, open, setOpen, toggleSidebar, isHovered, setIsHovered, setHoveredWithDelay]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              backgroundColor: "var(--color-background)",
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper flex h-full w-full",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const { state, isHovered, setHoveredWithDelay, open } = useSidebar()

  // 处理鼠标事件以实现悬停展开
  const handleMouseEnter = React.useCallback(() => {
    // 仅在侧边栏收起时触发悬停展开
    if (state === "collapsed") {
      setHoveredWithDelay(true, 0) // 立即展开
    }
  }, [state, setHoveredWithDelay])

  const handleMouseLeave = React.useCallback((event: React.MouseEvent) => {
    // 仅在侧边栏收起时触发悬停收起
    if (state === "collapsed") {
      // 检查鼠标是否正在移动到下拉菜单或相关元素
      const relatedTarget = event.relatedTarget as Element
      const isMovingToDropdown = relatedTarget && 
        typeof relatedTarget.closest === 'function' && (
          DROPDOWN_SELECTORS.some(selector => relatedTarget.closest(selector)) ||
          relatedTarget.closest('[data-state="open"]')
        )
      
      // 如果移动到下拉菜单则使用较长延迟，否则使用较短延迟
      const delay = isMovingToDropdown ? 200 : 100
      setHoveredWithDelay(false, delay)
    }
  }, [state, setHoveredWithDelay])


  // 确定侧边栏是否应显示为展开状态（实际打开或收起时悬停）
  const shouldShowExpanded = open || (state === "collapsed" && isHovered)

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "flex h-full w-(--sidebar-width) flex-col",
          className
        )}
        style={{
          backgroundColor: "var(--color-sidebar-background)",
          color: "var(--color-sidebar-foreground)",
        } as React.CSSProperties}
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={shouldShowExpanded ? "expanded" : state}
      data-collapsible={shouldShowExpanded ? "" : (state === "collapsed" ? collapsible : "")}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 这是处理桌面端侧边栏间隙的部分 */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180"
        )}
        style={{
          width: shouldShowExpanded ? SIDEBAR_WIDTH : (state === "collapsed" ? SIDEBAR_WIDTH_ICON : SIDEBAR_WIDTH)
        }}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "relative z-10 hidden h-full transition-[width] duration-200 ease-linear md:flex",
          // 展开或悬停时添加边框
          shouldShowExpanded 
            ? "group-data-[side=left]:border-r group-data-[side=right]:border-l"
            : "",
          className
        )}
        style={{
          width: shouldShowExpanded ? SIDEBAR_WIDTH : (state === "collapsed" ? SIDEBAR_WIDTH_ICON : SIDEBAR_WIDTH)
        }}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className={cn(
            "flex h-full w-full flex-col overflow-hidden group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm",
            // 展开或悬停时显示正常布局，收起且未悬停时显示图标布局
            shouldShowExpanded 
              ? "" 
              : "group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2"
          )}
          style={{
            backgroundColor: "var(--color-sidebar-background)",
            color: "var(--color-sidebar-foreground)",
            borderColor: "var(--color-sidebar-border)",
          } as React.CSSProperties}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full flex-1 flex-col border-l",
        className
      )}
      style={{
        backgroundColor: "var(--color-background)",
      } as React.CSSProperties}
      {...props}
    />
  )
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("bg-background h-8 w-full shadow-none", className)}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2", className)}
      {...props}
    />
  )
}

function SidebarFooter({ 
  className, 
  showTrigger = true,
  children,
  ...props 
}: React.ComponentProps<"div"> & {
  showTrigger?: boolean
}) {
  const { toggleSidebar } = useSidebar()

  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2", className)}
      {...props}
    >
      {children}
      {showTrigger && (
        <div className="flex items-center justify-center pt-2 border-t border-sidebar-border">
          <Button
            data-sidebar="trigger"
            data-slot="sidebar-trigger"
            variant="ghost"
            size="icon"
            className="size-7 group-data-[collapsible=icon]:size-8"
            onClick={toggleSidebar}
          >
            <PanelLeftIcon />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </div>
      )}
    </div>
  )
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("bg-sidebar-border mx-2 w-auto", className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-1",
        className
      )}
      {...props}
    />
  )
}


function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:[&>svg:not(:first-child)]:hidden [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot : "button"
  const { state } = useSidebar()

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  )

  if (!tooltip) {
    return button
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed"}
        {...tooltip}
      />
    </Tooltip>
  )
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  showOnHover?: boolean
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean
}) {
  // 50% 到 90% 之间的随机宽度
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  )
}

function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
  size?: "sm" | "md"
  isActive?: boolean
}) {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
