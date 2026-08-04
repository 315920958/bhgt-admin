import type { AxiosRequestConfig } from 'axios'
import type { ApiKey } from '@/config/api'

export interface RequestOptions {
  /** 为 true 时不自动弹错误提示，由业务自行 catch 处理 */
  silent?: boolean
  /** 透传给 axios 的额外配置 */
  axios?: AxiosRequestConfig
}

/** 后端统一响应信封：{ MESSAGE_BODY, errCode, message, auth, user } */
export interface ApiResponseEnvelope<T = unknown> {
  errCode?: number
  message?: string
  MESSAGE_BODY?: T
  auth?: unknown
  user?: unknown
}

/** 统一的业务异常，携带后端 errCode */
export class ApiError extends Error {
  readonly code?: number
  readonly raw: unknown
  readonly apiKey?: ApiKey
  constructor(params: { code?: number; message: string; raw: unknown; apiKey?: ApiKey }) {
    super(params.message)
    this.name = 'ApiError'
    this.code = params.code
    this.raw = params.raw
    this.apiKey = params.apiKey
  }
}
