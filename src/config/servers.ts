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
 * 资源基础地址（域名 + 可选 bucket 前缀）。
 * 数据库只存相对路径，拼接此地址得到完整可访问 URL。
 * 默认值对应阿里云 OSS 公网地址（bucket=bhgt-public-files，北京）。
 */
export const assetBaseUrl: string =
  import.meta.env.VITE_BHGT_ASSET_BASE_URL ||
  'https://oss-cn-beijing.aliyuncs.com/bhgt-public-files'
