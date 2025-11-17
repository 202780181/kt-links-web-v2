import React from 'react'
import { cn } from '@/lib/utils'
import { NotificationCenterProvider } from '@/context/NotificationCenterContext'

interface SimpleLayoutProps extends React.PropsWithChildren {
  className?: string
  containerClassName?: string
  padding?: boolean
}

const SimpleLayout: React.FC<SimpleLayoutProps> = ({ 
  children, 
  className,
  containerClassName,
  padding = true
}) => {
  return (
    <NotificationCenterProvider>
      <div className={cn("min-h-screen bg-background", className)}>
        <main className={cn(
          padding && "p-6 pb-10",
          containerClassName
        )}>
          {children}
        </main>
      </div>
    </NotificationCenterProvider>
  )
}

export default SimpleLayout
