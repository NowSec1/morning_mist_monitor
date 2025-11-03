import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Droplets, Wind, Eye, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface FogPredictionDisplayProps {
  data: any;
  location: any;
}

export default function FogPredictionDisplay({
  data,
  location,
}: FogPredictionDisplayProps) {
  const { fogProbability, cloudLayerData, sunriseTime, blueHour, goldenHour } = data || {};

  const getProbabilityIcon = (level: string) => {
    switch (level) {
      case "high":
        return <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />;
      case "medium":
        return <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />;
      case "low":
        return <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />;
      default:
        return null;
    }
  };

  const getProbabilityColor = (level: string) => {
    switch (level) {
      case "high":
        return "fog-high";
      case "medium":
        return "fog-medium";
      case "low":
        return "fog-low";
      default:
        return "";
    }
  };

  const getProbabilityText = (level: string) => {
    switch (level) {
      case "high":
        return "高概率";
      case "medium":
        return "中概率";
      case "low":
        return "低概率";
      default:
        return "未知";
    }
  };

  return (
    <div className="space-y-6">
      {/* 主风险指示 */}
      {fogProbability ? (
      <Card className={getProbabilityColor(fogProbability.riskLevel)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">晨雾概率评估</CardTitle>
              <CardDescription>
                {location?.name} | {format(new Date(), "yyyy年MM月dd日", { locale: zhCN })}
              </CardDescription>
            </div>
            {getProbabilityIcon(fogProbability.riskLevel)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">总体雾概率</p>
              <p className="text-3xl font-bold">{fogProbability.overallFogProbability}%</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">概率等级</p>
              <p className="text-3xl font-bold">{getProbabilityText(fogProbability.riskLevel)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-500">正在加载晨雾预测数据...</p>
          </CardContent>
        </Card>
      )}

      {/* 晨雾和平流雾概率对比 */}
      {fogProbability && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-500" />
              辐射雾（晨雾）
            </CardTitle>
            <CardDescription>由地面辐射冷却导致的雾</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">概率</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {fogProbability.radiationFogProbability}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                    style={{
                      width: `${fogProbability.radiationFogProbability}%`,
                    }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                最容易在晴朗、无风、高湿度的夜间形成
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-orange-500" />
              平流雾
            </CardTitle>
            <CardDescription>由暖湿气流流向冷表面导致的雾</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">概率</span>
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                    {fogProbability.advectionFogProbability}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-orange-600 dark:bg-orange-400 h-2 rounded-full transition-all"
                    style={{
                      width: `${fogProbability.advectionFogProbability}%`,
                    }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                需要暖湿气流和冷表面的相互作用
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* 影响因素 */}
      {fogProbability && (
      <Card>
        <CardHeader>
          <CardTitle>影响因素分析</CardTitle>
          <CardDescription>当前气象条件对晨雾形成的影响</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <Droplets className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">相对湿度</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {fogProbability.factors.highHumidity ? "高湿度（≥80%）" : "湿度不足"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <Wind className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">风速</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {fogProbability.factors.lowWind ? "微风（≤3 m/s）" : "风速较大"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <Eye className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">温度-露点差</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {fogProbability.factors.temperatureDewPointGap}°C
                  {fogProbability.factors.temperatureDewPointGap <= 3 && " (有利于成雾)"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <Cloud className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">温度趋势</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {fogProbability.factors.temperatureTrend === "decreasing"
                    ? "下降 (有利于成雾)"
                    : fogProbability.factors.temperatureTrend === "stable"
                      ? "稳定"
                      : "上升"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* 日出和摄影时刻 */}
      {sunriseTime && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">日出时间</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {String(sunriseTime.hour).padStart(2, '0')}:{String(sunriseTime.minute).padStart(2, '0')}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              {format(new Date(), "yyyy年MM月dd日", { locale: zhCN })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">蓝调时刻</CardTitle>
            <CardDescription className="text-xs">日出前30分钟至日出后20分钟</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-semibold">开始：</span>
                {String(blueHour.start.hour).padStart(2, '0')}:{String(blueHour.start.minute).padStart(2, '0')}
              </p>
              <p className="text-sm">
                <span className="font-semibold">结束：</span>
                {String(blueHour.end.hour).padStart(2, '0')}:{String(blueHour.end.minute).padStart(2, '0')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">金色时刻</CardTitle>
            <CardDescription className="text-xs">日出前10分钟至日出后60分钟</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-semibold">开始：</span>
                {String(goldenHour.start.hour).padStart(2, '0')}:{String(goldenHour.start.minute).padStart(2, '0')}
              </p>
              <p className="text-sm">
                <span className="font-semibold">结束：</span>
                {String(goldenHour.end.hour).padStart(2, '0')}:{String(goldenHour.end.minute).padStart(2, '0')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* 云层信息 */}
      {cloudLayerData && (
      <Card>
        <CardHeader>
          <CardTitle>云层覆盖率</CardTitle>
          <CardDescription>当前日出时刻的云层分布</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">低云层</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {cloudLayerData?.lowCloud !== undefined && cloudLayerData?.lowCloud !== null ? cloudLayerData.lowCloud.toFixed(0) : '-'}%
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">0-2000米</p>
            </div>

            <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">中云层</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {cloudLayerData?.midCloud !== undefined && cloudLayerData?.midCloud !== null ? cloudLayerData.midCloud.toFixed(0) : '-'}%
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">2000-6000米</p>
            </div>

            <div className="text-center p-4 rounded-lg bg-indigo-50 dark:bg-indigo-950">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">高云层</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {cloudLayerData?.highCloud !== undefined && cloudLayerData?.highCloud !== null ? cloudLayerData.highCloud.toFixed(0) : '-'}%
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">6000米以上</p>
            </div>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}

