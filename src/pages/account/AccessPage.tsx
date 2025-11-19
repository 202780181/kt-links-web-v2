import { Key, KeyRound, Copy, RotateCw, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

const AccountAccessPage = () => {
  const accessKeys = [
    {
      icon: Key,
      name: 'API Key',
      description: '用于 API 调用的密钥',
      value: 'sk_live_••••••••••••••••••••1234',
      status: 'active',
      statusText: '已生成',
      actions: [
        { label: '复制', icon: Copy, variant: 'outline' as const, action: 'copy' },
        { label: '重置', icon: RotateCw, variant: 'outline' as const, action: 'reset' },
      ],
    },
    {
      icon: KeyRound,
      name: 'Access Token',
      description: '用于身份验证的令牌',
      value: 'at_••••••••••••••••••••5678',
      status: 'active',
      statusText: '有效',
      actions: [
        { label: '复制', icon: Copy, variant: 'outline' as const, action: 'copy' },
        { label: '吊销', icon: XCircle, variant: 'destructive' as const, action: 'revoke' },
      ],
    },
  ]

  const handleAction = (keyName: string, action: string) => {
    switch (action) {
      case 'copy':
        toast.success(`${keyName} 已复制到剪贴板`)
        break
      case 'reset':
        toast.info(`正在重置 ${keyName}...`)
        break
      case 'revoke':
        toast.warning(`${keyName} 已吊销`)
        break
    }
  }

  return (
    <div className="w-full p-6 space-y-6 pb-20">
      {/* 页面标题 */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">访问管理</h1>
        <p className="text-muted-foreground">管理您的 API 密钥和访问令牌</p>
      </div>

      {/* 访问密钥卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            访问密钥
          </CardTitle>
          <CardDescription>查看和管理您的访问凭证</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accessKeys.map((key, index) => (
              <div key={key.name}>
                <div className="flex items-start justify-between py-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <key.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{key.name}</p>
                        <Badge
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {key.statusText}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{key.description}</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {key.value}
                      </code>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {key.actions.map((action) => (
                      <Button
                        key={action.label}
                        variant={action.variant}
                        size="sm"
                        className="gap-1"
                        onClick={() => handleAction(key.name, action.action)}
                      >
                        <action.icon className="h-3.5 w-3.5" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
                {index < accessKeys.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AccountAccessPage
