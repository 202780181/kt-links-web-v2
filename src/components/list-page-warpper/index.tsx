import type { ReactNode } from 'react'
import { useRef, useEffect, useState, cloneElement, isValidElement } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

/**
 * 页面容器组件
 * 自动计算高度，填满可用空间（视口高度 - header 高度）
 */
export const PageContainer = ({ children, className = '' }: PageContainerProps) => {
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {children}
    </div>
  )
}

interface ListPageContainerProps {
  /**
   * 顶部查询/操作区域
   */
  toolbar?: ReactNode
  /**
   * 表格内容区域
   */
  children: ReactNode
  /**
   * 容器间距
   */
  gap?: 'sm' | 'md' | 'lg'
  /**
   * 容器内边距
   */
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const gapMap = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

/**
 * 列表页面容器组件
 * 专门用于列表页面，自动处理高度计算
 * - 顶部工具栏：自然高度
 * - 表格区域：占据剩余空间，内部滚动
 * 
 * 工作原理：
 * 1. 外层 h-full 填满可用高度（视口 - header）
 * 2. padding 在外层，不影响内部高度计算
 * 3. 内层 flex-1 min-h-0 自动减去 padding
 * 4. 动态计算表格区域高度
 * 5. 将计算好的高度传递给 DataTable 的 tableHeight 属性
 */
export const ListPageContainer = ({
  toolbar,
  children,
  gap = 'md',
  padding = 'md',
}: ListPageContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [tableHeight, setTableHeight] = useState<number>(0)

  useEffect(() => {
    const calculateHeight = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight
        const toolbarHeight = toolbarRef.current?.clientHeight || 0
        const gapValue = gap === 'sm' ? 8 : gap === 'md' ? 16 : 24
        
        // 计算表格可用高度 = 容器高度 - 工具栏高度 - gap - 额外预留空间
        // 额外预留 8px 用于边距、边框等
        const extraSpace = 0
        const availableHeight = containerHeight - toolbarHeight - (toolbar ? gapValue : 0) - extraSpace
        setTableHeight(availableHeight)
      }
    }

    calculateHeight()
    
    // 监听窗口大小变化
    window.addEventListener('resize', calculateHeight)
    return () => window.removeEventListener('resize', calculateHeight)
  }, [toolbar, gap])

  // 克隆 children 并注入 tableHeight 属性
  const childrenWithHeight = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, { tableHeight })
    : children

  return (
    <div className={`h-full flex flex-col ${paddingMap[padding]}`}>
      <div ref={containerRef} className={`flex-1 min-h-0 flex flex-col ${gapMap[gap]}`}>
        {/* 顶部工具栏区域 - 自然高度 */}
        {toolbar && (
          <div ref={toolbarRef} className="shrink-0">
            {toolbar}
          </div>
        )}

        {/* 表格区域 - 传递计算好的高度 */}
        <div className="shrink-0">
          {childrenWithHeight}
        </div>
      </div>
    </div>
  )
}
