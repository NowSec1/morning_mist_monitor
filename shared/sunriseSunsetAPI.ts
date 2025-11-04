/**
 * SunriseSunset.io API 集成
 * 获取日出、日落、金色时刻等天文数据
 */

export interface SunTimesResponse {
  date: string;
  sunrise: string;
  sunset: string;
  first_light: string;
  last_light: string;
  dawn: string;
  dusk: string;
  solar_noon: string;
  golden_hour: string;
  day_length: string;
  timezone: string;
  utc_offset: number;
}

export class SunriseSunsetAPI {
  /**
   * 获取日出、日落和金色时刻数据
   * @param latitude 纬度
   * @param longitude 经度
   * @param date 日期
   * @param timezone 时区
   * @returns 太阳时间数据
   */
  static async fetchSunTimes(
    latitude: number,
    longitude: number,
    date: Date,
    timezone: string = "Asia/Shanghai"
  ): Promise<SunTimesResponse> {
    try {
      const dateStr = date.toISOString().split("T")[0];
      const url = new URL("https://api.sunrisesunset.io/json");
      url.searchParams.append("lat", String(latitude));
      url.searchParams.append("lng", String(longitude));
      url.searchParams.append("date", dateStr);
      url.searchParams.append("timezone", timezone);
      url.searchParams.append("time_format", "24");

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== "OK" || !data.results) {
        throw new Error("API returned error");
      }

      return data.results as SunTimesResponse;
    } catch (error) {
      console.error("SunriseSunset.io API error:", error);
      throw error;
    }
  }

  /**
   * 将时间字符串转换为小时和分钟
   * @param timeStr 时间字符串 (HH:MM:SS 格式)
   * @returns { hour, minute }
   */
  static parseTime(timeStr: string): { hour: number; minute: number } {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return { hour: hours, minute: minutes };
  }

  /**
   * 从API响应中提取日出时间
   */
  static getSunriseTime(response: SunTimesResponse): { hour: number; minute: number } {
    return this.parseTime(response.sunrise);
  }

  /**
   * 从API响应中提取日落时间
   */
  static getSunsetTime(response: SunTimesResponse): { hour: number; minute: number } {
    return this.parseTime(response.sunset);
  }

  /**
   * 从API响应中提取金色时刻
   */
  static getGoldenHourTime(response: SunTimesResponse): { hour: number; minute: number } {
    return this.parseTime(response.golden_hour);
  }

  /**
   * 计算蓝调时刻（Blue Hour）
   * 日出前30分钟至日出后20分钟
   */
  static getBlueHour(sunriseTime: { hour: number; minute: number }): {
    start: { hour: number; minute: number };
    end: { hour: number; minute: number };
  } {
    // 计算开始时间（日出前30分钟）
    let startHour = sunriseTime.hour;
    let startMinute = sunriseTime.minute - 30;
    if (startMinute < 0) {
      startHour -= 1;
      startMinute += 60;
    }
    if (startHour < 0) {
      startHour += 24;
    }

    // 计算结束时间（日出后20分钟）
    let endHour = sunriseTime.hour;
    let endMinute = sunriseTime.minute + 20;
    if (endMinute >= 60) {
      endHour += 1;
      endMinute -= 60;
    }
    if (endHour >= 24) {
      endHour -= 24;
    }

    return {
      start: { hour: startHour, minute: startMinute },
      end: { hour: endHour, minute: endMinute },
    };
  }

  /**
   * 计算金色时刻（Golden Hour）
   * 日出前10分钟至日出后60分钟
   */
  static getGoldenHourRange(sunriseTime: { hour: number; minute: number }): {
    start: { hour: number; minute: number };
    end: { hour: number; minute: number };
  } {
    // 计算开始时间（日出前10分钟）
    let startHour = sunriseTime.hour;
    let startMinute = sunriseTime.minute - 10;
    if (startMinute < 0) {
      startHour -= 1;
      startMinute += 60;
    }
    if (startHour < 0) {
      startHour += 24;
    }

    // 计算结束时间（日出后60分钟）
    let endHour = sunriseTime.hour + 1;
    let endMinute = sunriseTime.minute;
    if (endHour >= 24) {
      endHour -= 24;
    }

    return {
      start: { hour: startHour, minute: startMinute },
      end: { hour: endHour, minute: endMinute },
    };
  }
}

