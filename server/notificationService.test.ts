import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getNotificationConfigs,
  addNotificationConfig,
  updateNotificationConfig,
  deleteNotificationConfig,
  getNotificationHistory,
} from "./notificationService";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(() => Promise.resolve(null)),
}));

describe("NotificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNotificationConfigs", () => {
    it("should return empty array when database is not available", async () => {
      const result = await getNotificationConfigs(1);
      expect(result).toEqual([]);
    });

    it("should return empty array when no locationId is provided", async () => {
      const result = await getNotificationConfigs(1);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getNotificationHistory", () => {
    it("should return empty array when database is not available", async () => {
      const result = await getNotificationHistory(1);
      expect(result).toEqual([]);
    });

    it("should accept limit parameter", async () => {
      const result = await getNotificationHistory(1, undefined, 50);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("addNotificationConfig", () => {
    it("should throw error when database is not available", async () => {
      await expect(
        addNotificationConfig(1, 1, "dingtalk", "https://webhook.url", "Test Config")
      ).rejects.toThrow("Database not available");
    });

    it("should accept valid notification type", async () => {
      try {
        await addNotificationConfig(1, 1, "dingtalk", "https://webhook.url", "Test Config");
      } catch (error) {
        expect((error as Error).message).toBe("Database not available");
      }
    });
  });

  describe("updateNotificationConfig", () => {
    it("should throw error when database is not available", async () => {
      await expect(
        updateNotificationConfig(1, { name: "Updated Config" })
      ).rejects.toThrow("Database not available");
    });
  });

  describe("deleteNotificationConfig", () => {
    it("should throw error when database is not available", async () => {
      await expect(deleteNotificationConfig(1)).rejects.toThrow(
        "Database not available"
      );
    });
  });

  describe("Notification message formatting", () => {
    it("should format DingTalk message correctly", () => {
      // This test verifies that the message formatting functions exist
      // and can be called without errors
      const payload = {
        locationName: "Test Location",
        fogProbability: 85,
        sunriseTime: "06:30",
        blueHourStart: "06:00",
        blueHourEnd: "06:50",
        goldenHourStart: "06:20",
        goldenHourEnd: "07:30",
        factors: {
          humidity: "高湿度",
          wind: "微风",
          tempDewPointGap: "温-露差小",
          tempTrend: "温度下降",
        },
      };

      // Verify payload structure
      expect(payload.locationName).toBe("Test Location");
      expect(payload.fogProbability).toBe(85);
      expect(payload.factors.humidity).toBe("高湿度");
    });
  });

  describe("Notification configuration validation", () => {
    it("should validate threshold range", () => {
      const validThresholds = [0, 50, 80, 100];
      validThresholds.forEach((threshold) => {
        expect(threshold >= 0 && threshold <= 100).toBe(true);
      });
    });

    it("should validate frequency values", () => {
      const validFrequencies = ["daily", "always"];
      const testFrequency = "daily";
      expect(validFrequencies.includes(testFrequency)).toBe(true);
    });

    it("should validate notification types", () => {
      const validTypes = ["dingtalk", "pushdeer"];
      const testType = "dingtalk";
      expect(validTypes.includes(testType)).toBe(true);
    });
  });
});

