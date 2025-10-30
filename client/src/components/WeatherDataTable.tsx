import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Thermometer, Droplets, Wind, Cloud, Eye } from "lucide-react";

interface WeatherDataTableProps {
  data: any[];
}

export default function WeatherDataTable({ data }: WeatherDataTableProps) {
  const getWeatherIcon = (code: number) => {
    if (code === 0) return "☀️";
    if (code === 1 || code === 2) return "🌤️";
    if (code === 3) return "☁️";
    if (code === 45 || code === 48) return "🌫️";
    if (code >= 51 && code <= 67) return "🌧️";
    if (code >= 71 && code <= 77) return "❄️";
    if (code >= 80 && code <= 82) return "⛈️";
    if (code >= 85 && code <= 86) return "🌨️";
    if (code >= 95 && code <= 99) return "⛈️";
    return "🌤️";
  };

  const getHighlight = (data: any) => {
    const highlights = [];
    if (data.relativeHumidity >= 80) highlights.push("高湿度");
    if (data.windSpeed <= 3) highlights.push("微风");
    if (data.tempDewPointGap <= 3) highlights.push("接近露点");
    if (data.weatherCode === 45 || data.weatherCode === 48) highlights.push("雾天气");
    return highlights;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>日出前后2小时详细气象数据</CardTitle>
        <CardDescription>按小时展示气象指标，关键指标已高亮显示</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 font-semibold">时间</th>
                <th className="text-center py-3 px-4 font-semibold">天气</th>
                <th className="text-center py-3 px-4 font-semibold">温度</th>
                <th className="text-center py-3 px-4 font-semibold">相对湿度</th>
                <th className="text-center py-3 px-4 font-semibold">露点</th>
                <th className="text-center py-3 px-4 font-semibold">温-露差</th>
                <th className="text-center py-3 px-4 font-semibold">风速</th>
                <th className="text-center py-3 px-4 font-semibold">云量</th>
                <th className="text-left py-3 px-4 font-semibold">关键指标</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => {
                const highlights = getHighlight(item);
                const hasHighlight = highlights.length > 0;

                return (
                  <tr
                    key={index}
                    className={`border-b border-slate-100 dark:border-slate-800 transition-colors ${
                      hasHighlight
                        ? "bg-yellow-50 dark:bg-yellow-950/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold">
                      {format(new Date(item.time), "HH:mm")}
                    </td>
                    <td className="text-center py-3 px-4 text-lg">
                      {getWeatherIcon(item.weatherCode)}
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Thermometer className="h-4 w-4 text-red-500" />
                        <span>{item.temperature !== undefined && item.temperature !== null ? item.temperature.toFixed(1) : '-'}°C</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded ${
                          item.relativeHumidity >= 80
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold"
                            : ""
                        }`}
                      >
                        <Droplets className="h-4 w-4" />
                        <span>{item.relativeHumidity}%</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      {item.dewPoint !== undefined && item.dewPoint !== null ? item.dewPoint.toFixed(1) : '-'}°C
                    </td>
                    <td className="text-center py-3 px-4">
                      <div
                        className={`inline-block px-2 py-1 rounded ${
                          item.tempDewPointGap !== undefined && item.tempDewPointGap !== null && item.tempDewPointGap <= 3
                            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-semibold"
                            : ""
                        }`}
                      >
                        {item.tempDewPointGap !== undefined && item.tempDewPointGap !== null ? item.tempDewPointGap.toFixed(1) : '-'}°C
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded ${
                          item.windSpeed !== undefined && item.windSpeed !== null && item.windSpeed <= 3
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold"
                            : ""
                        }`}
                      >
                        <Wind className="h-4 w-4" />
                        <span>{item.windSpeed !== undefined && item.windSpeed !== null ? item.windSpeed.toFixed(1) : '-'} m/s</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Cloud className="h-4 w-4 text-slate-500" />
                        <span>{item.cloudCover}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-left">
                      {highlights.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {highlights.map((h, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-1 text-xs rounded bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 font-semibold"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 数据说明 */}
        <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📊 数据说明
          </p>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>温-露差</strong>：温度与露点的差值，越小越容易成雾</li>
            <li>• <strong>高湿度</strong>：相对湿度 ≥ 80% 时高亮显示</li>
            <li>• <strong>微风</strong>：风速 ≤ 3 m/s 时高亮显示</li>
            <li>• <strong>接近露点</strong>：温-露差 ≤ 3°C 时高亮显示</li>
            <li>• <strong>雾天气</strong>：WMO天气代码45或48时高亮显示</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

