import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, FileText, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'

// 假数据

const quotaData = {
  name: '实例配额',
  used: 0,
  total: 100,
  percentage: 0,
  status: '已添加' as const,
}

const metricsData = [
  {
    id: 1,
    title: '实例在线流速率',
    value: 0,
    unit: '条/秒',
    updateInterval: '1min',
    chartData: [],
    dateRange: { start: '2025/1/12 14:26:11', end: '2025/1/12 14:29:11' },
  },
  {
    id: 2,
    title: '流出上行 TPS',
    value: 0,
    unit: '条/秒',
    updateInterval: '1min',
    chartData: [],
    dateRange: { start: '2025/1/12 14:42:11', end: '2025/1/12 14:25:11' },
  },
  {
    id: 3,
    title: '流出推送数 TPS',
    value: 0,
    unit: '条/秒',
    updateInterval: '1min',
    chartData: [],
    dateRange: { start: '2025/1/12 14:26:11', end: '2025/1/12 14:25:11' },
  },
]

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('realtime')

  return (
    <div className="flex flex-col gap-6 p-6 pb-20">
      {/* 实例详情 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold">实例详情</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 实例基本信息 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                实例基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">实例 ID</span>
                <span className="text-sm">-</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">每日全量</Badge>
                  <Badge variant="secondary" className="text-xs">公共实例</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">到期时间</span>
                <span className="text-sm">-</span>
              </div>
            </CardContent>
          </Card>

          {/* 实例配额 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  {quotaData.name}
                </CardTitle>
                <Button variant="link" className="h-auto p-0 text-blue-500 text-sm">
                  升级套餐
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm font-medium">{quotaData.status}</div>
              <Progress value={quotaData.percentage} className="h-2" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 实时运行数据 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">实时运行数据</h2>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="realtime">流量统计</TabsTrigger>
            <TabsTrigger value="history">异地运营历史</TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="space-y-4 mt-4">
            {metricsData.map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <CardTitle className="text-base font-medium">{metric.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{metric.dateRange.start}</span>
                      <span>-</span>
                      <span>{metric.dateRange.end}</span>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <Calendar className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    统计周期：{metric.updateInterval}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* 左右布局：左侧数值，右侧图表 */}
                  <div className="flex items-center gap-6">
                    {/* 左侧：数值显示 */}
                    <div className="flex-shrink-0 w-48">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-2">在线 {metric.value}</div>
                        <div className="text-5xl font-semibold mb-2">{metric.value}</div>
                        <Progress value={0} className="h-2 mb-2" />
                        <div className="text-xs text-muted-foreground">{metric.value}</div>
                      </div>
                    </div>

                    {/* 右侧：图表 */}
                    <div className="flex-1 h-48 flex items-center justify-center border rounded-lg bg-muted/10">
                      <span className="text-sm text-muted-foreground">暂无数据</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  异地运营历史数据暂无
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default HomePage
