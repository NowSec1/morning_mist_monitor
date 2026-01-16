import bcrypt from "bcrypt";
import * as db from "./db";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";

/**
 * 本地用户认证模块
 */

const SALT_ROUNDS = 10;

/**
 * 对密码进行加密
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 本地用户注册
 */
export async function registerLocalUser(
  username: string,
  password: string,
  email?: string,
  name?: string
): Promise<{ success: boolean; userId?: number; error?: string }> {
  try {
    // 检查用户名是否已存在
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return { success: false, error: "用户名已存在" };
    }

    // 检查邮箱是否已被使用
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: "邮箱格式不正确" };
      }
    }

    // 验证密码强度
    if (password.length < 6) {
      return { success: false, error: "密码长度至少6个字符" };
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const userId = await db.createLocalUser({
      username,
      password: hashedPassword,
      email,
      name,
    });

    return { success: true, userId };
  } catch (error) {
    console.error("[Auth] Registration failed:", error);
    return { success: false, error: "注册失败，请稍后重试" };
  }
}

/**
 * 本地用户登录
 */
export async function loginLocalUser(
  username: string,
  password: string
): Promise<{ success: boolean; userId?: number; user?: any; error?: string }> {
  try {
    console.log("[Auth] Attempting login for username:", username);
    // 查询用户
    const user = await db.getUserByUsername(username);
    console.log("[Auth] User query result:", user ? "Found" : "Not found");
    if (!user) {
      console.warn("[Auth] User not found for username:", username);
      return { success: false, error: "用户名或密码错误" };
    }

    // 检查账户是否激活
    if (!user.isActive) {
      return { success: false, error: "账户已被禁用" };
    }

    // 检查密码
    if (!user.password) {
      return { success: false, error: "用户配置错误" };
    }

    const passwordMatch = await verifyPassword(password, user.password);
    if (!passwordMatch) {
      return { success: false, error: "用户名或密码错误" };
    }

    // 更新最后登录时间
    await db.updateUserLastSignedIn(user.id);

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;
    return {
      success: true,
      userId: user.id,
      user: userWithoutPassword,
    };
  } catch (error) {
    console.error("[Auth] Login failed:", error);
    return { success: false, error: "登录失败，请稍后重试" };
  }
}

/**
 * 通过ID获取用户
 */
export async function getUserById(userId: number) {
  try {
    const database = await db.getDb();
    if (!database) {
      return null;
    }

    const result = await database
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = result[0];
    return userWithoutPassword;
  } catch (error) {
    console.error("[Auth] Get user failed:", error);
    return null;
  }
}
