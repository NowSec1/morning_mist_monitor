/**
 * 晨雾监测系统核心算法模块
 * 包含：日出时间计算、晨雾/平流雾概率、云层数据处理
 */

/**
 * 日出时间计算算法
 * 基于天文学公式精确计算日出时间
 */
export class SunrisCalculator {
  /**
   * 计算日出时间
   * @param latitude 纬度（度）
   * @param longitude 经度（度）
   * @param date 日期
   * @param timezone 时区偏移（小时）
   * @returns 日出时间（Date对象）
   */
  static calculateSunrise(
    latitude: number,
    longitude: number,
    date: Date,
    timezone: number
  ): Date {
    // 获取年积日（Day of Year）
    const dayOfYear = this.getDayOfYear(date);
    
    // 计算太阳赤纬角（Solar Declination）
    const solarDeclination = this.calculateSolarDeclination(dayOfYear);
    
    // 计算时角（Hour Angle）
    const hourAngle = this.calculateHourAngle(latitude, solarDeclination);
    
    // 计算UTC时间
    const utcTime = this.calculateUTCTime(dayOfYear, longitude, hourAngle);
    
    // 转换为本地时间（分钟）
    const localMinutes = utcTime + timezone * 60;
    
    // 创建日期对象
    const sunriseDate = new Date(date);
    sunriseDate.setHours(0, 0, 0, 0);
    
    // 正确处理超过24小时的情况
    const totalMinutes = localMinutes % (24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    
    sunriseDate.setHours(hours, minutes, 0, 0);
    
    return sunriseDate;
  }

  /**
   * 获取年积日（1-366）
   */
  private static getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  /**
   * 计算太阳赤纬角（度）
   * 使用简化公式：δ = 23.44° × sin(360° × (284 + n) / 365)
   */
  private static calculateSolarDeclination(dayOfYear: number): number {
    const angle = (360 * (284 + dayOfYear)) / 365;
    const radians = (angle * Math.PI) / 180;
    return 23.44 * Math.sin(radians);
  }

  /**
   * 计算时角（度）
   * 基于纬度和太阳赤纬角
   */
  private static calculateHourAngle(latitude: number, declination: number): number {
    const latRad = (latitude * Math.PI) / 180;
    const declRad = (declination * Math.PI) / 180;
    
    // cos(H) = -tan(φ) × tan(δ)
    const cosH = -Math.tan(latRad) * Math.tan(declRad);
    
    // 限制在 [-1, 1] 范围内
    const clampedCosH = Math.max(-1, Math.min(1, cosH));
    
    // H = arccos(cosH)，转换为度
    const hourAngleRad = Math.acos(clampedCosH);
    return (hourAngleRad * 180) / Math.PI;
  }

  /**
   * 计算UTC时间（分钟）
   * 基于日期和经度
   */
  private static calculateUTCTime(
    dayOfYear: number,
    longitude: number,
    hourAngle: number
  ): number {
    // 修正方程（Equation of Time）
    const B = (360 * (dayOfYear - 1)) / 365;
    const BRad = (B * Math.PI) / 180;
    const eot = 229.18 * (0.000075 + 0.001868 * Math.cos(BRad) - 0.032077 * Math.sin(BRad) - 0.014615 * Math.cos(2 * BRad) - 0.040849 * Math.sin(2 * BRad));
    
    // UTC时间 = 12:00 - (longitude/15) - (hourAngle/15) + EOT
    const utcMinutes = 12 * 60 - (longitude / 15) * 60 - (hourAngle / 15) * 60 + eot;
    
    return utcMinutes;
  }
}

/**
 * 摄影时刻计算
 */
export class PhotographyTimings {
  /**
   * 计算蓝调时刻（Blue Hour）
   * 日出前30分钟至日出后20分钟
   */
  static getBlueHour(sunriseTime: Date): { start: Date; end: Date } {
    const start = new Date(sunriseTime);
    start.setMinutes(start.getMinutes() - 30);
    
    const end = new Date(sunriseTime);
    end.setMinutes(end.getMinutes() + 20);
    
    return { start, end };
  }

  /**
   * 计算金色时刻（Golden Hour）
   * 日出前10分钟至日出后60分钟
   */
  static getGoldenHour(sunriseTime: Date): { start: Date; end: Date } {
    const start = new Date(sunriseTime);
    start.setMinutes(start.getMinutes() - 10);
    
    const end = new Date(sunriseTime);
    end.setMinutes(end.getMinutes() + 60);
    
    return { start, end };
  }
}

/**
 * 晨雾和平流雾概率计算
 */
export interface WeatherData {
  temperature: number; // 温度（°C）
  relativeHumidity: number; // 相对湿度（%）
  dewPoint: number; // 露点（°C）
  windSpeed: number; // 风速（m/s）
  weatherCode: number; // WMO天气代码
  cloudCover: number; // 总云量（%）
  lowCloudCover: number; // 低云层覆盖率（%）
  midCloudCover: number; // 中云层覆盖率（%）
  highCloudCover: number; // 高云层覆盖率（%）
}

export interface FogProbability {
  radiationFogProbability: number; // 辐射雾（晨雾）概率（0-100%）
  advectionFogProbability: number; // 平流雾概率（0-100%）
  overallFogProbability: number; // 总体雾概率（0-100%）
  riskLevel: 'low' | 'medium' | 'high'; // 风险等级
  factors: {
    highHumidity: boolean;
    lowWind: boolean;
    temperatureDewPointGap: number; // 温度-露点差值（°C）
    temperatureTrend: 'decreasing' | 'stable' | 'increasing';
    cloudCondition: string;
  };
}

export class FogProbabilityCalculator {
  /**
   * 计算晨雾/平流雾概率
   * @param currentWeather 当前气象数据
   * @param previousWeather 前一小时气象数据（用于趋势判断）
   * @returns 雾概率信息
   */
  static calculateFogProbability(
    currentWeather: WeatherData,
    previousWeather?: WeatherData
  ): FogProbability {
    // 计算温度-露点差值
    const tempDewPointGap = currentWeather.temperature - currentWeather.dewPoint;
    
    // 判断温度趋势
    let temperatureTrend: 'decreasing' | 'stable' | 'increasing' = 'stable';
    if (previousWeather) {
      const tempChange = currentWeather.temperature - previousWeather.temperature;
      if (tempChange < -0.5) {
        temperatureTrend = 'decreasing';
      } else if (tempChange > 0.5) {
        temperatureTrend = 'increasing';
      }
    }
    
    // 计算辐射雾（晨雾）概率
    const radiationFogProbability = this.calculateRadiationFogProbability(
      currentWeather,
      tempDewPointGap,
      temperatureTrend
    );
    
    // 计算平流雾概率
    const advectionFogProbability = this.calculateAdvectionFogProbability(
      currentWeather,
      tempDewPointGap
    );
    
    // 计算总体雾概率（取两者的加权平均）
    const overallFogProbability = radiationFogProbability * 0.6 + advectionFogProbability * 0.4;
    
    // 判断风险等级
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (overallFogProbability >= 70) {
      riskLevel = 'high';
    } else if (overallFogProbability >= 40) {
      riskLevel = 'medium';
    }
    
    return {
      radiationFogProbability: Math.round(radiationFogProbability),
      advectionFogProbability: Math.round(advectionFogProbability),
      overallFogProbability: Math.round(overallFogProbability),
      riskLevel,
      factors: {
        highHumidity: currentWeather.relativeHumidity >= 80,
        lowWind: currentWeather.windSpeed <= 3,
        temperatureDewPointGap: Math.round(tempDewPointGap * 10) / 10,
        temperatureTrend,
        cloudCondition: this.getCloudCondition(currentWeather.cloudCover),
      },
    };
  }

  /**
   * 计算辐射雾（晨雾）概率
   * 基于高湿度、微风、温度接近露点、温度下降趋势等指标
   */
  private static calculateRadiationFogProbability(
    weather: WeatherData,
    tempDewPointGap: number,
    temperatureTrend: 'decreasing' | 'stable' | 'increasing'
  ): number {
    let probability = 0;
    
    // 相对湿度贡献（最高40%）
    if (weather.relativeHumidity >= 90) {
      probability += 40;
    } else if (weather.relativeHumidity >= 80) {
      probability += 30;
    } else if (weather.relativeHumidity >= 70) {
      probability += 15;
    }
    
    // 风速贡献（最高30%）- 微风有利于辐射雾形成
    if (weather.windSpeed <= 1) {
      probability += 30;
    } else if (weather.windSpeed <= 2) {
      probability += 25;
    } else if (weather.windSpeed <= 3) {
      probability += 15;
    } else if (weather.windSpeed <= 5) {
      probability += 5;
    }
    
    // 温度-露点差值贡献（最高20%）
    if (tempDewPointGap <= 1) {
      probability += 20;
    } else if (tempDewPointGap <= 2) {
      probability += 15;
    } else if (tempDewPointGap <= 3) {
      probability += 10;
    } else if (tempDewPointGap <= 5) {
      probability += 5;
    }
    
    // 温度趋势贡献（最高10%）
    if (temperatureTrend === 'decreasing') {
      probability += 10;
    }
    
    // 云量贡献（最高5%）- 少云有利于辐射冷却
    if (weather.cloudCover <= 20) {
      probability += 5;
    }
    
    return Math.min(100, probability);
  }

  /**
   * 计算平流雾概率
   * 基于高湿度和适中风速等指标
   */
  private static calculateAdvectionFogProbability(
    weather: WeatherData,
    tempDewPointGap: number
  ): number {
    let probability = 0;
    
    // 相对湿度贡献（最高40%）
    if (weather.relativeHumidity >= 90) {
      probability += 40;
    } else if (weather.relativeHumidity >= 80) {
      probability += 30;
    } else if (weather.relativeHumidity >= 70) {
      probability += 15;
    }
    
    // 风速贡献（最高35%）- 平流雾需要适中风速
    if (weather.windSpeed >= 2 && weather.windSpeed <= 6) {
      probability += 35;
    } else if (weather.windSpeed >= 1 && weather.windSpeed < 2) {
      probability += 20;
    } else if (weather.windSpeed > 6 && weather.windSpeed <= 8) {
      probability += 20;
    } else if (weather.windSpeed > 8) {
      probability += 5;
    }
    
    // 温度-露点差值贡献（最高15%）
    if (tempDewPointGap <= 1) {
      probability += 15;
    } else if (tempDewPointGap <= 2) {
      probability += 12;
    } else if (tempDewPointGap <= 3) {
      probability += 8;
    } else if (tempDewPointGap <= 5) {
      probability += 3;
    }
    
    // 云量贡献（最高10%）
    if (weather.cloudCover >= 30 && weather.cloudCover <= 70) {
      probability += 10;
    } else if (weather.cloudCover > 70) {
      probability += 5;
    }
    
    return Math.min(100, probability);
  }

  /**
   * 获取云量条件描述
   */
  private static getCloudCondition(cloudCover: number): string {
    if (cloudCover <= 10) return '晴朗';
    if (cloudCover <= 25) return '少云';
    if (cloudCover <= 50) return '晴间多云';
    if (cloudCover <= 75) return '多云';
    return '阴天';
  }
}

/**
 * 云层数据处理和可视化
 */
export interface CloudLayerData {
  lowCloud: number; // 低云层（0-2000米）覆盖率（%）
  midCloud: number; // 中云层（2000-6000米）覆盖率（%）
  highCloud: number; // 高云层（6000米以上）覆盖率（%）
  totalCloud: number; // 总云量（%）
  altitude: number; // 海拔（米）
}

export interface CloudLayerTrend {
  time: Date;
  lowCloud: number;
  midCloud: number;
  highCloud: number;
  totalCloud: number;
}

export class CloudLayerProcessor {
  /**
   * 处理云层数据，考虑海拔修正
   * @param data 原始云层数据
   * @param altitude 地点海拔（米）
   * @returns 修正后的云层数据
   */
  static processCloudLayerData(
    data: Omit<CloudLayerData, 'altitude'>,
    altitude: number = 0
  ): CloudLayerData {
    // 海拔修正：每升高100米，低云层覆盖率降低约1-2%
    const altitudeCorrection = altitude / 100 * 0.015;
    
    return {
      lowCloud: Math.max(0, Math.min(100, data.lowCloud - altitudeCorrection)),
      midCloud: data.midCloud,
      highCloud: data.highCloud,
      totalCloud: data.totalCloud,
      altitude,
    };
  }

  /**
   * 获取云层高度说明
   */
  static getCloudHeightExplanation(): string {
    return `
云层高度基于海平面计算：
- 低云层：0-2000米（层积云、层云、积云等）
- 中云层：2000-6000米（高层云、高积云等）
- 高云层：6000米以上（卷云、卷层云、卷积云等）

注意：实际云层高度会因地点海拔而有所不同。海拔越高，相同的云层类型会出现在更低的高度。
    `.trim();
  }

  /**
   * 分析云层变化趋势
   */
  static analyzeTrend(trends: CloudLayerTrend[]): {
    lowCloudTrend: 'increasing' | 'decreasing' | 'stable';
    midCloudTrend: 'increasing' | 'decreasing' | 'stable';
    highCloudTrend: 'increasing' | 'decreasing' | 'stable';
    totalCloudTrend: 'increasing' | 'decreasing' | 'stable';
  } {
    if (trends.length < 2) {
      return {
        lowCloudTrend: 'stable',
        midCloudTrend: 'stable',
        highCloudTrend: 'stable',
        totalCloudTrend: 'stable',
      };
    }

    const first = trends[0];
    const last = trends[trends.length - 1];

    const getTrend = (firstVal: number, lastVal: number): 'increasing' | 'decreasing' | 'stable' => {
      const diff = lastVal - firstVal;
      if (Math.abs(diff) <= 5) return 'stable';
      return diff > 0 ? 'increasing' : 'decreasing';
    };

    return {
      lowCloudTrend: getTrend(first.lowCloud, last.lowCloud),
      midCloudTrend: getTrend(first.midCloud, last.midCloud),
      highCloudTrend: getTrend(first.highCloud, last.highCloud),
      totalCloudTrend: getTrend(first.totalCloud, last.totalCloud),
    };
  }
}

/**
 * Open-Meteo API 数据适配器
 */
export class OpenMeteoAdapter {
  /**
   * 将Open-Meteo API响应转换为WeatherData格式
   */
  static convertToWeatherData(apiResponse: any): WeatherData {
    return {
      temperature: apiResponse.temperature,
      relativeHumidity: apiResponse.relativeHumidity,
      dewPoint: apiResponse.dewPoint,
      windSpeed: apiResponse.windSpeed,
      weatherCode: apiResponse.weatherCode,
      cloudCover: apiResponse.cloudCover,
      lowCloudCover: apiResponse.cloudCoverLow || 0,
      midCloudCover: apiResponse.cloudCoverMid || 0,
      highCloudCover: apiResponse.cloudCoverHigh || 0,
    };
  }

  /**
   * 获取天气描述
   */
  static getWeatherDescription(weatherCode: number): string {
    const descriptions: Record<number, string> = {
      0: '晴朗',
      1: '主要晴朗',
      2: '晴间多云',
      3: '阴天',
      45: '雾',
      48: '沉降雾',
      51: '小雨',
      53: '中雨',
      55: '大雨',
      61: '小雨',
      63: '中雨',
      65: '大雨',
      71: '小雪',
      73: '中雪',
      75: '大雪',
      77: '雪粒',
      80: '小阵雨',
      81: '中阵雨',
      82: '大阵雨',
      85: '小阵雪',
      86: '大阵雪',
      95: '小雷阵雨',
      96: '中雷阵雨',
      99: '大雷阵雨',
    };
    return descriptions[weatherCode] || '未知';
  }
}

