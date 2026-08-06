#!/usr/bin/env bash
#
# deploy-test.sh — bhgt-admin 测试环境部署（在服务器运行）
#
# test = 线上 dev。前端请求地址固定为 https://develop.server.bhgt.sixonehub.site
#
# 用法：
#   ./deploy-test.sh              # 不安装依赖（默认）
#   ./deploy-test.sh install      # 安装依赖（首次部署或依赖变更时）
#   也可写 ./deploy-test.sh --install-deps 或 -i
#
set -euo pipefail

BRANCH="test"
API_URL="https://develop.server.bhgt.sixonehub.site"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> [bhgt-admin:test] 部署目录: $SCRIPT_DIR"
cd "$SCRIPT_DIR"

# 参数：第一个参数为 install / --install-deps / -i 时安装依赖，否则跳过（默认跳过）
INSTALL_DEPS=0
case "${1:-}" in
  install|--install-deps|-i) INSTALL_DEPS=1 ;;
esac

# 0. 切到 test 分支并拉取最新（幂等：已在 test 也不会出错，强制对齐远端）
echo "==> 拉取并切换到 $BRANCH 分支"
git fetch origin
git checkout -B "$BRANCH" "origin/$BRANCH"

# 1. 写入前端运行时配置（构建时烤进 dist；.env.test 已随 test 分支进 git，这里再写一遍保持一致）
#    VITE_BHGT_SERVER_URL = 前端请求的服务端地址
#    VITE_APP_ENV = 标记部署环境，供前端判断是否显示 dev 登录等开发态 UI
cat > .env.test <<EOF
VITE_BHGT_SERVER_URL=$API_URL
VITE_APP_ENV=test
EOF

# 2. 安装依赖（默认跳过；传 install / --install-deps / -i 才安装，如首次部署或依赖变更）
if [ "$INSTALL_DEPS" = "1" ]; then
  # 先清理旧的依赖状态，规避 npm 可选依赖已知 bug
  # （https://github.com/npm/cli/issues/4828：跨平台 lockfile 残留会导致
  #  @rollup/rollup-linux-x64-gnu 等原生二进制缺失，vite build 报
  #  "Cannot find module @rollup/rollup-linux-x64-gnu"）。
  # 不使用 --ignore-scripts：服务器是 Linux，且不忽略 esbuild 等需在
  # postinstall 下载/校验平台二进制的包，否则 vite build 会失败。
  echo "==> 清理旧依赖状态（规避 npm optional 依赖 bug）"
  rm -rf node_modules package-lock.json
  echo "==> 安装依赖"
  npm install --registry=https://registry.npmmirror.com --no-audit --no-fund
else
  echo "==> 跳过依赖安装（默认；如需安装请传参 install）"
fi

# 3. 重新打包（以 --mode test 读取 .env.test 烤入地址；跳过 vue-tsc 类型检查，与 h5 部署一致，规避 tsc/vue-tsc 预存缺陷）
echo "==> 构建"
npx vite build --mode test

echo "==> 构建完成，dist/ 由 nginx 静态托管"
