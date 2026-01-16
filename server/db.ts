import { eq, and, desc, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  monitoringLocations,
  weatherDataCache,
  fogPredictions,
  queryHistory,
  InsertMonitoringLocation,
  InsertWeatherDataCache,
  InsertFogPrediction,
  InsertQueryHistory,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * 用户相关查询
 */

/**
 * 通过Manus OpenID更新或创建用户（SSO用户）
 */
export async function upsertUser(user: Partial<InsertUser> & { openId: string; authType?: "local" | "manus" }): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const authType = user.authType || "manus";

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: any = {
      openId: user.openId,
      authType: authType,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

/**
 * 通过Manus OpenID查询用户
 */
export async function getUser(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 通过用户名查询本地用户
 */
export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  try {
    console.log("[Database] Querying user by username:", username);
    const result = await db.select().from(users).where(eq(users.username as any, username)).limit(1);
    console.log("[Database] Query result count:", result.length);
    if (result.length > 0) {
      console.log("[Database] User found:", { id: result[0].id, username: result[0].username });
    }
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Error querying user by username:", error);
    throw error;
  }
}

/**
 * 创建本地用户
 */
export async function createLocalUser(user: {
  username: string;
  password: string;
  email?: string;
  name?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(users).values({
    username: user.username,
    password: user.password,
    email: user.email || null,
    name: user.name || null,
    authType: "local",
    lastSignedIn: new Date(),
  } as any);

  // 查询新创建的用户以获取ID
  const result = await db.select().from(users).where(eq(users.username, user.username)).limit(1);
  if (result.length === 0) {
    throw new Error("Failed to create user");
  }
  return result[0].id;
}

/**
 * 更新用户最后登录时间
 */
export async function updateUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, userId));
}

/**
 * 监测地点相关查询
 */
export async function createMonitoringLocation(location: InsertMonitoringLocation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(monitoringLocations).values(location);
  return result;
}

export async function getUserMonitoringLocations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(monitoringLocations)
    .where(eq(monitoringLocations.userId, userId));
}

export async function getMonitoringLocation(locationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(monitoringLocations)
    .where(eq(monitoringLocations.id, locationId))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateMonitoringLocation(
  locationId: number,
  updates: Partial<Omit<InsertMonitoringLocation, 'userId'>>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(monitoringLocations)
    .set(updates)
    .where(eq(monitoringLocations.id, locationId));
}

export async function deleteMonitoringLocation(locationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .delete(monitoringLocations)
    .where(eq(monitoringLocations.id, locationId));
}

/**
 * 气象数据缓存相关查询
 */
export async function cacheWeatherData(data: InsertWeatherDataCache) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(weatherDataCache).values(data);
}

export async function getWeatherDataCache(
  locationId: number,
  startTime: Date,
  endTime: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(weatherDataCache)
    .where(
      and(
        eq(weatherDataCache.locationId, locationId),
        gte(weatherDataCache.timestamp, startTime)
      )
    )
    .orderBy(weatherDataCache.timestamp);
}

/**
 * 晨雾预测相关查询
 */
export async function createFogPrediction(prediction: InsertFogPrediction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(fogPredictions).values(prediction);
}

export async function getFogPrediction(locationId: number, forecastDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startOfDay = new Date(forecastDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(forecastDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  const result = await db
    .select()
    .from(fogPredictions)
    .where(
      and(
        eq(fogPredictions.locationId, locationId),
        gte(fogPredictions.forecastDate, startOfDay)
      )
    )
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function getLocationFogPredictions(locationId: number, days: number = 7) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await db
    .select()
    .from(fogPredictions)
    .where(
      and(
        eq(fogPredictions.locationId, locationId),
        gte(fogPredictions.forecastDate, startDate)
      )
    )
    .orderBy(desc(fogPredictions.forecastDate));
}

/**
 * 查询历史相关查询
 */
export async function recordQueryHistory(history: InsertQueryHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(queryHistory).values(history);
}

export async function getUserQueryHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(queryHistory)
    .where(eq(queryHistory.userId, userId))
    .orderBy(desc(queryHistory.createdAt))
    .limit(limit);
}
