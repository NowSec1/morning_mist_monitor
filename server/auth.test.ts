import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  hashPassword,
  verifyPassword,
  registerLocalUser,
  loginLocalUser,
} from "./auth";
import * as db from "./db";

describe("Local User Authentication", () => {
  const testUser = {
    username: `test_user_${Date.now()}`,
    password: "TestPassword123",
    email: "test@example.com",
    name: "Test User",
  };

  beforeAll(async () => {
    // 确保数据库连接可用
    const database = await db.getDb();
    if (!database) {
      throw new Error("Database not available for testing");
    }
  });

  describe("Password Hashing", () => {
    it("should hash password correctly", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20); // bcrypt hashes are typically 60 chars
    });

    it("should verify correct password", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);
      const isMatch = await verifyPassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);
      const isMatch = await verifyPassword("WrongPassword", hash);

      expect(isMatch).toBe(false);
    });

    it("should produce different hashes for same password", async () => {
      const password = "TestPassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("User Registration", () => {
    it("should register new user successfully", async () => {
      const result = await registerLocalUser(
        testUser.username,
        testUser.password,
        testUser.email,
        testUser.name
      );

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();
      expect(result.userId).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it("should reject duplicate username", async () => {
      const duplicateUsername = `duplicate_test_${Date.now()}_${Math.random()}`;
      // First registration
      const result1 = await registerLocalUser(
        duplicateUsername,
        testUser.password,
        `test1_${Date.now()}@example.com`
      );
      expect(result1.success).toBe(true);

      // Second registration with same username
      const result2 = await registerLocalUser(
        duplicateUsername,
        testUser.password,
        `test2_${Date.now()}@example.com`
      );

      expect(result2.success).toBe(false);
      expect(result2.error).toContain("用户名已存在");
    });

    it("should reject weak password", async () => {
      const result = await registerLocalUser(
        `weak_pass_${Date.now()}_${Math.random()}`,
        "short",
        `weak_${Date.now()}@example.com`
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("密码长度至少6个字符");
    });

    it("should reject invalid email format", async () => {
      const result = await registerLocalUser(
        `invalid_email_${Date.now()}_${Math.random()}`,
        testUser.password,
        "not-an-email"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("邮箱格式不正确");
    });

    it("should accept optional email", async () => {
      const result = await registerLocalUser(
        `no_email_${Date.now()}_${Math.random()}`,
        testUser.password,
        undefined,
        "No Email User"
      );

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();
    });
  });

  describe("User Login", () => {
    let loginTestUser: { username: string; password: string };

    beforeAll(async () => {
      loginTestUser = {
        username: `login_test_${Date.now()}`,
        password: "LoginTestPass123",
      };

      // Register user for login tests
      await registerLocalUser(
        loginTestUser.username,
        loginTestUser.password,
        `login_${Date.now()}@example.com`,
        "Login Test User"
      );
    });

    it("should login with correct credentials", async () => {
      const result = await loginLocalUser(
        loginTestUser.username,
        loginTestUser.password
      );

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();
      expect(result.userId).toBeGreaterThan(0);
      expect(result.user).toBeDefined();
      expect(result.user?.username).toBe(loginTestUser.username);
      expect(result.user?.password).toBeUndefined(); // Password should not be returned
    });

    it("should reject login with wrong password", async () => {
      const result = await loginLocalUser(
        loginTestUser.username,
        "WrongPassword123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("用户名或密码错误");
      expect(result.userId).toBeUndefined();
    });

    it("should reject login with non-existent user", async () => {
      const result = await loginLocalUser(
        "non_existent_user_12345",
        "SomePassword123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("用户名或密码错误");
      expect(result.userId).toBeUndefined();
    });

    it("should not return password in user object", async () => {
      const result = await loginLocalUser(
        loginTestUser.username,
        loginTestUser.password
      );

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.password).toBeUndefined();
    });

    it("should return user metadata correctly", async () => {
      const result = await loginLocalUser(
        loginTestUser.username,
        loginTestUser.password
      );

      expect(result.success).toBe(true);
      expect(result.user?.id).toBeDefined();
      expect(result.user?.username).toBe(loginTestUser.username);
      expect(result.user?.authType).toBe("local");
      expect(result.user?.role).toBe("user");
      expect(result.user?.isActive).toBe(true);
    });
  });

  describe("User Data Integrity", () => {
    it("should store and retrieve user correctly", async () => {
      const username = `integrity_test_${Date.now()}`;
      const password = "IntegrityTest123";
      const email = `integrity_${Date.now()}@example.com`;
      const name = "Integrity Test User";

      // Register
      const registerResult = await registerLocalUser(
        username,
        password,
        email,
        name
      );

      expect(registerResult.success).toBe(true);

      // Login
      const loginResult = await loginLocalUser(username, password);

      expect(loginResult.success).toBe(true);
      expect(loginResult.user?.username).toBe(username);
      expect(loginResult.user?.email).toBe(email);
      expect(loginResult.user?.name).toBe(name);
      expect(loginResult.user?.authType).toBe("local");
    });
  });
});
