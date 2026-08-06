#!/usr/bin/env bash
#
# deploy-test.sh — bhgt-admin 测试环境部署（在服务器运行）
#
# test = 线上 dev。前端请求地址固定为 http://develop.server.bhgt.sixonehub.site（server 仅 80 端口，无 TLS）
#
# 用法：
#   ./deploy-test.sh              # 不安装依赖（默认）
#   ./deploy-test.sh install      # 安装依赖（首次部署或依赖变更时）
#   也可写 ./deploy-test.sh --install-deps 或 -i
#
set -euo pipefail

BRANCH="test"
API_URL="http://develop.server.bhgt.sixonehub.site"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> [bhgt-admin:test] 部署目录: $SCRIPT_DIR"
cd "$SCRIPT_DIR"

# 参数：第一个参数为 install / --install-deps / -i 时安装依赖，否则跳过（默认跳过）
INSTALL_DEPS=0
case "${1:-}" in
  install|--install-deps|-i) INSTALL_DEPS=1 ;;
esac

# 0. 切到 test 分支并拉取最新（强制对齐远端，丢弃本地未提交改动/残留文件，确保一定切到最新）
echo "==> 拉取并切换到 $BRANCH 分支"
git fetch origin
git checkout -f -B "$BRANCH" "origin/$BRANCH"

# 1. 前端运行时配置（构建时烤进 dist）
#    .env.test 已随 test 分支进 git 并被跟踪——优先使用仓库版本：
#    以后改域名只需提交 .env.test，服务端 git 即可拿到最新，不必改本脚本。
#    仅当文件缺失时，才按下方默认值生成，避免覆盖 git 中的最新配置。
if [ ! -f .env.test ]; then
cat > .env.test <<EOF
VITE_BHGT_SERVER_URL=$API_URL
VITE_APP_ENV=test
EOF
echo "==> .env.test 缺失，已按默认值生成"
else
echo "==> 使用 git 跟踪的 .env.test（VITE_BHGT_SERVER_URL=$(grep '^VITE_BHGT_SERVER_URL=' .env.test | cut -d= -f2-)）"
fi

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
