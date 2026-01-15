-- 晨雾监测系统 - 数据库初始化脚本

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS morning_mist DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE morning_mist;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE,
  username VARCHAR(64) UNIQUE,
  password TEXT,
  name TEXT,
  email VARCHAR(320),
  authType ENUM('local', 'manus') NOT NULL,
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
  isActive BOOLEAN DEFAULT true NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_openId (openId),
  INDEX idx_username (username),
  INDEX idx_authType (authType),
  INDEX idx_role (role),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 监测地点表
CREATE TABLE IF NOT EXISTS locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 6) NOT NULL,
  longitude DECIMAL(10, 6) NOT NULL,
  altitude INT DEFAULT 0,
  timezone VARCHAR(64) DEFAULT 'Asia/Shanghai',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_coordinates (latitude, longitude),
  UNIQUE KEY unique_user_location (userId, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 气象数据缓存表
CREATE TABLE IF NOT EXISTS weather_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  locationId INT NOT NULL,
  latitude DECIMAL(10, 6) NOT NULL,
  longitude DECIMAL(10, 6) NOT NULL,
  date DATE NOT NULL,
  weatherData JSON NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  FOREIGN KEY (locationId) REFERENCES locations(id) ON DELETE CASCADE,
  INDEX idx_locationId (locationId),
  INDEX idx_date (date),
  INDEX idx_expiresAt (expiresAt),
  UNIQUE KEY unique_location_date (locationId, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 晨雾预测结果表
CREATE TABLE IF NOT EXISTS fog_predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  locationId INT NOT NULL,
  date DATE NOT NULL,
  sunriseTime DATETIME NOT NULL,
  blueHourStart DATETIME NOT NULL,
  blueHourEnd DATETIME NOT NULL,
  goldenHourStart DATETIME NOT NULL,
  goldenHourEnd DATETIME NOT NULL,
  radiationFogProbability DECIMAL(5, 2) NOT NULL,
  advectionFogProbability DECIMAL(5, 2) NOT NULL,
  overallFogProbability DECIMAL(5, 2) NOT NULL,
  riskLevel ENUM('low', 'medium', 'high') NOT NULL,
  predictionData JSON NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (locationId) REFERENCES locations(id) ON DELETE CASCADE,
  INDEX idx_locationId (locationId),
  INDEX idx_date (date),
  INDEX idx_riskLevel (riskLevel),
  UNIQUE KEY unique_location_date (locationId, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 查询历史表
CREATE TABLE IF NOT EXISTS query_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  locationId INT,
  queryType VARCHAR(64) NOT NULL,
  queryData JSON,
  resultData JSON,
  executionTime INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (locationId) REFERENCES locations(id) ON DELETE SET NULL,
  INDEX idx_userId (userId),
  INDEX idx_locationId (locationId),
  INDEX idx_queryType (queryType),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建初始管理员用户（可选）
-- INSERT INTO users (openId, name, email, role) VALUES 
-- ('admin-open-id', 'Administrator', 'admin@example.com', 'admin')
-- ON DUPLICATE KEY UPDATE role = 'admin';

-- 创建示例地点（可选）
-- INSERT INTO locations (userId, name, latitude, longitude, altitude, timezone) VALUES 
-- (1, '高新-丈八一路', 34.207012, 108.860019, 380, 'Asia/Shanghai')
-- ON DUPLICATE KEY UPDATE altitude = 380;

-- 创建索引以提高查询性能
CREATE INDEX idx_weather_cache_location_date ON weather_cache(locationId, date);
CREATE INDEX idx_fog_predictions_location_date ON fog_predictions(locationId, date);
CREATE INDEX idx_query_history_user_date ON query_history(userId, createdAt);

-- 设置表注释
ALTER TABLE users COMMENT='系统用户表';
ALTER TABLE locations COMMENT='监测地点表';
ALTER TABLE weather_cache COMMENT='气象数据缓存表';
ALTER TABLE fog_predictions COMMENT='晨雾预测结果表';
ALTER TABLE query_history COMMENT='查询历史表';

