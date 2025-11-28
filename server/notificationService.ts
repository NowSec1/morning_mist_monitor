import { getDb } from "./db";
import { notificationConfigs, notificationHistory, InsertNotificationHistory } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { createHmac } from "crypto";

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
 * 支持加签认证
 */
async function sendDingTalkNotification(
  webhookUrl: string,
  payload: NotificationPayload,
  secret?: string
): Promise<{ success: boolean; error?: string; details?: string }> {
  try {
    const message = formatDingTalkMessage(payload);
    
    let url = webhookUrl;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // 处理加签
    if (secret) {
      const timestamp = Date.now();
      const stringToSign = `${timestamp}\n${secret}`;
      
      const hmac = createHmac("sha256", secret);
      hmac.update(stringToSign);
      const sign = hmac.digest("base64");
      
      // 将签名和timestamp添加到URL
      const separator = webhookUrl.includes("?") ? "&" : "?";
      url = `${webhookUrl}${separator}timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`;
    }
    
    const response = await fetch(url, {
      method: "POST",
      headers,
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
      return { 
        success: false, 
        error: `HTTP ${response.status}`,
        details: `HTTP错误: ${response.status}\n响应: ${error}`
      };
    }

    const result = await response.json();
    if (result.errcode !== 0) {
      return { 
        success: false, 
        error: `钉钉错误: ${result.errmsg}`,
        details: `钉钉API返回错误\n错误码: ${result.errcode}\n错误信息: ${result.errmsg}`
      };
    }

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { 
      success: false, 
      error: `网络错误: ${errorMsg}`,
      details: `发送钉钉通知时出错\n错误: ${errorMsg}`
    };
  }
}

/**
 * 发送PushDeer推送通知
 */
async function sendPushDeerNotification(
  pushKey: string,
  payload: NotificationPayload
): Promise<{ success: boolean; error?: string; details?: string }> {
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
      return { 
        success: false, 
        error: `HTTP ${response.status}`,
        details: `HTTP错误: ${response.status}\n响应: ${error}`
      };
    }

    const result = await response.json();
    if (result.code !== 0) {
      return { 
        success: false, 
        error: `PushDeer错误: ${result.msg}`,
        details: `PushDeer API返回错误\n错误码: ${result.code}\n错误信息: ${result.msg}\n\n诊断建议:\n1. 检查pushkey是否正确\n2. 检查PushDeer账户是否有效\n3. 检查网络连接`
      };
    }

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { 
      success: false, 
      error: `网络错误: ${errorMsg}`,
      details: `发送PushDeer通知时出错\n错误: ${errorMsg}\n\n诊断建议:\n1. 检查网络连接\n2. 检查PushDeer服务是否可用\n3. 检查pushkey格式是否正确`
    };
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
 * @returns 返回每个配置的发送结果
 */
export async function sendNotifications(
  userId: number,
  locationId: number,
  locationName: string,
  fogProbability: number,
  payload: NotificationPayload,
  testConfig?: { type: "dingtalk" | "pushdeer"; channelId: string; secret?: string }
): Promise<Array<{ configId: number; type: string; success: boolean; error?: string; details?: string }>> {
  const db = await getDb();
  const results: Array<{ configId: number; type: string; success: boolean; error?: string; details?: string }> = [];
  
  if (!db) {
    console.warn("[Notification] Database not available");
    return results;
  }

  try {
    // 如果提供了测试配置，则只测试该配置
    if (testConfig) {
      console.log("[Notification] Testing config:", testConfig);
      let result: { success: boolean; error?: string; details?: string };
      // 根据通知类型选择发送方式
      if (testConfig.type === "dingtalk") {
        result = await sendDingTalkNotification(testConfig.channelId, payload, testConfig.secret || undefined);
      } else if (testConfig.type === "pushdeer") {
        result = await sendPushDeerNotification(testConfig.channelId, payload);
      } else {
        result = { success: false, error: "Unknown notification type" };
      }
      
      results.push({
        configId: 0,
        type: testConfig.type,
        ...result
      });
      
      return results;
    }
    
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
        results.push({
          configId: config.id,
          type: config.type,
          success: false,
          error: "不符合发送条件",
          details: "根据频率控制或阈值设置，此次不需要发送通知"
        });
        continue;
      }

      let result: { success: boolean; error?: string; details?: string };
      // 根据通知类型选择发送方式
      if (config.type === "dingtalk") {
        result = await sendDingTalkNotification(config.channelId, payload, config.secret || undefined);
      } else if (config.type === "pushdeer") {
        result = await sendPushDeerNotification(config.channelId, payload);
      } else {
        result = { success: false, error: "Unknown notification type" };
      }

      results.push({
        configId: config.id,
        type: config.type,
        ...result
      });

      // 记录通知历史
      const historyRecord: InsertNotificationHistory = {
        userId,
        locationId,
        configId: config.id,
        type: config.type,
        fogProbability,
        message: payload.locationName + " - 晨雾概率 " + fogProbability + "%",
        status: result.success ? "success" : "failed",
        errorMessage: result.details || result.error,
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
  
  return results;
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
  frequency: "daily" | "always" = "daily",
  secret?: string
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
    secret,
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
    secret?: string | null;
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

