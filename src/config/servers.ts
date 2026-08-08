/**
 * 服务端 host 配置（统一管理）
 * - host 来自环境变量 VITE_BHGT_SERVER_URL，未配置时兜底本地 4001
 * - authStorageKey 为 token（AES-GCM 密文）在 localStorage 中的存储键
 */
export const serverConfig = {
  baseURL: import.meta.env.VITE_BHGT_SERVER_URL || 'http://localhost:4001',
  authStorageKey: 'bhgt-admin:auth',
} as const

/**
 * 阿里云 OSS 资源域名（三级域名形式 bucket.endpoint）。
 * 数据库只存相对路径（如 /cg/x.png），拼接此域名得到完整可访问 URL。
 * 默认值为 OSS 公网地址（bucket=bhgt-public-files，北京）。
 */
export const ossDomain: string =
  import.meta.env.VITE_BHGT_OSS_DOMAIN ||
  'https://bhgt-public-files.oss-cn-beijing.aliyuncs.com'
