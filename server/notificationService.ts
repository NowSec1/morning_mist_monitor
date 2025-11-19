import { getDb } from "./db";
import { notificationConfigs, notificationHistory, InsertNotificationHistory } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * 通知服务模块
 * 负责处理钉钉和PushDeer推送通知
 */

interface NotificationPayload {
  locationName: string;
  fogProbability: number;
  sunriseTime: string;
  blueHourStart: string;
  blueHourEnd: string;
  goldenHourStart: string;
  goldenHourEnd: string;
  factors: {
    humidity: string;
    wind: string;
    tempDewPointGap: string;
    tempTrend: string;
  };
}

/**
 * 发送钉钉群机器人通知
 */
async function sendDingTalkNotification(
  webhookUrl: string,
  payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const message = formatDingTalkMessage(payload);
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        msgtype: "markdown",
        markdown: {
          title: "晨雾预警通知",
          text: message,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${error}` };
    }

    const result = await response.json();
    if (result.errcode !== 0) {
      return { success: false, error: `钉钉错误: ${result.errmsg}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * 发送PushDeer推送通知
 */
async function sendPushDeerNotification(
  pushKey: string,
  payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const message = formatPushDeerMessage(payload);
    
    const response = await fetch("https://www.pushdeer.com/api/pushMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pushkey: pushKey,
        text: "晨雾预警通知",
        desp: message,
        type: "markdown",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${error}` };
    }

    const result = await response.json();
    if (result.code !== 0) {
      return { success: false, error: `PushDeer错误: ${result.msg}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * 格式化钉钉消息
 */
function formatDingTalkMessage(payload: NotificationPayload): string {
  return `
## 晨雾预警通知

**地点**: ${payload.locationName}

**晨雾概率**: **${payload.fogProbability}%**

### 摄影时刻
- **日出时间**: ${payload.sunriseTime}
- **蓝调时刻**: ${payload.blueHourStart} ~ ${payload.blueHourEnd}
- **金色时刻**: ${payload.goldenHourStart} ~ ${payload.goldenHourEnd}

### 影响因素
- **相对湿度**: ${payload.factors.humidity}
- **风速**: ${payload.factors.wind}
- **温-露差**: ${payload.factors.tempDewPointGap}
- **温度趋势**: ${payload.factors.tempTrend}

### 建议
晨雾概率超过80%，建议提前前往拍摄地点，把握最佳摄影时机！
  `.trim();
}

/**
 * 格式化PushDeer消息
 */
function formatPushDeerMessage(payload: NotificationPayload): string {
  return `
## 晨雾预警通知

**地点**: ${payload.locationName}

**晨雾概率**: ${payload.fogProbability}%

### 摄影时刻
- 日出时间: ${payload.sunriseTime}
- 蓝调时刻: ${payload.blueHourStart} ~ ${payload.blueHourEnd}
- 金色时刻: ${payload.goldenHourStart} ~ ${payload.goldenHourEnd}

### 影响因素
- 相对湿度: ${payload.factors.humidity}
- 风速: ${payload.factors.wind}
- 温-露差: ${payload.factors.tempDewPointGap}
- 温度趋势: ${payload.factors.tempTrend}

晨雾概率超过80%，建议提前前往拍摄地点，把握最佳摄影时机！
  `.trim();
}

/**
 * 检查是否应该发送通知
 * 考虑频率控制（daily/always）和阈值
 */
function shouldSendNotification(
  config: any,
  fogProbability: number,
  lastNotifiedAt: Date | null
): boolean {
  // 检查是否启用
  if (!config.enabled) {
    return false;
  }

  // 检查是否超过阈值
  if (fogProbability < config.threshold) {
    return false;
  }

  // 检查频率控制
  if (config.frequency === "daily" && lastNotifiedAt) {
    const now = new Date();
    const lastNotified = new Date(lastNotifiedAt);
    const daysDiff = Math.floor((now.getTime() - lastNotified.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 1) {
      return false;
    }
  }

  return true;
}

/**
 * 发送通知并记录历史
 */
export async function sendNotifications(
  userId: number,
  locationId: number,
  locationName: string,
  fogProbability: number,
  payload: NotificationPayload
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Notification] Database not available");
    return;
  }

  try {
    // 获取该地点的所有启用的通知配置
    const configs = await db
      .select()
      .from(notificationConfigs)
      .where(
        and(
          eq(notificationConfigs.userId, userId),
          eq(notificationConfigs.locationId, locationId),
          eq(notificationConfigs.enabled, 1)
        )
      );

    for (const config of configs) {
      // 检查是否应该发送通知
      if (!shouldSendNotification(config, fogProbability, config.lastNotifiedAt)) {
        continue;
      }

      let result: { success: boolean; error?: string };

      // 根据通知类型选择发送方式
      if (config.type === "dingtalk") {
        result = await sendDingTalkNotification(config.channelId, payload);
      } else if (config.type === "pushdeer") {
        result = await sendPushDeerNotification(config.channelId, payload);
      } else {
        result = { success: false, error: "Unknown notification type" };
      }

      // 记录通知历史
      const historyRecord: InsertNotificationHistory = {
        userId,
        locationId,
        configId: config.id,
        type: config.type,
        fogProbability,
        message: payload.locationName + " - 晨雾概率 " + fogProbability + "%",
        status: result.success ? "success" : "failed",
        errorMessage: result.error,
      };

      await db.insert(notificationHistory).values(historyRecord);

      // 如果成功发送，更新lastNotifiedAt
      if (result.success) {
        await db
          .update(notificationConfigs)
          .set({ lastNotifiedAt: new Date() })
          .where(eq(notificationConfigs.id, config.id));
      }

      console.log(
        `[Notification] ${config.type} notification ${result.success ? "sent" : "failed"} for location ${locationId}`,
        result.error
      );
    }
  } catch (error) {
    console.error("[Notification] Error sending notifications:", error);
  }
}

/**
 * 获取用户的通知配置列表
 */
export async function getNotificationConfigs(userId: number, locationId?: number) {
  const db = await getDb();
  if (!db) return [];

  if (locationId) {
    return await db
      .select()
      .from(notificationConfigs)
      .where(
        and(
          eq(notificationConfigs.userId, userId),
          eq(notificationConfigs.locationId, locationId)
        )
      );
  } else {
    return await db
      .select()
      .from(notificationConfigs)
      .where(eq(notificationConfigs.userId, userId));
  }
}

/**
 * 获取通知历史
 */
export async function getNotificationHistory(
  userId: number,
  locationId?: number,
  limit: number = 20
) {
  const db = await getDb();
  if (!db) return [];

  if (locationId) {
    return await db
      .select()
      .from(notificationHistory)
      .where(
        and(
          eq(notificationHistory.userId, userId),
          eq(notificationHistory.locationId, locationId)
        )
      )
      .orderBy(notificationHistory.createdAt)
      .limit(limit);
  } else {
    return await db
      .select()
      .from(notificationHistory)
      .where(eq(notificationHistory.userId, userId))
      .orderBy(notificationHistory.createdAt)
      .limit(limit);
  }
}

/**
 * 添加通知配置
 */
export async function addNotificationConfig(
  userId: number,
  locationId: number,
  type: "dingtalk" | "pushdeer",
  channelId: string,
  name: string,
  threshold: number = 80,
  frequency: "daily" | "always" = "daily"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notificationConfigs).values({
    userId,
    locationId,
    type,
    channelId,
    name,
    threshold,
    frequency,
    enabled: 1,
  });

  return result;
}

/**
 * 更新通知配置
 */
export async function updateNotificationConfig(
  configId: number,
  updates: Partial<{
    name: string;
    threshold: number;
    enabled: number;
    frequency: "daily" | "always";
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(notificationConfigs)
    .set(updates)
    .where(eq(notificationConfigs.id, configId));
}

/**
 * 删除通知配置
 */
export async function deleteNotificationConfig(configId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(notificationConfigs)
    .where(eq(notificationConfigs.id, configId));
}

