import { useState, useRef } from 'react'
import { IconUpload, IconX } from '@tabler/icons-react'
import { toast } from 'sonner'
import { uploadPublicFile } from '@/api/upload'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string
  onChange?: (url: string) => void
  maxSize?: number // MB
  accept?: string
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  maxSize = 2,
  accept = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml',
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string>(value || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件大小
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`文件大小不能超过 ${maxSize}MB`)
      return
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('只能上传图片文件')
      return
    }

    setUploading(true)
    try {
      const response = await uploadPublicFile(file)
      if (response.code === 0 && response.data) {
        const imageUrl = response.data.url
        setPreview(imageUrl)
        onChange?.(imageUrl)
        toast.success('上传成功')
      } else {
        toast.error(response.msg || '上传失败')
      }
    } catch (error) {
      console.error('上传失败:', error)
      toast.error('上传失败，请重试')
    } finally {
      setUploading(false)
      // 清空input值，允许上传同一个文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    setPreview('')
    onChange?.('')
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      
      {preview ? (
        <div className="relative inline-block">
          <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg overflow-hidden bg-muted">
            <img
              src={preview}
              alt="预览"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconUpload className="w-6 h-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {uploading ? '上传中...' : '上传图标'}
          </span>
        </button>
      )}
      
      <p className="text-xs text-muted-foreground mt-2">
        支持 JPG、PNG、GIF、WebP、SVG 格式，文件大小不超过 {maxSize}MB
      </p>
    </div>
  )
}
