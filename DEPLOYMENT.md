# 晨雾监测系统 - 部署指南

## 系统要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB 内存
- 至少 10GB 磁盘空间

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd morning_mist_monitor
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下关键变量：

```env
# 数据库配置
DATABASE_URL=mysql://app_user:app_password@mysql:3306/morning_mist
MYSQL_ROOT_PASSWORD=secure_password_here
MYSQL_PASSWORD=app_password_here

# Manus OAuth
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# JWT 密钥（生产环境必须更改）
JWT_SECRET=your-very-secure-random-key-here

# 应用信息
VITE_APP_TITLE=晨雾监测系统
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Name

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
```

### 3. 启动应用

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down
```

### 4. 访问应用

应用将在以下地址可用：
- HTTP: http://localhost:80
- HTTPS: https://localhost:443（如果配置了SSL）

## 详细配置

### 数据库配置

#### MySQL 初始化

项目会自动创建数据库和表。如需自定义初始化，编辑 `init.sql` 文件。

#### 数据库备份

```bash
# 备份数据库
docker-compose exec mysql mysqldump -u app_user -p morning_mist > backup.sql

# 恢复数据库
docker-compose exec -T mysql mysql -u app_user -p morning_mist < backup.sql
```

### SSL/TLS 配置

#### 使用 Let's Encrypt

```bash
# 生成证书
certbot certonly --standalone -d your-domain.com

# 复制证书到 ssl 目录
mkdir -p ssl
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
```

#### 启用 HTTPS

编辑 `nginx.conf`，取消注释以下行：

```nginx
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
```

然后重启 Nginx：

```bash
docker-compose restart nginx
```

### 性能优化

#### 调整 Worker 进程

编辑 `nginx.conf`：

```nginx
worker_processes auto;  # 自动检测 CPU 核心数
```

#### 调整连接数

编辑 `nginx.conf`：

```nginx
events {
    worker_connections 2048;  # 根据需要调整
}
```

#### 启用缓存

编辑 `nginx.conf`，已默认启用 Gzip 压缩和静态文件缓存。

### 监控和日志

#### 查看应用日志

```bash
docker-compose logs -f app
```

#### 查看 Nginx 日志

```bash
docker-compose logs -f nginx
```

#### 查看 MySQL 日志

```bash
docker-compose logs -f mysql
```

#### 访问日志文件

```bash
# 应用日志
docker-compose exec app cat logs/app.log

# Nginx 日志
docker-compose exec nginx cat /var/log/nginx/access.log
```

### 健康检查

所有服务都配置了健康检查：

```bash
# 检查服务状态
docker-compose ps

# 手动检查应用健康状态
curl http://localhost:3000/health

# 手动检查 Nginx 健康状态
curl http://localhost/health
```

## 生产部署

### 安全建议

1. **更改默认密码**
   - 更改 MySQL root 密码
   - 更改 JWT_SECRET
   - 更改 app_user 密码

2. **启用 HTTPS**
   - 配置 SSL 证书
   - 启用 HTTP 到 HTTPS 重定向

3. **配置防火墙**
   - 只开放必要的端口（80, 443）
   - 限制数据库访问

4. **定期备份**
   - 每天备份数据库
   - 备份应用配置文件

5. **监控和告警**
   - 监控服务健康状态
   - 设置日志告警

### 扩展部署

#### 使用 Docker Swarm

```bash
# 初始化 Swarm
docker swarm init

# 部署服务
docker stack deploy -c docker-compose.yml morning_mist
```

#### 使用 Kubernetes

```bash
# 创建命名空间
kubectl create namespace morning-mist

# 部署应用
kubectl apply -f k8s/ -n morning-mist
```

### 更新应用

```bash
# 拉取最新代码
git pull origin main

# 重建镜像
docker-compose build --no-cache

# 重启服务
docker-compose up -d
```

## 故障排除

### 应用无法启动

```bash
# 查看详细日志
docker-compose logs app

# 检查数据库连接
docker-compose exec app node -e "require('mysql2').createConnection({host:'mysql',user:'app_user',password:'app_password'}).connect()"
```

### 数据库连接错误

```bash
# 检查 MySQL 服务状态
docker-compose ps mysql

# 检查 MySQL 日志
docker-compose logs mysql

# 重启 MySQL
docker-compose restart mysql
```

### Nginx 配置错误

```bash
# 验证 Nginx 配置
docker-compose exec nginx nginx -t

# 重新加载 Nginx 配置
docker-compose exec nginx nginx -s reload
```

### 端口被占用

```bash
# 查找占用端口的进程
lsof -i :80
lsof -i :443
lsof -i :3306

# 修改 docker-compose.yml 中的端口映射
```

## 备份和恢复

### 完整备份

```bash
#!/bin/bash
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose exec -T mysql mysqldump -u app_user -p morning_mist > $BACKUP_DIR/db_$TIMESTAMP.sql

# 备份应用配置
tar -czf $BACKUP_DIR/config_$TIMESTAMP.tar.gz .env nginx.conf

echo "Backup completed: $BACKUP_DIR"
```

### 恢复备份

```bash
#!/bin/bash
BACKUP_FILE=$1

# 恢复数据库
docker-compose exec -T mysql mysql -u app_user -p morning_mist < $BACKUP_FILE

echo "Database restored from $BACKUP_FILE"
```

## 许可证

MIT License

## 支持

如有问题，请提交 Issue 或联系技术支持。

