import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 环境变量文件加载约定：
  // - 仅 development 模式（npm start / npm run dev）读取 `.env.development.local`，
  //   该文件为本机私有覆盖（如连本地 bhgt-server 或测试域名），已加入 .gitignore，不进 git；
  // - build（production 模式）按 Vite 规则只读取 `.env.production(.local)`，
  //   不会读取 `.env.development.local`，避免本地调试配置泄漏到构建产物。
  const env = loadEnv(mode, process.cwd(), '')
  if (mode === 'development') {
    // 开发环境打印实际生效的服务端地址，便于确认已读到 .env.development.local
    console.log(`[bhgt-admin] development 模式，服务端地址 = ${env.VITE_BHGT_SERVER_URL}`)
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 4000,
    },
  }
})
