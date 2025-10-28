import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Cloud, TrendingUp, TrendingDown } from "lucide-react";

interface CloudLayerVisualizationProps {
  cloudData: any;
  cloudTrend: any;
  hourlyData: any[];
}

export default function CloudLayerVisualization({
  cloudData,
  cloudTrend,
  hourlyData,
}: CloudLayerVisualizationProps) {
  // 准备云层剖面图数据
  const profileData = [
    {
      name: "低云层\n(0-2000m)",
      value: cloudData.lowCloud,
      fill: "#3b82f6",
    },
    {
      name: "中云层\n(2000-6000m)",
      value: cloudData.midCloud,
      fill: "#a855f7",
    },
    {
      name: "高云层\n(6000m+)",
      value: cloudData.highCloud,
      fill: "#6366f1",
    },
  ];

  // 准备云层趋势数据
  const trendData = hourlyData.map((item, index) => ({
    time: new Date(item.time).getHours() + ":00",
    lowCloud: item.lowCloudCover,
    midCloud: item.midCloudCover,
    highCloud: item.highCloudCover,
    totalCloud: item.cloudCover,
  }));

  const getTrendIcon = (trend: string) => {
    if (trend === "increasing") {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (trend === "decreasing") {
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    }
    return <span className="text-slate-500">→</span>;
  };

  const getTrendText = (trend: string) => {
    if (trend === "increasing") return "上升";
    if (trend === "decreasing") return "下降";
    return "稳定";
  };

  return (
    <div className="space-y-6">
      {/* 云层剖面图 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            大气云层剖面图
          </CardTitle>
          <CardDescription>日出时刻的云层覆盖率分布</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={profileData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: "覆盖率 (%)", angle: -90, position: "insideLeft" }} />
              <Tooltip
                formatter={(value: any) => `${typeof value === 'number' ? value.toFixed(1) : value}%`}
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* 云层说明 */}
          <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
              ☁️ 云层高度说明
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-800 dark:text-blue-200">
              <div>
                <p className="font-semibold mb-1">低云层 (0-2000m)</p>
                <p>层积云、层云、积云等。离地面最近，最容易影响地面能见度。</p>
              </div>
              <div>
                <p className="font-semibold mb-1">中云层 (2000-6000m)</p>
                <p>高层云、高积云等。影响日照强度和地面温度。</p>
              </div>
              <div>
                <p className="font-semibold mb-1">高云层 (6000m+)</p>
                <p>卷云、卷层云、卷积云等。对地面影响较小，主要影响大气辐射。</p>
              </div>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
              <strong>注意：</strong> 云层高度基于海平面计算。实际云层高度会因地点海拔而有所不同。海拔越高，相同的云层类型会出现在更低的高度。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 云层变化趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>日出前后1小时云层变化趋势</CardTitle>
          <CardDescription>各层云量随时间的变化</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis label={{ value: "覆盖率 (%)", angle: -90, position: "insideLeft" }} />
              <Tooltip
                formatter={(value: any) => `${typeof value === 'number' ? value.toFixed(1) : value}%`}
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="lowCloud"
                stroke="#3b82f6"
                name="低云层"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="midCloud"
                stroke="#a855f7"
                name="中云层"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="highCloud"
                stroke="#6366f1"
                name="高云层"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="totalCloud"
                stroke="#f59e0b"
                name="总云量"
                dot={{ r: 4 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 云层趋势分析 */}
      <Card>
        <CardHeader>
          <CardTitle>云层变化趋势分析</CardTitle>
          <CardDescription>各层云量的增减趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex-shrink-0">
                {getTrendIcon(cloudTrend.lowCloudTrend)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">低云层</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {getTrendText(cloudTrend.lowCloudTrend)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex-shrink-0">
                {getTrendIcon(cloudTrend.midCloudTrend)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">中云层</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {getTrendText(cloudTrend.midCloudTrend)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex-shrink-0">
                {getTrendIcon(cloudTrend.highCloudTrend)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">高云层</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {getTrendText(cloudTrend.highCloudTrend)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex-shrink-0">
                {getTrendIcon(cloudTrend.totalCloudTrend)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">总云量</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {getTrendText(cloudTrend.totalCloudTrend)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

