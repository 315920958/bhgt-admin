import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { serverConfig } from '@/config/servers'
import { apiConfig, type ApiKey } from '@/config/api'
import { getToken, setToken } from '@/network/token'
import { ApiError, type ApiResponseEnvelope, type RequestOptions } from '@/network/types'

const client: AxiosInstance = axios.create({
  baseURL: serverConfig.baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截：塞入 Authorization: Bearer <token>
client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// 响应拦截：拆 MESSAGE_BODY + 统一错误提示 + reject
client.interceptors.response.use(
  (response) => {
    const envelope = response.data as ApiResponseEnvelope<unknown>
    const silent = (response.config as RequestOptions & AxiosRequestConfig).silent
    if (envelope && envelope.errCode) {
      const message = envelope.message || '请求失败'
      if (!silent) ElMessage.error(message)
      throw new ApiError({ code: envelope.errCode, message, raw: envelope })
    }
    // 服务端在外层 auth 字段下发了新的 token（如 dev-login）→ 自动存入 localStorage
    if (envelope?.auth && typeof envelope.auth === 'string') {
      setToken(envelope.auth)
    }
    // 成功：返回外层包裹的 MESSAGE_BODY
    return (envelope?.MESSAGE_BODY ?? envelope) as unknown as typeof response
  },
  (error) => {
    const envelope = error?.response?.data as ApiResponseEnvelope<unknown> | undefined
    const message = envelope?.message || error?.message || '网络错误'
    const silent = (error?.config as (RequestOptions & AxiosRequestConfig) | undefined)?.silent
    if (!silent) ElMessage.error(message)
    return Promise.reject(error)
  },
)

/**
 * 统一请求出口
 * - 业务只传接口 Key + 参数
 * - 返回的是信封里的 MESSAGE_BODY（已拆包）
 * - errCode 非 0 时抛 ApiError（已被全局弹窗提示）
 */
export async function request<T = unknown>(
  apiKey: ApiKey,
  data?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const api = apiConfig[apiKey]
  const axiosConfig: AxiosRequestConfig & RequestOptions = {
    url: api.url,
    method: api.method,
    timeout: api.timeout,
    params: api.method === 'get' ? data : undefined,
    data: api.method === 'get' ? undefined : data,
    silent: options.silent,
    ...options.axios,
  }
  return (await client.request(axiosConfig)) as T
}

export default request
