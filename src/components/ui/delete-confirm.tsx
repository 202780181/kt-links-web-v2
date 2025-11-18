import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DeleteConfirmButtonProps {
  onConfirm: () => void
  children: React.ReactNode
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
}

export function DeleteConfirmButton({
  onConfirm,
  children,
  title = '确认删除',
  description = '此操作无法撤销，确定要删除吗？',
  confirmText = '确认',
  cancelText = '取消',
}: DeleteConfirmButtonProps) {
  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    onConfirm()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="font-medium text-sm">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setOpen(false)}
            >
              {cancelText}
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
