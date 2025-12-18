# 晨雾监测系统 - Docker 快速启动指南

## 📋 前置要求

- **Docker** 20.10 或更高版本
- **Docker Compose** 2.0 或更高版本
- **至少 2GB 内存**
- **至少 10GB 磁盘空间**

### 安装 Docker

#### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

#### macOS
```bash
# 使用 Homebrew
brew install docker docker-compose

# 或下载 Docker Desktop
# https://www.docker.com/products/docker-desktop
```

#### Windows
下载并安装 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

## 🚀 一键启动

### Linux/macOS

```bash
# 1. 克隆项目
git clone <repository-url>
cd morning_mist_monitor

# 2. 使用启动脚本（推荐）
chmod +x start.sh
./start.sh up

# 或手动启动
docker-compose up -d
```

### Windows

```bash
# 1. 克隆项目
git clone <repository-url>
cd morning_mist_monitor

# 2. 使用启动脚本
start.bat up

# 或手动启动
docker-compose up -d
```

## ⚙️ 配置环境变量

### 自动配置（推荐）

启动脚本会自动从 `.env.example` 创建 `.env` 文件：

```bash
./start.sh up  # 自动创建 .env 文件
```

### 手动配置

```bash
# 复制示例配置
cp .env.example .env

# 编辑 .env 文件，配置以下关键变量
```

### 必需的环境变量

```env
# 数据库配置
DATABASE_URL=mysql://app_user:app_password@mysql:3306/morning_mist
MYSQL_ROOT_PASSWORD=secure_root_password
MYSQL_PASSWORD=app_password

# Manus OAuth 配置（从 Manus 获取）
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# JWT 密钥（生产环境必须更改为强密钥）
JWT_SECRET=your-very-secure-random-key-change-in-production

# 应用信息
VITE_APP_TITLE=晨雾监测系统
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Name

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
```

## 📱 访问应用

启动后，应用可在以下地址访问：

- **HTTP**: http://localhost:80
- **直接应用**: http://localhost:3000
- **数据库**: localhost:3306 (MySQL)

## 🛠️ 常用命令

### 使用启动脚本

```bash
# 启动服务
./start.sh up

# 停止服务
./start.sh down

# 重启服务
./start.sh restart

# 查看日志
./start.sh logs

# 查看服务状态
./start.sh status
```

### 直接使用 Docker Compose

```bash
# 启动服务（后台运行）
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f app

# 查看服务状态
docker-compose ps

# 进入应用容器
docker-compose exec app bash

# 进入数据库容器
docker-compose exec mysql bash
```

## 📊 监控和日志

### 查看日志

```bash
# 查看应用日志
docker-compose logs -f app

# 查看 Nginx 日志
docker-compose logs -f nginx

# 查看 MySQL 日志
docker-compose logs -f mysql

# 查看所有日志
docker-compose logs -f
```

### 检查服务状态

```bash
# 查看容器状态
docker-compose ps

# 检查应用健康状态
curl http://localhost:3000

# 检查 Nginx 状态
curl http://localhost
```

## 🔧 常见问题

### 问题：端口已被占用

**症状**: `Error response from daemon: Ports are not available`

**解决方案**:
```bash
# 修改 docker-compose.yml 中的端口映射
# 例如，将 80:80 改为 8080:80
nano docker-compose.yml

# 或停止占用端口的服务
lsof -i :80  # 查看占用 80 端口的进程
kill -9 <PID>
```

### 问题：数据库连接失败

**症状**: `Error: connect ECONNREFUSED 127.0.0.1:3306`

**解决方案**:
```bash
# 检查 MySQL 容器状态
docker-compose ps mysql

# 查看 MySQL 日志
docker-compose logs mysql

# 重启 MySQL
docker-compose restart mysql

# 等待 MySQL 完全启动
sleep 10
docker-compose logs mysql | grep "ready for connections"
```

### 问题：应用无法启动

**症状**: 应用容器不断重启

**解决方案**:
```bash
# 查看详细日志
docker-compose logs app

# 检查环境变量是否正确
cat .env

# 检查数据库连接
docker-compose exec app node -e "console.log(process.env.DATABASE_URL)"
```

### 问题：Nginx 配置错误

**症状**: `502 Bad Gateway` 或 `Connection refused`

**解决方案**:
```bash
# 验证 Nginx 配置
docker-compose exec nginx nginx -t

# 重新加载 Nginx 配置
docker-compose exec nginx nginx -s reload

# 查看 Nginx 日志
docker-compose logs nginx
```

## 🔐 生产部署建议

### 1. 更改默认密码

```bash
# 编辑 .env 文件
nano .env

# 更改以下密码为强密码
MYSQL_ROOT_PASSWORD=your-secure-root-password
MYSQL_PASSWORD=your-secure-app-password
JWT_SECRET=your-very-secure-random-key
```

### 2. 启用 HTTPS

```bash
# 生成 SSL 证书（使用 Let's Encrypt）
certbot certonly --standalone -d your-domain.com

# 复制证书到 ssl 目录
mkdir -p ssl
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem

# 重启 Nginx
docker-compose restart nginx
```

### 3. 配置防火墙

```bash
# 仅开放必要的端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 4. 定期备份

```bash
# 备份数据库
docker-compose exec -T mysql mysqldump -u app_user -p morning_mist > backup_$(date +%Y%m%d).sql

# 备份应用配置
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env nginx.conf
```

### 5. 监控和告警

```bash
# 定期检查服务状态
docker-compose ps

# 查看资源使用情况
docker stats

# 设置日志告警（可选）
docker-compose logs app | grep ERROR
```

## 📦 更新应用

```bash
# 拉取最新代码
git pull origin main

# 重建镜像（不使用缓存）
docker-compose build --no-cache

# 重启服务
docker-compose up -d

# 验证更新
docker-compose ps
```

## 🧹 清理资源

```bash
# 停止并删除容器
docker-compose down

# 删除未使用的镜像
docker image prune -a

# 删除未使用的卷
docker volume prune

# 完全清理（谨慎操作）
docker-compose down -v  # 删除所有卷，包括数据库数据
```

## 📚 更多信息

详细的部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🆘 获取帮助

如遇到问题，请：

1. 查看日志：`docker-compose logs -f`
2. 检查配置：`cat .env`
3. 验证服务状态：`docker-compose ps`
4. 查看详细文档：[DEPLOYMENT.md](./DEPLOYMENT.md)

## 📄 许可证

MIT License
