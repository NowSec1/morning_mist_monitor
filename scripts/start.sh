#!/bin/bash

# 启动脚本
# 用于 Docker 容器启动

set -e

echo "Starting Morning Mist Monitor System..."

# 等待数据库就绪
echo "Waiting for database to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if mysql -h "${DB_HOST:-mysql}" -u "${MYSQL_USER:-app_user}" -p"${MYSQL_PASSWORD:-app_password}" -e "SELECT 1" > /dev/null 2>&1; then
    echo "Database is ready!"
    break
  fi
  
  attempt=$((attempt + 1))
  echo "Attempt $attempt/$max_attempts: Waiting for database..."
  sleep 1
done

if [ $attempt -eq $max_attempts ]; then
  echo "Failed to connect to database after $max_attempts attempts"
  exit 1
fi

# 运行数据库迁移
echo "Running database migrations..."
pnpm db:push || true

# 启动应用
echo "Starting application..."
exec node dist/server/_core/index.js

