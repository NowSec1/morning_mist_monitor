import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  addNotificationConfig,
  updateNotificationConfig,
  deleteNotificationConfig,
  getNotificationConfigs,
  getNotificationHistory,
  sendNotifications,
} from "./notificationService";

export const notificationsRouter = router({
  // 添加通知配置
  addConfig: protectedProcedure
    .input(
      z.object({
        locationId: z.number(),
        type: z.enum(["dingtalk", "pushdeer"]),
        channelId: z.string().min(1, "通知渠道标识不能为空"),
        name: z.string().min(1, "通知名称不能为空"),
        threshold: z.number().int().min(0).max(100).default(80),
        frequency: z.enum(["daily", "always"]).default("daily"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await addNotificationConfig(
        ctx.user.id,
        input.locationId,
        input.type,
        input.channelId,
        input.name,
        input.threshold,
        input.frequency
      );
    }),

  // 获取通知配置列表
  getConfigs: protectedProcedure
    .input(
      z.object({
        locationId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getNotificationConfigs(ctx.user.id, input.locationId);
    }),

  // 更新通知配置
  updateConfig: protectedProcedure
    .input(
      z.object({
        configId: z.number(),
        name: z.string().optional(),
        threshold: z.number().int().min(0).max(100).optional(),
        enabled: z.number().optional(),
        frequency: z.enum(["daily", "always"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await updateNotificationConfig(input.configId, {
        name: input.name,
        threshold: input.threshold,
        enabled: input.enabled,
        frequency: input.frequency,
      });
    }),

  // 删除通知配置
  deleteConfig: protectedProcedure
    .input(z.object({ configId: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteNotificationConfig(input.configId);
    }),

  // 获取通知历史
  getHistory: protectedProcedure
    .input(
      z.object({
        locationId: z.number().optional(),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getNotificationHistory(ctx.user.id, input.locationId, input.limit);
    }),

  // 手动触发通知（用于测试）
  triggerNotification: protectedProcedure
    .input(
      z.object({
        locationId: z.number(),
        locationName: z.string(),
        fogProbability: z.number().int().min(0).max(100),
        sunriseTime: z.string(),
        blueHourStart: z.string(),
        blueHourEnd: z.string(),
        goldenHourStart: z.string(),
        goldenHourEnd: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payload = {
        locationName: input.locationName,
        fogProbability: input.fogProbability,
        sunriseTime: input.sunriseTime,
        blueHourStart: input.blueHourStart,
        blueHourEnd: input.blueHourEnd,
        goldenHourStart: input.goldenHourStart,
        goldenHourEnd: input.goldenHourEnd,
        factors: {
          humidity: "高湿度",
          wind: "微风",
          tempDewPointGap: "温-露差小",
          tempTrend: "温度下降",
        },
      };
      await sendNotifications(
        ctx.user.id,
        input.locationId,
        input.locationName,
        input.fogProbability,
        payload
      );
      return { success: true };
    }),
});

