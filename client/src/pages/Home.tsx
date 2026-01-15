import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

import LocationSelector from "@/components/LocationSelector";
import FogPredictionDisplay from "@/components/FogPredictionDisplay";
import WeatherDataTable from "@/components/WeatherDataTable";
import CloudLayerVisualization from "@/components/CloudLayerVisualization";
import AlgorithmExplanation from "@/components/AlgorithmExplanation";
import WeatherAlert from "@/components/WeatherAlert";
import MultiDayForecast from "@/components/MultiDayForecast";
import { Cloud, MapPin, Info, Settings, Calendar } from "lucide-react";
import LoginDialog from "@/components/LoginDialog";
import { useState, useEffect } from "react";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<{id: number; name: string; latitude: string; longitude: string; altitude: number | string; timezone: string} | null>(null);
  const [predictionData, setPredictionData] = useState<any>(null);
  const [multiDayForecastData, setMultiDayForecastData] = useState<any>(null);

  // 获取用户的地点列表
  const { data: locations } = trpc.locations.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // 获取晨雾预测
  const { data: predictionResult, isLoading: isPredictionLoading } = trpc.weather.getFogPrediction.useQuery(
    selectedLocation ? {
      latitude: parseFloat(selectedLocation.latitude),
      longitude: parseFloat(selectedLocation.longitude),
      altitude: typeof selectedLocation.altitude === 'string' ? parseInt(selectedLocation.altitude) : selectedLocation.altitude || 0,
      timezone: selectedLocation.timezone || "Asia/Shanghai",
    } : (undefined as any),
    {
      enabled: !!selectedLocation,
    }
  );

  // 获取多日预报
  const { data: multiDayResult, isLoading: isMultiDayLoading } = trpc.weather.getMultiDayForecast.useQuery(
    selectedLocation ? {
      latitude: parseFloat(selectedLocation.latitude),
      longitude: parseFloat(selectedLocation.longitude),
      altitude: typeof selectedLocation.altitude === 'string' ? parseInt(selectedLocation.altitude) : selectedLocation.altitude || 0,
      timezone: selectedLocation.timezone || "Asia/Shanghai",
      days: 7,
    } : (undefined as any),
    {
      enabled: !!selectedLocation,
    }
  );

  useEffect(() => {
    if (predictionResult) {
      setPredictionData(predictionResult);
    }
  }, [predictionResult]);

  useEffect(() => {
    if (multiDayResult) {
      setMultiDayForecastData(multiDayResult);
    }
  }, [multiDayResult]);

  // 如果未登录，显示登录提示
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
        {/* Header */}
        <header className="border-b border-white/20 backdrop-blur-md bg-white/80 dark:bg-slate-900/80">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-8 w-8" />}
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{APP_TITLE}</h1>
            </div>
            <Button onClick={() => (window.location.href = getLoginUrl())}>
              登录
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <div className="max-w-4xl space-y-8">
            {/* 登录组件 */}
            <div className="flex justify-center">
              <LoginDialog />
            </div>

            {/* 介绍信息 */}
            <div className="text-center space-y-8 animate-slide-up">
              <div>
                <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                  晨雾监测系统
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
                  基于实时气象数据，精确预测晨雾和平流雾的发生概率，为摄影爱好者提供最佳拍摄时刻建议
                </p>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
              <Card className="glass">
                <CardHeader>
                  <Cloud className="h-8 w-8 text-blue-500 mb-2" />
                  <CardTitle>晨雾预测</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600 dark:text-slate-300">
                  基于天气数据精确计算晨雾和平流雾的发生概率
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <MapPin className="h-8 w-8 text-orange-500 mb-2" />
                  <CardTitle>日出时刻</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600 dark:text-slate-300">
                  精确计算日出时间、蓝调时刻和金色时刻
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <Info className="h-8 w-8 text-green-500 mb-2" />
                  <CardTitle>气象数据</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600 dark:text-slate-300">
                  详细展示温度、湿度、风速等气象指标
                </CardContent>
              </Card>
            </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/20 backdrop-blur-md bg-white/80 dark:bg-slate-900/80">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-slate-600 dark:text-slate-400">
            <p>晨雾监测系统 © 2024 | 基于 Open-Meteo API 和天文算法</p>
          </div>
        </footer>
      </div>
    );
  }

  // 已登录用户的主界面
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-white/20 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-8 w-8" />}
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              欢迎，{user?.name || "用户"}
            </span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              退出登录
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* 天气预警通知 */}
        {predictionData && selectedLocation && (
          <WeatherAlert
            fogProbability={predictionData.fogProbability?.overallFogProbability || 0}
            location={selectedLocation.name}
          />
        )}

        <Tabs defaultValue="prediction" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="prediction">晨雾预测</TabsTrigger>
            <TabsTrigger value="forecast">多日预报</TabsTrigger>
            <TabsTrigger value="weather">气象数据</TabsTrigger>
            <TabsTrigger value="cloud">云层分析</TabsTrigger>
            <TabsTrigger value="algorithm">算法说明</TabsTrigger>
          </TabsList>

          {/* 晨雾预测标签页 */}
          <TabsContent value="prediction" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* 地点选择器 */}
              <div className="lg:col-span-1">
                <LocationSelector
                  locations={locations || []}
                  selectedLocation={selectedLocation}
                  onLocationChange={setSelectedLocation}
                />
              </div>

              {/* 预测结果 */}
              <div className="lg:col-span-3">
                {isPredictionLoading && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {predictionData && !isPredictionLoading && (
                  <FogPredictionDisplay data={predictionData} location={selectedLocation} />
                )}

                {!selectedLocation && !isPredictionLoading && (
                  <Card className="border-dashed">
                    <CardContent className="pt-6 text-center text-slate-500 dark:text-slate-400">
                      <p>请先选择或配置监测地点</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* 多日预报标签页 */}
          <TabsContent value="forecast" className="space-y-6">
            {isMultiDayLoading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {multiDayForecastData && !isMultiDayLoading && (
              <MultiDayForecast data={multiDayForecastData} />
            )}

            {!selectedLocation && !isMultiDayLoading && (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center text-slate-500 dark:text-slate-400">
                  <p>请先选择地点查看多日预报</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 气象数据标签页 */}
          <TabsContent value="weather" className="space-y-6">
            {predictionData && selectedLocation ? (
              <WeatherDataTable data={predictionData.hourlyWeatherData} />
            ) : (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center text-slate-500 dark:text-slate-400">
                  <p>请先选择地点并获取预测数据</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 云层分析标签页 */}
          <TabsContent value="cloud" className="space-y-6">
            {predictionData && selectedLocation ? (
              <CloudLayerVisualization
                cloudData={predictionData.cloudLayerData}
                cloudTrend={predictionData.cloudTrend}
                hourlyData={predictionData.hourlyWeatherData}
              />
            ) : (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center text-slate-500 dark:text-slate-400">
                  <p>请先选择地点并获取预测数据</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 算法说明标签页 */}
          <TabsContent value="algorithm" className="space-y-6">
            <AlgorithmExplanation />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

