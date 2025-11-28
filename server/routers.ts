import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createMonitoringLocation,
  getUserMonitoringLocations,
  getMonitoringLocation,
  updateMonitoringLocation,
  deleteMonitoringLocation,
  cacheWeatherData,
  getWeatherDataCache,
  createFogPrediction,
  getFogPrediction,
  getLocationFogPredictions,
  recordQueryHistory,
} from "./db";
import {
  SunrisCalculator,
  PhotographyTimings,
  FogProbabilityCalculator,
  CloudLayerProcessor,
  OpenMeteoAdapter,
  type WeatherData,
} from "@shared/algorithms";
import { SunriseSunsetAPI } from "@shared/sunriseSunsetAPI";
import { sendNotifications } from "./notificationService";
import { notificationRouter } from "./notificationRouter";

/**
 * 地点管理路由
 */
const locationsRouter = router({
  // 创建新的监测地点
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "地点名称不能为空"),
        latitude: z.number().min(-90).max(90, "纬度必须在-90到90之间"),
        longitude: z.number().min(-180).max(180, "经度必须在-180到180之间"),
        altitude: z.number().int().min(0).default(0),
        timezone: z.string().default("Asia/Shanghai"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createMonitoringLocation({
        userId: ctx.user.id,
        name: input.name,
        latitude: input.latitude.toString(),
        longitude: input.longitude.toString(),
        altitude: input.altitude,
        timezone: input.timezone,
      });
      return { success: true };
    }),

  // 获取用户的所有监测地点
  list: protectedProcedure.query(async ({ ctx }) => {
    return await getUserMonitoringLocations(ctx.user.id);
  }),

  // 获取单个监测地点
  get: protectedProcedure
    .input(z.object({ locationId: z.number() }))
    .query(async ({ input }) => {
      return await getMonitoringLocation(input.locationId);
    }),

  // 更新监测地点
  update: protectedProcedure
    .input(
      z.object({
        locationId: z.number(),
        name: z.string().optional(),
        altitude: z.number().int().optional(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await updateMonitoringLocation(input.locationId, {
        name: input.name,
        altitude: input.altitude,
        timezone: input.timezone,
      });
      return { success: true };
    }),

  // 删除监测地点
  delete: protectedProcedure
    .input(z.object({ locationId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteMonitoringLocation(input.locationId);
      return { success: true };
    }),
});

/**
 * 气象数据和预测路由
 */
const weatherRouter = router({
  // 获取指定地点的晨雾预测
  getFogPrediction: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        altitude: z.number().default(0),
        timezone: z.string().default("Asia/Shanghai"),
        date: z.string().optional(), // ISO格式日期
      })
    )
    .query(async ({ input }) => {
      try {
        // 获取Open-Meteo API数据
        const date = input.date ? new Date(input.date) : new Date();
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const startDate = date.toISOString().split("T")[0];
        const endDate = tomorrow.toISOString().split("T")[0];

        const apiUrl = new URL("https://api.open-meteo.com/v1/forecast");
        apiUrl.searchParams.append("latitude", String(input.latitude));
        apiUrl.searchParams.append("longitude", String(input.longitude));
        apiUrl.searchParams.append("start_date", startDate);
        apiUrl.searchParams.append("end_date", endDate);
        apiUrl.searchParams.append("hourly", [
          "temperature_2m",
          "relative_humidity_2m",
          "dew_point_2m",
          "wind_speed_10m",
          "weather_code",
          "cloud_cover",
          "cloud_cover_low",
          "cloud_cover_mid",
          "cloud_cover_high",
        ].join(","));
        apiUrl.searchParams.append("timezone", input.timezone);

        const response = await fetch(apiUrl.toString());
        if (!response.ok) {
          throw new Error(`Open-Meteo API error: ${response.statusText}`);
        }

        const apiData = await response.json();
        const hourlyData = apiData.hourly;

        // 使用 SunriseSunset.io API 获取日出时间和金色时刻
        const sunTimesData = await SunriseSunsetAPI.fetchSunTimes(
          input.latitude,
          input.longitude,
          date,
          input.timezone
        );

        const sunriseTime = SunriseSunsetAPI.getSunriseTime(sunTimesData);
        const blueHour = SunriseSunsetAPI.getBlueHour(sunriseTime);
        const goldenHour = SunriseSunsetAPI.getGoldenHourRange(sunriseTime);

        // 获取日出前后2小时的气象数据
        // 根据实际的时间戳来匹配，而不是用索引
        const sunriseHour = sunriseTime.hour;
        const sunriseMinute = sunriseTime.minute;
        const today = new Date();
        const sunriseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), sunriseHour, sunriseMinute, 0, 0);
        
        console.log("Sunrise time object:", sunriseTime);
        console.log("Sunrise date:", sunriseDate.toISOString());
        
        const startTime = new Date(sunriseDate);
        startTime.setHours(startTime.getHours() - 2);
        
        const endTime = new Date(sunriseDate);
        endTime.setHours(endTime.getHours() + 2);
        
        console.log("Start time:", startTime.toISOString());
        console.log("End time:", endTime.toISOString());
        console.log("First API time:", hourlyData.time[0]);
        console.log("Last API time:", hourlyData.time[hourlyData.time.length - 1]);

        // 优先尝试按时间范围过滤，如果没有数据则使用所有数据
        const hourlyWeatherData: WeatherData[] = [];
        const hourlyWeatherTimes: string[] = [];
        let foundInRange = false;
        
        for (let i = 0; i < hourlyData.time.length; i++) {
          const timeStr = hourlyData.time[i];
          const dataTime = new Date(timeStr);
          
          // 判断u662fu5426在日出前u540e2小u65f6范围内
          if (dataTime >= startTime && dataTime <= endTime) {
            const weatherData: WeatherData = {
              temperature: hourlyData.temperature_2m[i],
              relativeHumidity: hourlyData.relative_humidity_2m[i],
              dewPoint: hourlyData.dew_point_2m[i],
              windSpeed: hourlyData.wind_speed_10m[i],
              weatherCode: hourlyData.weather_code[i],
              cloudCover: hourlyData.cloud_cover[i],
              lowCloudCover: hourlyData.cloud_cover_low[i] || 0,
              midCloudCover: hourlyData.cloud_cover_mid[i] || 0,
              highCloudCover: hourlyData.cloud_cover_high[i] || 0,
              tempDewPointGap: (hourlyData.temperature_2m[i] ?? 0) - (hourlyData.dew_point_2m[i] ?? 0),
            };
            hourlyWeatherData.push(weatherData);
            hourlyWeatherTimes.push(timeStr);
            foundInRange = true;
          }
        }
        
        // 如果没有找到符合时间范围的数据，使用所有数据
        if (!foundInRange) {
          console.warn("No data found in time range, using all hourly data");
          for (let i = 0; i < Math.min(hourlyData.time.length, 24); i++) {
            const weatherData: WeatherData = {
              temperature: hourlyData.temperature_2m[i],
              relativeHumidity: hourlyData.relative_humidity_2m[i],
              dewPoint: hourlyData.dew_point_2m[i],
              windSpeed: hourlyData.wind_speed_10m[i],
              weatherCode: hourlyData.weather_code[i],
              cloudCover: hourlyData.cloud_cover[i],
              lowCloudCover: hourlyData.cloud_cover_low[i] || 0,
              midCloudCover: hourlyData.cloud_cover_mid[i] || 0,
              highCloudCover: hourlyData.cloud_cover_high[i] || 0,
              tempDewPointGap: (hourlyData.temperature_2m[i] ?? 0) - (hourlyData.dew_point_2m[i] ?? 0),
            };
            hourlyWeatherData.push(weatherData);
            hourlyWeatherTimes.push(hourlyData.time[i]);
          }
        }

        // 计算晨雾概率
        if (hourlyWeatherData.length === 0) {
          console.warn("No hourly weather data found for the sunrise time range");
          console.log("Using first available data point as fallback");
          // 使用第一条气象数据作为默认值
          const temperature = hourlyData.temperature_2m?.[0] ?? 15;
          const relativeHumidity = hourlyData.relative_humidity_2m?.[0] ?? 70;
          const dewPoint = hourlyData.dew_point_2m?.[0] ?? 10;
          const windSpeed = hourlyData.wind_speed_10m?.[0] ?? 2;
          const weatherCode = hourlyData.weather_code?.[0] ?? 0;
          const cloudCover = hourlyData.cloud_cover?.[0] ?? 50;
          
          const firstWeather: WeatherData = {
            temperature,
            relativeHumidity,
            dewPoint,
            windSpeed,
            weatherCode,
            cloudCover,
            lowCloudCover: hourlyData.cloud_cover_low?.[0] ?? 0,
            midCloudCover: hourlyData.cloud_cover_mid?.[0] ?? 0,
            highCloudCover: hourlyData.cloud_cover_high?.[0] ?? 0,
            tempDewPointGap: (temperature ?? 0) - (dewPoint ?? 0),
          };
          console.log("Fallback weather data:", firstWeather);
          hourlyWeatherData.push(firstWeather);
        }

        const currentWeather = hourlyWeatherData[hourlyWeatherData.length - 1];
        const previousWeather = hourlyWeatherData.length > 1 ? hourlyWeatherData[hourlyWeatherData.length - 2] : undefined;

        const fogProbability = FogProbabilityCalculator.calculateFogProbability(
          currentWeather,
          previousWeather
        );

        // 处理云层数据
        const cloudLayerData = CloudLayerProcessor.processCloudLayerData(
          {
            lowCloud: currentWeather.lowCloudCover,
            midCloud: currentWeather.midCloudCover,
            highCloud: currentWeather.highCloudCover,
            totalCloud: currentWeather.cloudCover,
          },
          input.altitude
        );

        // 分析云层趋势
        const cloudTrends = hourlyWeatherData.map((data) => ({
          time: new Date(),
          lowCloud: data.lowCloudCover,
          midCloud: data.midCloudCover,
          highCloud: data.highCloudCover,
          totalCloud: data.cloudCover,
        }));

        const cloudTrend = CloudLayerProcessor.analyzeTrend(cloudTrends);

        // 如果用户已登录且概率超过80%，发送通知
        // 注意：这里是publicProcedure，所以ctx.user可能为null
        // 通知应该在前端调用专门的API时发送

        return {
          sunriseTime,
          blueHour,
          goldenHour,
          fogProbability,
          cloudLayerData,
          cloudTrend,
          hourlyWeatherData: hourlyWeatherData.map((data, index) => ({
            time: { hour: new Date(hourlyWeatherTimes[index]).getHours(), minute: new Date(hourlyWeatherTimes[index]).getMinutes() },
            ...data,
            weatherDescription: OpenMeteoAdapter.getWeatherDescription(data.weatherCode),
          })),
        };
      } catch (error) {
        console.error("Error fetching fog prediction:", error);
        if (error instanceof Error) {
          console.error("Error details:", error.message, error.stack);
        }
        throw new Error(`无法获取晨雾预测数据: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  // 获取未来3-7天的晨雾预报
  getMultiDayForecast: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        altitude: z.number().int().min(0).default(0),
        timezone: z.string().default("Asia/Shanghai"),
        days: z.number().int().min(1).max(7).default(7),
      })
    )
    .query(async ({ input }) => {
      try {
        const forecasts = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < input.days; i++) {
          const forecastDate = new Date(today);
          forecastDate.setDate(forecastDate.getDate() + i);
          const dateStr = forecastDate.toISOString().split("T")[0];

          const apiUrl = new URL("https://api.open-meteo.com/v1/forecast");
          apiUrl.searchParams.append("latitude", input.latitude.toString());
          apiUrl.searchParams.append("longitude", input.longitude.toString());
          apiUrl.searchParams.append("start_date", dateStr);
          apiUrl.searchParams.append("end_date", dateStr);
          apiUrl.searchParams.append(
            "hourly",
            [
              "temperature_2m",
              "relative_humidity_2m",
              "dew_point_2m",
              "weather_code",
              "cloud_cover",
              "cloud_cover_low",
              "cloud_cover_mid",
              "cloud_cover_high",
              "wind_speed_10m",
            ].join(",")
          );
          apiUrl.searchParams.append("timezone", input.timezone);

          const response = await fetch(apiUrl.toString());
          if (!response.ok) {
            console.warn(`Failed to fetch forecast for ${dateStr}`);
            continue;
          }

          const apiData = await response.json();
          const hourlyData = apiData.hourly;

          const sunTimesData = await SunriseSunsetAPI.fetchSunTimes(
            input.latitude,
            input.longitude,
            new Date(dateStr),
            input.timezone
          );
          const sunriseTime = SunriseSunsetAPI.getSunriseTime(sunTimesData);

          const startTime = new Date(forecastDate);
          startTime.setHours(sunriseTime.hour - 2, sunriseTime.minute, 0, 0);
          const endTime = new Date(forecastDate);
          endTime.setHours(sunriseTime.hour + 2, sunriseTime.minute, 0, 0);

          let fogProbability = 0;
          let dataCount = 0;

          for (let j = 0; j < hourlyData.time.length; j++) {
            const timeStr = hourlyData.time[j];
            const currentTime = new Date(timeStr);

            if (currentTime >= startTime && currentTime <= endTime) {
              const weatherData: WeatherData = {
                temperature: hourlyData.temperature_2m[j] || 0,
                relativeHumidity: hourlyData.relative_humidity_2m[j] || 0,
                dewPoint: hourlyData.dew_point_2m[j] || 0,
                weatherCode: hourlyData.weather_code[j] || 0,
                cloudCover: hourlyData.cloud_cover[j] || 0,
                windSpeed: hourlyData.wind_speed_10m[j] || 0,
                lowCloudCover: hourlyData.cloud_cover_low[j] || 0,
                midCloudCover: hourlyData.cloud_cover_mid[j] || 0,
                highCloudCover: hourlyData.cloud_cover_high[j] || 0,
              };

              const probability = FogProbabilityCalculator.calculateFogProbability(
                weatherData,
                weatherData
              );
              fogProbability += probability.overallFogProbability;
              dataCount++;
            }
          }

          const avgFogProbability = dataCount > 0 ? fogProbability / dataCount : 0;
          const dayOfWeek = ["\u65e5", "\u4e00", "\u4e8c", "\u4e09", "\u56db", "\u4e94", "\u516d"][forecastDate.getDay()];

          forecasts.push({
            date: dateStr,
            dayOfWeek,
            fogProbability: Math.min(100, Math.max(0, avgFogProbability)),
            sunrise: `${sunriseTime.hour.toString().padStart(2, "0")}:${sunriseTime.minute.toString().padStart(2, "0")}`,
          });
        }

        return forecasts;
      } catch (error) {
        console.error("Error fetching multi-day forecast:", error);
        if (error instanceof Error) {
          throw new Error(`无法获取多日预报数据: ${error.message}`);
        }
        throw new Error("无法获取多日预报数据");
      }
    }),

  // 获取详细的小时级气象数据
  getHourlyWeather: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        date: z.string().optional(),
        timezone: z.string().default("Asia/Shanghai"),  // 使用北京时间（UTC+8）
      })
    )
    .query(async ({ input }) => {
      try {
        const date = input.date ? new Date(input.date) : new Date();
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const startDate = date.toISOString().split("T")[0];
        const endDate = tomorrow.toISOString().split("T")[0];

        const apiUrl = new URL("https://api.open-meteo.com/v1/forecast");
        apiUrl.searchParams.append("latitude", String(input.latitude));
        apiUrl.searchParams.append("longitude", String(input.longitude));
        apiUrl.searchParams.append("start_date", startDate);
        apiUrl.searchParams.append("end_date", endDate);
        apiUrl.searchParams.append("hourly", [
          "temperature_2m",
          "relative_humidity_2m",
          "dew_point_2m",
          "wind_speed_10m",
          "weather_code",
          "cloud_cover",
          "cloud_cover_low",
          "cloud_cover_mid",
          "cloud_cover_high",
        ].join(","));
        apiUrl.searchParams.append("timezone", input.timezone);

        const response = await fetch(apiUrl.toString());
        if (!response.ok) {
          throw new Error(`Open-Meteo API error: ${response.statusText}`);
        }

        const apiData = await response.json();
        const hourlyData = apiData.hourly;

        return hourlyData.time.map((time: string, index: number) => ({
          time,
          temperature: hourlyData.temperature_2m[index],
          relativeHumidity: hourlyData.relative_humidity_2m[index],
          dewPoint: hourlyData.dew_point_2m[index],
          windSpeed: hourlyData.wind_speed_10m[index],
          weatherCode: hourlyData.weather_code[index],
          cloudCover: hourlyData.cloud_cover[index],
          lowCloudCover: hourlyData.cloud_cover_low[index] || 0,
          midCloudCover: hourlyData.cloud_cover_mid[index] || 0,
          highCloudCover: hourlyData.cloud_cover_high[index] || 0,
          weatherDescription: OpenMeteoAdapter.getWeatherDescription(hourlyData.weather_code[index]),
          tempDewPointGap: hourlyData.temperature_2m[index] - hourlyData.dew_point_2m[index],
        }));
      } catch (error) {
        console.error("Error fetching hourly weather:", error);
        throw new Error("无法获取小时级气象数据");
      }
    }),

  // 获取云层高度说明
  getCloudHeightExplanation: publicProcedure.query(() => {
    return CloudLayerProcessor.getCloudHeightExplanation();
  }),
});

/**
 * 海拔数据路由
 */
const elevationRouter = router({
  // 获取指定坐标的海拔
  getElevation: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
    )
    .query(async ({ input }) => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/elevation?latitude=${input.latitude}&longitude=${input.longitude}`
        );
        const data = await response.json();
        return {
          elevation: data.elevation[0],
          latitude: input.latitude,
          longitude: input.longitude,
        };
      } catch (error) {
        console.error("Error fetching elevation:", error);
        throw new Error("无法获取海拔数据");
      }
    }),

  // 批量获取海拔
  getElevationBatch: publicProcedure
    .input(
      z.object({
        coordinates: z.array(
          z.object({
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      try {
        const latitudes = input.coordinates.map((c) => c.latitude).join(",");
        const longitudes = input.coordinates.map((c) => c.longitude).join(",");

        const response = await fetch(
          `https://api.open-meteo.com/v1/elevation?latitude=${latitudes}&longitude=${longitudes}`
        );
        const data = await response.json();

        return input.coordinates.map((coord, index) => ({
          ...coord,
          elevation: data.elevation[index],
        }));
      } catch (error) {
        console.error("Error fetching elevation batch:", error);
        throw new Error("无法批量获取海拔数据");
      }
    }),
});

/**
 * 算法模型说明路由
 */
const algorithmRouter = router({
  // 获取算法模型说明
  getExplanation: publicProcedure.query(() => {
    return {
      sunriseCalculation: {
        title: "日出时间计算算法",
        description: "基于天文学公式精确计算日出时间",
        steps: [
          "1. 计算年积日（Day of Year）：根据日期计算该年的第几天（1-366）",
          "2. 计算太阳赤纬角（Solar Declination）：δ = 23.44° × sin(360° × (284 + n) / 365)",
          "3. 计算时角（Hour Angle）：cos(H) = -tan(φ) × tan(δ)，其中φ为纬度，δ为太阳赤纬角",
          "4. 计算UTC时间：结合修正方程（Equation of Time）和经度",
          "5. 转换为本地时间：根据时区偏移调整",
        ],
        accuracy: "±2-3分钟",
        limitations: "不考虑地形遮挡、大气折射等因素的精细影响",
      },
      fogProbabilityCalculation: {
        title: "晨雾/平流雾概率计算",
        radiationFog: {
          name: "辐射雾（晨雾）",
          description: "由地面辐射冷却导致的雾",
          factors: [
            "高相对湿度（≥80%）：贡献度最高（40%）",
            "微风（≤3 m/s）：有利于雾的形成（30%）",
            "温度接近露点（差值≤3°C）：关键指标（20%）",
            "温度下降趋势：表明地面冷却（10%）",
            "少云（≤20%）：有利于地面辐射（5%）",
          ],
          conditions: "最容易在晴朗、无风、高湿度的夜间形成",
        },
        advectionFog: {
          name: "平流雾",
          description: "由暖湿气流流向冷表面导致的雾",
          factors: [
            "高相对湿度（≥80%）：贡献度最高（40%）",
            "适中风速（2-6 m/s）：平流雾形成的必要条件（35%）",
            "温度接近露点（差值≤3°C）：关键指标（15%）",
            "云量适中（30-70%）：有利于雾的维持（10%）",
          ],
          conditions: "需要暖湿气流和冷表面的相互作用",
        },
      },
      photographyTimings: {
        title: "摄影时刻计算",
        blueHour: {
          name: "蓝调时刻（Blue Hour）",
          definition: "日出前30分钟至日出后20分钟",
          characteristics: "天空呈现深蓝色，光线柔和，适合拍摄风景和建筑",
        },
        goldenHour: {
          name: "金色时刻（Golden Hour）",
          definition: "日出前10分钟至日出后60分钟",
          characteristics: "阳光呈现金黄色，光线温暖，适合拍摄人物和风景",
        },
      },
      cloudLayers: {
        title: "大气云层剖面图",
        description: "展示不同高度的云层覆盖率",
        layers: [
          "低云层（0-2000米）：层积云、层云、积云等",
          "中云层（2000-6000米）：高层云、高积云等",
          "高云层（6000米以上）：卷云、卷层云、卷积云等",
        ],
        altitudeCorrection: "海拔越高，相同的云层类型会出现在更低的高度。每升高100米，低云层覆盖率降低约1-2%",
      },
    };
  }),
});

/**
 * 主路由
 */
export const appRouter = router({
  system: systemRouter,
  elevation: elevationRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  locations: locationsRouter,
  weather: weatherRouter,
  algorithm: algorithmRouter,
  notifications: notificationRouter,
});

export type AppRouter = typeof appRouter;


