import { Shield, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const AccountVerificationPage = () => {
  return (
    <div className="w-full p-6 space-y-6 pb-20">
      {/* 页面标题 */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">实名认证</h1>
        <p className="text-muted-foreground">管理您的实名认证信息</p>
      </div>

      {/* 认证信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            认证信息
          </CardTitle>
          <CardDescription>查看您的实名认证状态</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 认证状态 */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">当前认证状态</p>
                <p className="text-sm text-green-700 dark:text-green-300">您的账户已完成实名认证</p>
              </div>
            </div>
            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
              已认证
            </Badge>
          </div>

          <Separator />

          {/* 认证说明 */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium">认证变更说明</p>
              <p className="text-sm text-muted-foreground">
                如需变更认证主体，请提交认证变更申请。变更申请将在 1-3 个工作日内完成审核。
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                提交变更申请
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AccountVerificationPage
