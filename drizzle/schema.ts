import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

/**
 * 核心用户表
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 监测地点表
 * 用户可自定义监测地点，支持多个地点配置
 */
export const monitoringLocations = mysqlTable("monitoring_locations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // 地点名称，如"高新-丈八一路"
  latitude: decimal("latitude", { precision: 10, scale: 6 }).notNull(), // 纬度（WGS-84）
  longitude: decimal("longitude", { precision: 10, scale: 6 }).notNull(), // 经度（WGS-84）
  altitude: int("altitude").default(0).notNull(), // 海拔（米）
  timezone: varchar("timezone", { length: 50 }).default("Asia/Shanghai").notNull(), // 时区
  isDefault: int("isDefault").default(0).notNull(), // 是否为默认地点
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonitoringLocation = typeof monitoringLocations.$inferSelect;
export type InsertMonitoringLocation = typeof monitoringLocations.$inferInsert;

/**
 * 气象数据缓存表
 * 存储从Open-Meteo API获取的气象数据，避免频繁调用API
 */
export const weatherDataCache = mysqlTable("weather_data_cache", {
  id: int("id").autoincrement().primaryKey(),
  locationId: int("locationId").notNull(),
  timestamp: timestamp("timestamp").notNull(), // 气象数据时间
  temperature: decimal("temperature", { precision: 5, scale: 2 }).notNull(), // 温度（°C）
  relativeHumidity: int("relativeHumidity").notNull(), // 相对湿度（%）
  dewPoint: decimal("dewPoint", { precision: 5, scale: 2 }).notNull(), // 露点（°C）
  windSpeed: decimal("windSpeed", { precision: 5, scale: 2 }).notNull(), // 风速（m/s）
  weatherCode: int("weatherCode").notNull(), // WMO天气代码
  cloudCover: int("cloudCover").notNull(), // 总云量（%）
  lowCloudCover: int("lowCloudCover").default(0).notNull(), // 低云层覆盖率（%）
  midCloudCover: int("midCloudCover").default(0).notNull(), // 中云层覆盖率（%）
  highCloudCover: int("highCloudCover").default(0).notNull(), // 高云层覆盖率（%）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeatherDataCache = typeof weatherDataCache.$inferSelect;
export type InsertWeatherDataCache = typeof weatherDataCache.$inferInsert;

/**
 * 晨雾预测结果表
 * 存储计算出的晨雾/平流雾概率和相关指标
 */
export const fogPredictions = mysqlTable("fog_predictions", {
  id: int("id").autoincrement().primaryKey(),
  locationId: int("locationId").notNull(),
  forecastDate: timestamp("forecastDate").notNull(), // 预报日期
  sunriseTime: timestamp("sunriseTime").notNull(), // 日出时间
  blueHourStart: timestamp("blueHourStart").notNull(), // 蓝调时刻开始
  blueHourEnd: timestamp("blueHourEnd").notNull(), // 蓝调时刻结束
  goldenHourStart: timestamp("goldenHourStart").notNull(), // 金色时刻开始
  goldenHourEnd: timestamp("goldenHourEnd").notNull(), // 金色时刻结束
  radiationFogProbability: int("radiationFogProbability").notNull(), // 辐射雾概率（%）
  advectionFogProbability: int("advectionFogProbability").notNull(), // 平流雾概率（%）
  overallFogProbability: int("overallFogProbability").notNull(), // 总体雾概率（%）
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]).notNull(), // 风险等级
  factors: json("factors").notNull(), // 影响因素JSON（高湿度、微风、温度-露点差值等）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FogPrediction = typeof fogPredictions.$inferSelect;
export type InsertFogPrediction = typeof fogPredictions.$inferInsert;

/**
 * 用户查询历史表
 * 记录用户的查询历史，用于分析和改进
 */
export const queryHistory = mysqlTable("query_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  locationId: int("locationId").notNull(),
  queryDate: timestamp("queryDate").notNull(), // 查询日期
  resultSummary: json("resultSummary").notNull(), // 结果摘要（包含概率、风险等级等）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QueryHistory = typeof queryHistory.$inferSelect;
export type InsertQueryHistory = typeof queryHistory.$inferInsert;

