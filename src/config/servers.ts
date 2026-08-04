/**
 * 服务端 host 配置（统一管理）
 * - host 来自环境变量 VITE_BHGT_SERVER_URL，未配置时兜底本地 4001
 * - authStorageKey 为 token（AES-GCM 密文）在 localStorage 中的存储键
 */
export const serverConfig = {
  baseURL: import.meta.env.VITE_BHGT_SERVER_URL || 'http://localhost:4001',
  authStorageKey: 'bhgt-admin:auth',
} as const
