import { Settings, ShieldCheck, Smartphone, Lock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const AccountSecurityPage = () => {
  const securityItems = [
    {
      icon: ShieldCheck,
      title: '登录保护',
      description: '保护您的账户免受未授权访问',
      status: 'enabled',
      statusText: '已开启',
      action: '管理',
    },
    {
      icon: Smartphone,
      title: '二次验证',
      description: '通过手机验证码增强账户安全',
      status: 'disabled',
      statusText: '未开启',
      action: '开启',
    },
    {
      icon: Lock,
      title: '敏感操作校验',
      description: '在执行敏感操作时需要额外验证',
      status: 'enabled',
      statusText: '已开启',
      action: '管理',
    },
  ]

  return (
    <div className="w-full p-6 space-y-6 pb-20">
      {/* 页面标题 */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">安全设置</h1>
        <p className="text-muted-foreground">管理您的账户安全选项</p>
      </div>

      {/* 安全项卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            安全项
          </CardTitle>
          <CardDescription>配置您的账户安全功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityItems.map((item, index) => (
              <div key={item.title}>
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={item.status === 'enabled' ? 'default' : 'secondary'}
                      className={
                        item.status === 'enabled'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-gray-500 hover:bg-gray-600'
                      }
                    >
                      {item.statusText}
                    </Badge>
                    <Button
                      variant={item.status === 'enabled' ? 'outline' : 'default'}
                      size="sm"
                    >
                      {item.action}
                    </Button>
                  </div>
                </div>
                {index < securityItems.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AccountSecurityPage
