import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("NotificationRouter Input Validation", () => {
  describe("addConfig input validation", () => {
    const addConfigSchema = z.object({
      locationId: z.number(),
      type: z.enum(["dingtalk", "pushdeer"]),
      channelId: z.string().min(1, "通知渠道标识不能为空"),
      name: z.string().min(1, "通知名称不能为空"),
      threshold: z.number().int().min(0).max(100).default(80),
      frequency: z.enum(["daily", "always"]).default("daily"),
    });

    it("should accept valid dingtalk config", () => {
      const input = {
        locationId: 1,
        type: "dingtalk" as const,
        channelId: "https://oapi.dingtalk.com/robot/send?access_token=xxx",
        name: "Team Group",
      };
      const result = addConfigSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept valid pushdeer config", () => {
      const input = {
        locationId: 1,
        type: "pushdeer" as const,
        channelId: "PDU123456",
        name: "Personal Push",
        threshold: 75,
        frequency: "always" as const,
      };
      const result = addConfigSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty channelId", () => {
      const input = {
        locationId: 1,
        type: "dingtalk" as const,
        channelId: "",
        name: "Test",
      };
      const result = addConfigSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const input = {
        locationId: 1,
        type: "dingtalk" as const,
        channelId: "https://webhook.url",
        name: "",
      };
      const result = addConfigSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid threshold", () => {
      const input = {
        locationId: 1,
        type: "dingtalk" as const,
        channelId: "https://webhook.url",
        name: "Test",
        threshold: 150,
      };
      const result = addConfigSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should apply default threshold of 80", () => {
      const input = {
        locationId: 1,
        type: "dingtalk" as const,
        channelId: "https://webhook.url",
        name: "Test",
      };
      const result = addConfigSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.threshold).toBe(80);
      }
    });

    it("should apply default frequency of daily", () => {
      const input = {
        locationId: 1,
        type: "dingtalk" as const,
        channelId: "https://webhook.url",
        name: "Test",
      };
      const result = addConfigSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.frequency).toBe("daily");
      }
    });
  });

  describe("getConfigs input validation", () => {
    const getConfigsSchema = z.object({
      locationId: z.number().optional(),
    });

    it("should accept with locationId", () => {
      const input = { locationId: 1 };
      const result = getConfigsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept without locationId", () => {
      const input = {};
      const result = getConfigsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("updateConfig input validation", () => {
    const updateConfigSchema = z.object({
      configId: z.number(),
      name: z.string().optional(),
      threshold: z.number().int().min(0).max(100).optional(),
      enabled: z.number().optional(),
      frequency: z.enum(["daily", "always"]).optional(),
    });

    it("should accept valid update with all fields", () => {
      const input = {
        configId: 1,
        name: "Updated Name",
        threshold: 90,
        enabled: 1,
        frequency: "always" as const,
      };
      const result = updateConfigSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept update with only configId", () => {
      const input = { configId: 1 };
      const result = updateConfigSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid threshold in update", () => {
      const input = {
        configId: 1,
        threshold: 150,
      };
      const result = updateConfigSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("deleteConfig input validation", () => {
    const deleteConfigSchema = z.object({ configId: z.number() });

    it("should accept valid configId", () => {
      const input = { configId: 1 };
      const result = deleteConfigSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject missing configId", () => {
      const input = {};
      const result = deleteConfigSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("getHistory input validation", () => {
    const getHistorySchema = z.object({
      locationId: z.number().optional(),
      limit: z.number().int().min(1).max(100).default(20),
    });

    it("should accept valid history query", () => {
      const input = { locationId: 1, limit: 10 };
      const result = getHistorySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should apply default limit of 20", () => {
      const input = { locationId: 1 };
      const result = getHistorySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });

    it("should reject limit exceeding 100", () => {
      const input = { locationId: 1, limit: 150 };
      const result = getHistorySchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("triggerNotification input validation", () => {
    const triggerSchema = z.object({
      locationId: z.number(),
      locationName: z.string(),
      fogProbability: z.number().int().min(0).max(100),
      sunriseTime: z.string(),
      blueHourStart: z.string(),
      blueHourEnd: z.string(),
      goldenHourStart: z.string(),
      goldenHourEnd: z.string(),
    });

    it("should accept valid trigger notification input", () => {
      const input = {
        locationId: 1,
        locationName: "Test Location",
        fogProbability: 85,
        sunriseTime: "06:30",
        blueHourStart: "06:00",
        blueHourEnd: "06:50",
        goldenHourStart: "06:20",
        goldenHourEnd: "07:30",
      };
      const result = triggerSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid fog probability", () => {
      const input = {
        locationId: 1,
        locationName: "Test Location",
        fogProbability: 150,
        sunriseTime: "06:30",
        blueHourStart: "06:00",
        blueHourEnd: "06:50",
        goldenHourStart: "06:20",
        goldenHourEnd: "07:30",
      };
      const result = triggerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing required fields", () => {
      const input = {
        locationId: 1,
        locationName: "Test Location",
      };
      const result = triggerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});

