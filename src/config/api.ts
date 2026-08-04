export type ApiMethod = 'get' | 'post' | 'put' | 'delete'

export interface ApiConfigItem {
  url: string
  method: ApiMethod
  timeout?: number
}

/**
 * 接口注册表（统一管理 url / method / timeout）
 * 业务侧只调用 request('API_KEY', data)，不直接写 url
 */
export const apiConfig = {
  HEALTH: { url: '/api', method: 'get' },
  DEV_LOGIN: { url: '/api/auth/dev-login', method: 'post' },
} as const satisfies Record<string, ApiConfigItem>

export type ApiKey = keyof typeof apiConfig
