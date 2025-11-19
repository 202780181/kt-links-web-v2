import { useRef, useState, useEffect, useCallback, type ReactNode, type CSSProperties } from 'react'
import './scrollbar.css'

interface CustomScrollbarProps {
  children: ReactNode
  className?: string
  height?: string | number
  showShadows?: boolean
}

/**
 * 自定义滚动条组件 - React 版本
 * 参考 Vue 实现，支持横向和纵向滚动条，以及滚动阴影
 */
export const CustomScrollbar = ({
  children,
  className = '',
  height = '100%',
  showShadows = true,
}: CustomScrollbarProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const horizontalTrackRef = useRef<HTMLDivElement>(null)
  const horizontalThumbRef = useRef<HTMLDivElement>(null)
  const verticalTrackRef = useRef<HTMLDivElement>(null)
  const verticalThumbRef = useRef<HTMLDivElement>(null)

  // 横向滚动条状态
  const [isHorizontalScrollbarVisible, setIsHorizontalScrollbarVisible] = useState(false)
  const [isHorizontalHovering, setIsHorizontalHovering] = useState(false)
  const [isHorizontalDragging, setIsHorizontalDragging] = useState(false)
  const [thumbWidth, setThumbWidth] = useState(0)
  const [thumbLeft, setThumbLeft] = useState(0)

  // 纵向滚动条状态
  const [isVerticalScrollbarVisible, setIsVerticalScrollbarVisible] = useState(false)
  const [isVerticalHovering, setIsVerticalHovering] = useState(false)
  const [isVerticalDragging, setIsVerticalDragging] = useState(false)
  const [thumbHeight, setThumbHeight] = useState(0)
  const [thumbTop, setThumbTop] = useState(0)

  // 阴影显示状态
  const [showLeftShadow, setShowLeftShadow] = useState(false)
  const [showRightShadow, setShowRightShadow] = useState(false)
  const [showTopShadow, setShowTopShadow] = useState(false)
  const [showBottomShadow, setShowBottomShadow] = useState(false)

  // 拖拽相关
  const dragStartX = useRef(0)
  const dragStartY = useRef(0)
  const dragStartScrollLeft = useRef(0)
  const dragStartScrollTop = useRef(0)
  const dragStartThumbLeft = useRef(0)
  const dragStartThumbTop = useRef(0)
  const clickOffsetX = useRef(0)
  const clickOffsetY = useRef(0)
  const dragTrackLeft = useRef(0)
  const dragTrackTop = useRef(0)

  const scrollTimer = useRef<NodeJS.Timeout | null>(null)
  const rafId = useRef<number | null>(null)

  // 更新阴影显示
  const updateShadows = useCallback(() => {
    const content = contentRef.current
    if (!content) return

    // 横向滚动阴影
    const maxScrollLeft = Math.max(0, content.scrollWidth - content.clientWidth)
    const scrollLeft = content.scrollLeft
    if (maxScrollLeft <= 1) {
      setShowLeftShadow(false)
      setShowRightShadow(false)
    } else {
      setShowLeftShadow(scrollLeft > 1)
      setShowRightShadow(scrollLeft < maxScrollLeft - 1)
    }

    // 纵向滚动阴影
    const maxScrollTop = Math.max(0, content.scrollHeight - content.clientHeight)
    const scrollTop = content.scrollTop
    if (maxScrollTop <= 1) {
      setShowTopShadow(false)
      setShowBottomShadow(false)
    } else {
      setShowTopShadow(scrollTop > 1)
      setShowBottomShadow(scrollTop < maxScrollTop - 1)
    }
  }, [])

  // 更新横向滚动条
  const updateHorizontalScrollbar = useCallback(() => {
    const content = contentRef.current
    const track = horizontalTrackRef.current

    if (!content || !track) return

    const containerWidth = content.offsetWidth
    const contentWidth = content.scrollWidth

    if (contentWidth <= containerWidth + 1) {
      setIsHorizontalScrollbarVisible(false)
      setThumbLeft(0)
      return
    }

    setIsHorizontalScrollbarVisible(true)

    const thumbRatio = containerWidth / contentWidth
    setThumbWidth(Math.max(20, track.offsetWidth * thumbRatio))

    updateHorizontalThumbPosition()
  }, [])

  // 更新纵向滚动条
  const updateVerticalScrollbar = useCallback(() => {
    const content = contentRef.current
    const track = verticalTrackRef.current

    if (!content || !track) return

    const containerHeight = content.offsetHeight
    const contentHeight = content.scrollHeight

    if (contentHeight <= containerHeight + 1) {
      setIsVerticalScrollbarVisible(false)
      setThumbTop(0)
      return
    }

    setIsVerticalScrollbarVisible(true)

    const thumbRatio = containerHeight / contentHeight
    setThumbHeight(Math.max(20, track.offsetHeight * thumbRatio))

    updateVerticalThumbPosition()
  }, [])

  // 更新横向滚动条位置
  const updateHorizontalThumbPosition = useCallback(() => {
    const content = contentRef.current
    const track = horizontalTrackRef.current

    if (!content || !track) return

    const scrollLeft = content.scrollLeft
    const containerWidth = content.offsetWidth
    const contentWidth = content.scrollWidth
    const trackWidth = track.offsetWidth

    const scrollRatio = scrollLeft / (contentWidth - containerWidth)
    setThumbLeft(scrollRatio * (trackWidth - thumbWidth))
  }, [thumbWidth])

  // 更新纵向滚动条位置
  const updateVerticalThumbPosition = useCallback(() => {
    const content = contentRef.current
    const track = verticalTrackRef.current

    if (!content || !track) return

    const scrollTop = content.scrollTop
    const containerHeight = content.offsetHeight
    const contentHeight = content.scrollHeight
    const trackHeight = track.offsetHeight

    const scrollRatio = scrollTop / (contentHeight - containerHeight)
    setThumbTop(scrollRatio * (trackHeight - thumbHeight))
  }, [thumbHeight])

  // 更新所有滚动条
  const updateScrollbar = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current)
    }
    rafId.current = requestAnimationFrame(() => {
      if (contentRef.current && horizontalTrackRef.current && verticalTrackRef.current) {
        updateHorizontalScrollbar()
        updateVerticalScrollbar()
        updateShadows()
      }
      rafId.current = null
    })
  }, [updateHorizontalScrollbar, updateVerticalScrollbar, updateShadows])

  // 显示滚动条
  const showScrollbar = useCallback(() => {
    if (horizontalTrackRef.current) {
      horizontalTrackRef.current.classList.add('scrollbar-active')
    }
    if (verticalTrackRef.current) {
      verticalTrackRef.current.classList.add('scrollbar-active')
    }
  }, [])

  // 隐藏滚动条
  const hideScrollbar = useCallback(() => {
    if (horizontalTrackRef.current) {
      horizontalTrackRef.current.classList.remove('scrollbar-active')
    }
    if (verticalTrackRef.current) {
      verticalTrackRef.current.classList.remove('scrollbar-active')
    }
  }, [])

  // 处理内容滚动
  const handleScroll = useCallback(() => {
    if (!isHorizontalDragging) {
      updateHorizontalThumbPosition()
    }
    if (!isVerticalDragging) {
      updateVerticalThumbPosition()
    }
    showScrollbar()
    updateShadows()

    if (scrollTimer.current) {
      clearTimeout(scrollTimer.current)
    }
    scrollTimer.current = setTimeout(() => {
      if (!isHorizontalHovering && !isHorizontalDragging && !isVerticalHovering && !isVerticalDragging) {
        hideScrollbar()
      }
    }, 1000)
  }, [isHorizontalDragging, isVerticalDragging, isHorizontalHovering, isVerticalHovering, updateHorizontalThumbPosition, updateVerticalThumbPosition, showScrollbar, updateShadows, hideScrollbar])

  // 横向滚动条拖拽开始
  const handleHorizontalThumbMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const content = contentRef.current
    const track = horizontalTrackRef.current
    if (!content || !track) return

    setIsHorizontalDragging(true)
    dragStartX.current = e.clientX
    dragStartScrollLeft.current = content.scrollLeft
    dragStartThumbLeft.current = thumbLeft

    const trackRect = track.getBoundingClientRect()
    dragTrackLeft.current = trackRect.left
    clickOffsetX.current = e.clientX - (dragTrackLeft.current + thumbLeft)

    document.body.style.userSelect = 'none'
    showScrollbar()
    track.classList.add('dragging')
  }, [thumbLeft, showScrollbar])

  // 纵向滚动条拖拽开始
  const handleVerticalThumbMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const content = contentRef.current
    const track = verticalTrackRef.current
    if (!content || !track) return

    setIsVerticalDragging(true)
    dragStartY.current = e.clientY
    dragStartScrollTop.current = content.scrollTop
    dragStartThumbTop.current = thumbTop

    const trackRect = track.getBoundingClientRect()
    dragTrackTop.current = trackRect.top
    clickOffsetY.current = e.clientY - (dragTrackTop.current + thumbTop)

    document.body.style.userSelect = 'none'
    showScrollbar()
    track.classList.add('dragging')
  }, [thumbTop, showScrollbar])

  // 鼠标移动处理
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isHorizontalDragging) {
      e.preventDefault()
      const track = horizontalTrackRef.current
      const content = contentRef.current
      if (!track || !content) return

      const trackWidth = track.offsetWidth
      const maxThumbLeft = Math.max(0, trackWidth - thumbWidth)

      const newThumbLeft = Math.max(0, Math.min(e.clientX - dragTrackLeft.current - clickOffsetX.current, maxThumbLeft))
      setThumbLeft(newThumbLeft)

      const contentWidth = content.scrollWidth
      const containerWidth = content.offsetWidth
      const maxScrollLeft = Math.max(0, contentWidth - containerWidth)
      const ratio = maxThumbLeft === 0 ? 0 : (newThumbLeft / maxThumbLeft)
      content.scrollLeft = ratio * maxScrollLeft
    }

    if (isVerticalDragging) {
      e.preventDefault()
      const track = verticalTrackRef.current
      const content = contentRef.current
      if (!track || !content) return

      const trackHeight = track.offsetHeight
      const maxThumbTop = Math.max(0, trackHeight - thumbHeight)

      const newThumbTop = Math.max(0, Math.min(e.clientY - dragTrackTop.current - clickOffsetY.current, maxThumbTop))
      setThumbTop(newThumbTop)

      const contentHeight = content.scrollHeight
      const containerHeight = content.offsetHeight
      const maxScrollTop = Math.max(0, contentHeight - containerHeight)
      const ratio = maxThumbTop === 0 ? 0 : (newThumbTop / maxThumbTop)
      content.scrollTop = ratio * maxScrollTop
    }
  }, [isHorizontalDragging, isVerticalDragging, thumbWidth, thumbHeight])

  // 鼠标释放处理
  const handleMouseUp = useCallback(() => {
    if (isHorizontalDragging) {
      setIsHorizontalDragging(false)
      document.body.style.userSelect = ''
      const track = horizontalTrackRef.current
      if (track) track.classList.remove('dragging')
    }
    if (isVerticalDragging) {
      setIsVerticalDragging(false)
      document.body.style.userSelect = ''
      const track = verticalTrackRef.current
      if (track) track.classList.remove('dragging')
    }
    if (!isHorizontalHovering && !isVerticalHovering) {
      hideScrollbar()
    }
  }, [isHorizontalDragging, isVerticalDragging, isHorizontalHovering, isVerticalHovering, hideScrollbar])

  // 监听拖拽事件
  useEffect(() => {
    if (isHorizontalDragging || isVerticalDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isHorizontalDragging, isVerticalDragging, handleMouseMove, handleMouseUp])

  // 初始化和监听变化
  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    updateScrollbar()

    const resizeObserver = new ResizeObserver(updateScrollbar)
    resizeObserver.observe(content)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    const mutationObserver = new MutationObserver(updateScrollbar)
    mutationObserver.observe(content, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    window.addEventListener('resize', updateScrollbar)

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener('resize', updateScrollbar)
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current)
      }
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [updateScrollbar])

  const containerStyle: CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
  }

  const horizontalThumbStyle: CSSProperties = {
    width: `${thumbWidth}px`,
    left: `${thumbLeft}px`,
  }

  const verticalThumbStyle: CSSProperties = {
    height: `${thumbHeight}px`,
    top: `${thumbTop}px`,
  }

  return (
    <div ref={containerRef} className={`custom-scrollbar-container ${className}`} style={containerStyle}>
      <div ref={contentRef} className="custom-scrollbar-content" onScroll={handleScroll}>
        {children}
      </div>

      {/* 左右阴影 */}
      {showShadows && showLeftShadow && <div className="edge-shadow left" />}
      {showShadows && showRightShadow && <div className="edge-shadow right" />}
      {showShadows && showTopShadow && <div className="edge-shadow top" />}
      {showShadows && showBottomShadow && <div className="edge-shadow bottom" />}

      {/* 横向滚动条 */}
      <div
        ref={horizontalTrackRef}
        className={`custom-scrollbar-track horizontal ${isHorizontalScrollbarVisible ? 'scrollbar-visible' : ''}`}
        onMouseEnter={() => {
          setIsHorizontalHovering(true)
          showScrollbar()
        }}
        onMouseLeave={() => {
          setIsHorizontalHovering(false)
          if (!isHorizontalDragging && !isVerticalHovering && !isVerticalDragging) {
            hideScrollbar()
          }
        }}
      >
        <div
          ref={horizontalThumbRef}
          className="custom-scrollbar-thumb"
          style={horizontalThumbStyle}
          onMouseDown={handleHorizontalThumbMouseDown}
        />
      </div>

      {/* 纵向滚动条 */}
      <div
        ref={verticalTrackRef}
        className={`custom-scrollbar-track vertical ${isVerticalScrollbarVisible ? 'scrollbar-visible' : ''}`}
        onMouseEnter={() => {
          setIsVerticalHovering(true)
          showScrollbar()
        }}
        onMouseLeave={() => {
          setIsVerticalHovering(false)
          if (!isVerticalDragging && !isHorizontalHovering && !isHorizontalDragging) {
            hideScrollbar()
          }
        }}
      >
        <div
          ref={verticalThumbRef}
          className="custom-scrollbar-thumb"
          style={verticalThumbStyle}
          onMouseDown={handleVerticalThumbMouseDown}
        />
      </div>
    </div>
  )
}

export default CustomScrollbar
