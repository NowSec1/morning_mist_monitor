import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Lightbulb, Cloud, Sun } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AlgorithmExplanation() {
  const { data: explanation } = trpc.algorithm.getExplanation.useQuery();

  if (!explanation) {
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

  return (
    <Tabs defaultValue="sunrise" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="sunrise" className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          <span className="hidden sm:inline">日出计算</span>
        </TabsTrigger>
        <TabsTrigger value="fog" className="flex items-center gap-2">
          <Cloud className="h-4 w-4" />
          <span className="hidden sm:inline">晨雾预测</span>
        </TabsTrigger>
        <TabsTrigger value="photography" className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          <span className="hidden sm:inline">摄影时刻</span>
        </TabsTrigger>
        <TabsTrigger value="cloud" className="flex items-center gap-2">
          <Cloud className="h-4 w-4" />
          <span className="hidden sm:inline">云层分析</span>
        </TabsTrigger>
      </TabsList>

      {/* 日出时间计算 */}
      <TabsContent value="sunrise" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-orange-500" />
              {explanation.sunriseCalculation.title}
            </CardTitle>
            <CardDescription>{explanation.sunriseCalculation.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 计算步骤 */}
            <div>
              <h4 className="font-semibold mb-3">计算步骤</h4>
              <ol className="space-y-2">
                {explanation.sunriseCalculation.steps.map((step: string, index: number) => (
                  <li key={index} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-700 dark:text-orange-300 font-semibold text-xs">
                      {index + 1}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* 精度和局限性 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <p className="font-semibold text-sm text-green-900 dark:text-green-100 mb-2">
                  ✓ 精度
                </p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  {explanation.sunriseCalculation.accuracy}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                <p className="font-semibold text-sm text-yellow-900 dark:text-yellow-100 mb-2">
                  ⚠️ 局限性
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {explanation.sunriseCalculation.limitations}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 晨雾预测 */}
      <TabsContent value="fog" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-500" />
              {explanation.fogProbabilityCalculation.title}
            </CardTitle>
            <CardDescription>基于多个气象指标的综合评估</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 辐射雾 */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                {explanation.fogProbabilityCalculation.radiationFog.name}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                {explanation.fogProbabilityCalculation.radiationFog.description}
              </p>
              <div className="space-y-2 mb-4">
                <p className="text-sm font-semibold">影响因素：</p>
                <ul className="space-y-1">
                  {explanation.fogProbabilityCalculation.radiationFog.factors.map(
                    (factor: string, index: number) => (
                      <li key={index} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2">
                        <span className="text-blue-500">•</span>
                        {factor}
                      </li>
                    )
                  )}
                </ul>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <strong>形成条件：</strong> {explanation.fogProbabilityCalculation.radiationFog.conditions}
              </p>
            </div>

            {/* 平流雾 */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                {explanation.fogProbabilityCalculation.advectionFog.name}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                {explanation.fogProbabilityCalculation.advectionFog.description}
              </p>
              <div className="space-y-2 mb-4">
                <p className="text-sm font-semibold">影响因素：</p>
                <ul className="space-y-1">
                  {explanation.fogProbabilityCalculation.advectionFog.factors.map(
                    (factor: string, index: number) => (
                      <li key={index} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2">
                        <span className="text-orange-500">•</span>
                        {factor}
                      </li>
                    )
                  )}
                </ul>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                <strong>形成条件：</strong> {explanation.fogProbabilityCalculation.advectionFog.conditions}
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 摄影时刻 */}
      <TabsContent value="photography" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              {explanation.photographyTimings.title}
            </CardTitle>
            <CardDescription>最佳摄影时间窗口</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 蓝调时刻 */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                {explanation.photographyTimings.blueHour.name}
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                <strong>时间：</strong> {explanation.photographyTimings.blueHour.definition}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>特点：</strong> {explanation.photographyTimings.blueHour.characteristics}
              </p>
            </div>

            {/* 金色时刻 */}
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold mb-2 text-yellow-900 dark:text-yellow-100">
                {explanation.photographyTimings.goldenHour.name}
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                <strong>时间：</strong> {explanation.photographyTimings.goldenHour.definition}
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>特点：</strong> {explanation.photographyTimings.goldenHour.characteristics}
              </p>
            </div>

            {/* 建议 */}
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                <strong>📸 摄影建议：</strong> 在晨雾风险高且处于蓝调或金色时刻时，是拍摄晨雾景观的最佳时机。此时既有雾气的朦胧美感，又有柔和的光线。
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 云层分析 */}
      <TabsContent value="cloud" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-slate-500" />
              {explanation.cloudLayers.title}
            </CardTitle>
            <CardDescription>{explanation.cloudLayers.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 云层分类 */}
            <div>
              <h4 className="font-semibold mb-3">云层分类</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {explanation.cloudLayers.layers.map((layer: string, index: number) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <p className="text-sm text-slate-700 dark:text-slate-300">{layer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 海拔修正 */}
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <h4 className="font-semibold mb-2 text-green-900 dark:text-green-100">
                🏔️ 海拔修正
              </h4>
              <p className="text-sm text-green-800 dark:text-green-200">
                {explanation.cloudLayers.altitudeCorrection}
              </p>
            </div>

            {/* 数据来源 */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                📊 数据来源
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                云层数据来自 Open-Meteo API，包括低、中、高三层云量覆盖率。数据更新频率为每小时一次。
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

