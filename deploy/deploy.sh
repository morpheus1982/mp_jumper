#!/bin/bash
# MP Jumper 部署脚本
# 用于在 512 服务器上部署 Caddy + H5 页面

set -e

DEPLOY_DIR="/opt/docker/mp_jumper"
HTML_DIR="$DEPLOY_DIR/html"

echo "=== MP Jumper 部署脚本 ==="
echo ""

# 1. 创建目录
echo "[1/5] 创建目录..."
sudo mkdir -p "$HTML_DIR"
sudo mkdir -p "$DEPLOY_DIR/deploy"

# 2. 复制 HTML 文件
echo "[2/5] 复制 HTML 文件..."
sudo cp -r h5/* "$HTML_DIR/"

# 3. 复制部署配置
echo "[3/5] 复制部署配置..."
sudo cp deploy/Caddyfile "$DEPLOY_DIR/deploy/"
sudo cp deploy/docker-compose.yml "$DEPLOY_DIR/deploy/"

# 4. 停止旧容器
echo "[4/5] 停止旧容器..."
cd "$DEPLOY_DIR/deploy"
docker compose down 2>/dev/null || true

# 5. 启动新容器
echo "[5/5] 启动 Caddy 容器..."
docker compose up -d

echo ""
echo "=== 部署完成 ==="
echo ""
echo "HTTP 测试地址: http://<服务器IP>:60080/redirect.html?t=<encoded_url>"
echo "HTTPS 生产地址: https://www.512028.xyz/redirect.html?t=<encoded_url>"
echo ""
echo "查看日志: cd $DEPLOY_DIR/deploy && docker compose logs -f"
echo "重启服务: cd $DEPLOY_DIR/deploy && docker compose restart"
