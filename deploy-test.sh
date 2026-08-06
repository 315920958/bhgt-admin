#!/usr/bin/env bash
#
# deploy-test.sh — bhgt-admin 测试环境部署（在服务器运行）
#
# test = 线上 dev。前端请求地址固定为 https://develop.server.bhgt.sixonehub.site
#
# 用法：
#   ./deploy-test.sh
#
set -euo pipefail

BRANCH="test"
API_URL="https://develop.server.bhgt.sixonehub.site"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> [bhgt-admin:test] 部署目录: $SCRIPT_DIR"
cd "$SCRIPT_DIR"

# 0. 切到 test 分支并拉取最新（幂等：已在 test 也不会出错，强制对齐远端）
echo "==> 拉取并切换到 $BRANCH 分支"
git fetch origin
git checkout -B "$BRANCH" "origin/$BRANCH"

# 1. 写入前端运行时配置（构建时烤进 dist；.env.production 已随 test 分支进 git，这里再写一遍保持一致）
#    VITE_BHGT_SERVER_URL = 前端请求的服务端地址
#    VITE_APP_ENV = 标记部署环境，供前端判断是否显示 dev 登录等开发态 UI
cat > .env.production <<EOF
VITE_BHGT_SERVER_URL=$API_URL
VITE_APP_ENV=test
EOF

# 2. 安装依赖（走国内镜像更快）
echo "==> 安装依赖"
npm install --registry=https://registry.npmmirror.com --no-audit --no-fund --ignore-scripts

# 3. 重新打包（vue-tsc 类型检查 + vite build）
echo "==> 构建"
npm run build

echo "==> 构建完成，dist/ 由 nginx 静态托管"
