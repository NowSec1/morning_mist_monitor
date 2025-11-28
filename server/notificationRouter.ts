import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { sendNotifications } from "./notificationService";
import { getDb } from "./db";

export const notificationRouter = router({
  addConfig: protectedProcedure
    .input(
      z.object({
        locationId: z.number(),
        type: z.enum(["dingtalk", "pushdeer"]),
        channelId: z.string(),
        secret: z.string().optional(),
        name: z.string(),
        threshold: z.number().int().min(0).max(100),
        frequency: z.enum(["daily", "always"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const result = await db.insert(require("../drizzle/schema").notificationConfigs).values({
        userId: ctx.user.id,
        locationId: input.locationId,
        type: input.type,
        channelId: input.channelId,
        secret: input.secret,
        name: input.name,
        threshold: input.threshold,
        frequency: input.frequency,
        enabled: true,
      });

      return { success: true };
    }),

  updateConfig: protectedProcedure
    .input(
      z.object({
        configId: z.number(),
        name: z.string().optional(),
        threshold: z.number().int().min(0).max(100).optional(),
        frequency: z.enum(["daily", "always"]).optional(),
        enabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const updateData: Record<string, any> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.threshold !== undefined) updateData.threshold = input.threshold;
      if (input.frequency !== undefined) updateData.frequency = input.frequency;
      if (input.enabled !== undefined) updateData.enabled = input.enabled;

      await db
        .update(require("../drizzle/schema").notificationConfigs)
        .set(updateData)
        .where(
          require("drizzle-orm").and(
            require("drizzle-orm").eq(require("../drizzle/schema").notificationConfigs.id, input.configId),
            require("drizzle-orm").eq(require("../drizzle/schema").notificationConfigs.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  deleteConfig: protectedProcedure
    .input(z.object({ configId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      await db
        .delete(require("../drizzle/schema").notificationConfigs)
        .where(
          require("drizzle-orm").and(
            require("drizzle-orm").eq(require("../drizzle/schema").notificationConfigs.id, input.configId),
            require("drizzle-orm").eq(require("../drizzle/schema").notificationConfigs.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  toggleConfig: protectedProcedure
    .input(z.object({ configId: z.number(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      await db
        .update(require("../drizzle/schema").notificationConfigs)
        .set({ enabled: input.enabled })
        .where(
          require("drizzle-orm").and(
            require("drizzle-orm").eq(require("../drizzle/schema").notificationConfigs.id, input.configId),
            require("drizzle-orm").eq(require("../drizzle/schema").notificationConfigs.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  getConfigs: protectedProcedure
    .input(z.object({ locationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return [];
      }

      const configs = await db
        .select()
        .from(require("../drizzle/schema").notificationConfigs)
        .where(
          require("drizzle-orm").and(
            require("drizzle-orm").eq(require("../drizzle/schema").notificationConfigs.userId, ctx.user.id),
            require("drizzle-orm").eq(require("../drizzle/schema").notificationConfigs.locationId, input.locationId)
          )
        );

      return configs;
    }),

  getHistory: protectedProcedure
    .input(z.object({ locationId: z.number(), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return [];
      }

      const history = await db
        .select()
        .from(require("../drizzle/schema").notificationHistory)
        .where(
          require("drizzle-orm").and(
            require("drizzle-orm").eq(require("../drizzle/schema").notificationHistory.userId, ctx.user.id),
            require("drizzle-orm").eq(require("../drizzle/schema").notificationHistory.locationId, input.locationId)
          )
        )
        .orderBy(require("drizzle-orm").desc(require("../drizzle/schema").notificationHistory.createdAt))
        .limit(input.limit);

      return history;
    }),

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
        type: z.enum(["dingtalk", "pushdeer"]),
        channelId: z.string(),
        secret: z.string().optional(),
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

      console.log("[triggerNotification] input:", { type: input.type, channelId: input.channelId, secret: input.secret });
      
      const testConfig = {
        type: input.type as "dingtalk" | "pushdeer",
        channelId: input.channelId,
        secret: input.secret,
      };
      
      console.log("[triggerNotification] testConfig:", testConfig);
      
      const results = await sendNotifications(
        ctx.user.id,
        input.locationId,
        input.locationName,
        input.fogProbability,
        payload,
        testConfig
      );

      if (results.length > 0) {
        return {
          success: true,
          result: results[0],
        };
      }

      return {
        success: false,
        result: {
          success: false,
          error: "没有可用的通知配置",
        },
      };
    }),
});

