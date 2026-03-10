# MP Jumper 部署说明

## 服务器要求

- Docker & Docker Compose
- 端口开放: 60080 (HTTP测试), 443 (HTTPS), 80 (SSL验证)
- DNS 解析: www.512028.xyz → 服务器 IP

## 快速部署

### 方式一：使用部署脚本（推荐）

```bash
# 在项目根目录执行
./deploy/deploy.sh
```

### 方式二：手动部署

```bash
# 1. 在服务器上创建目录
sudo mkdir -p /opt/docker/mp_jumper/html
sudo mkdir -p /opt/docker/mp_jumper/deploy

# 2. 上传文件到服务器
scp -r h5/* user@512:/opt/docker/mp_jumper/html/
scp deploy/Caddyfile.simple user@512:/opt/docker/mp_jumper/deploy/Caddyfile
scp deploy/docker-compose.yml user@512:/opt/docker/mp_jumper/deploy/

# 3. 启动服务
cd /opt/docker/mp_jumper/deploy
docker compose up -d
```

## SSL 证书配置

### 方式一：HTTP-01 验证（默认，简单）

使用 `Caddyfile.simple`，要求：
- DNS 已解析到服务器
- 80 端口可从公网访问

### 方式二：DNS-01 验证（Cloudflare）

如果域名使用 Cloudflare DNS：

```bash
# 1. 获取 Cloudflare API Token（需要 Zone.DNS 权限）
# 2. 设置环境变量
export CLOUDFLARE_API_TOKEN="your_token_here"

# 3. 使用带 DNS 验证的 Caddyfile
cp deploy/Caddyfile deploy/Caddyfile.cloudflare
```

## 验证部署

```bash
# HTTP 测试
curl http://localhost:60080/redirect.html

# 查看日志
cd /opt/docker/mp_jumper/deploy
docker compose logs -f caddy

# 检查 SSL 证书
curl -v https://www.512028.xyz/redirect.html 2>&1 | grep -E "(SSL|certificate)"
```

## 常用命令

```bash
# 重启服务
docker compose restart

# 重新加载配置（不中断服务）
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile

# 查看证书状态
docker compose exec caddy caddy list-certificates

# 强制更新证书
docker compose exec caddy caddy reload --force
```

## 文件结构

```
/opt/docker/mp_jumper/
├── html/
│   ├── redirect.html      # 主跳转页面
│   └── whitelist.json     # 域名白名单
└── deploy/
    ├── Caddyfile          # Caddy 配置
    └── docker-compose.yml # Docker 编排
```
