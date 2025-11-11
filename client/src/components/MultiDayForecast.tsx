import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Cloud, TrendingUp } from "lucide-react";

interface ForecastData {
  date: string;
  dayOfWeek: string;
  fogProbability: number;
  sunrise: string;
}

interface MultiDayForecastProps {
  data: ForecastData[];
  isLoading?: boolean;
}

export default function MultiDayForecast({ data, isLoading }: MultiDayForecastProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-slate-500 dark:text-slate-400">
          <p>暂无预报数据</p>
        </CardContent>
      </Card>
    );
  }

  // 格式化数据用于图表显示
  const chartData = data.map((item) => ({
    date: item.date,
    day: `${item.dayOfWeek}`,
    probability: Math.round(item.fogProbability),
    sunrise: item.sunrise,
  }));

  // 获取概率等级
  const getLevel = (probability: number) => {
    if (probability >= 80) return "极高";
    if (probability >= 60) return "高";
    if (probability >= 40) return "中";
    if (probability >= 20) return "低";
    return "极低";
  };

  // 获取颜色
  const getColor = (probability: number) => {
    if (probability >= 80) return "text-red-600 dark:text-red-400";
    if (probability >= 60) return "text-orange-600 dark:text-orange-400";
    if (probability >= 40) return "text-yellow-600 dark:text-yellow-400";
    if (probability >= 20) return "text-blue-600 dark:text-blue-400";
    return "text-green-600 dark:text-green-400";
  };

  const getBgColor = (probability: number) => {
    if (probability >= 80) return "bg-red-50 dark:bg-red-950";
    if (probability >= 60) return "bg-orange-50 dark:bg-orange-950";
    if (probability >= 40) return "bg-yellow-50 dark:bg-yellow-950";
    if (probability >= 20) return "bg-blue-50 dark:bg-blue-950";
    return "bg-green-50 dark:bg-green-950";
  };

  return (
    <div className="space-y-6">
      {/* 趋势图表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            晨雾概率趋势
          </CardTitle>
          <CardDescription>未来7天晨雾概率变化趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis domain={[0, 100]} label={{ value: "概率 (%)", angle: -90, position: "insideLeft" }} />
              <Tooltip
                formatter={(value) => `${value}%`}
                labelFormatter={(label) => `${label}`}
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  color: "#fff",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="probability"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 5 }}
                activeDot={{ r: 7 }}
                name="晨雾概率"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 柱状图 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            每日概率对比
          </CardTitle>
          <CardDescription>各天晨雾概率对比</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis domain={[0, 100]} label={{ value: "概率 (%)", angle: -90, position: "insideLeft" }} />
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="probability" fill="#3b82f6" name="晨雾概率" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 详细列表 */}
      <Card>
        <CardHeader>
          <CardTitle>详细预报</CardTitle>
          <CardDescription>未来7天逐日预报详情</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.map((forecast, index) => (
              <div
                key={index}
                className={`${getBgColor(forecast.fogProbability)} border border-gray-200 dark:border-gray-700 rounded-lg p-4`}
              >
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {forecast.date} (周{forecast.dayOfWeek})
                </div>
                <div className={`text-3xl font-bold ${getColor(forecast.fogProbability)} mb-2`}>
                  {Math.round(forecast.fogProbability)}%
                </div>
                <div className={`text-sm font-medium ${getColor(forecast.fogProbability)} mb-2`}>
                  {getLevel(forecast.fogProbability)}概率
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  日出: {forecast.sunrise}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

