#!/bin/bash

# 健康检查脚本
# 用于 Docker 健康检查

set -e

# 检查应用是否响应
if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
  echo "Application health check failed"
  exit 1
fi

# 检查数据库连接
if ! node -e "
  const mysql = require('mysql2/promise');
  mysql.createConnection({
    host: 'localhost',
    user: process.env.MYSQL_USER || 'app_user',
    password: process.env.MYSQL_PASSWORD || 'app_password',
    database: process.env.MYSQL_DATABASE || 'morning_mist'
  }).then(() => {
    console.log('Database connection OK');
    process.exit(0);
  }).catch(err => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
" > /dev/null 2>&1; then
  echo "Database health check failed"
  exit 1
fi

echo "All health checks passed"
exit 0

