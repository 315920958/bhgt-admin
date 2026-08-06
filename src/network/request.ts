import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { serverConfig } from '@/config/servers'
import { apiConfig, type ApiConfigItem, type ApiKey } from '@/config/api'
import { getToken, setToken, clearToken } from '@/network/token'
import { ApiError, type ApiResponseEnvelope, type RequestOptions } from '@/network/types'
import router from '@/router'

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

// 后端判定「未登录 / 登录失效」的统一处理：清 token 并跳登录页
// - 业务成功体带 errCode（如 10002 请先登录，HTTP 仍为 200）
// - 或 HTTP 401（鉴权拦截器直接返回）
const NOT_LOGGED_IN_ERRCODE = 10002

function redirectToLogin() {
  clearToken()
  if (router.currentRoute.value.name === 'Login') return
  router.push({ name: 'Login', replace: true })
}

// 响应拦截：拆 MESSAGE_BODY + 统一错误提示 + reject
client.interceptors.response.use(
  (response) => {
    const envelope = response.data as ApiResponseEnvelope<unknown>
    const silent = (response.config as RequestOptions & AxiosRequestConfig).silent
    if (envelope && envelope.errCode) {
      const message = envelope.message || '请求失败'
      if (!silent) ElMessage.error(message)
      // 未登录：清掉失效 token 并退回登录页
      if (envelope.errCode === NOT_LOGGED_IN_ERRCODE) {
        redirectToLogin()
      }
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
    const status = error?.response?.status
    const message = envelope?.message || error?.message || '网络错误'
    const silent = (error?.config as (RequestOptions & AxiosRequestConfig) | undefined)?.silent
    // HTTP 401：鉴权失败，清 token 跳登录
    if (status === 401) {
      redirectToLogin()
    }
    if (!silent) ElMessage.error(message)
    return Promise.reject(error)
  },
)

/**
 * 统一请求出口
 * - 业务只传接口 Key + 参数
 * - 返回的是信封里的 MESSAGE_BODY（已拆包）
 * - errCode 非 0 时抛 ApiError（已被全局弹窗提示）
 * - api.pathParams 里的字段会从 URL 的 :name 替换，并从 body/params 里剔除
 */
export async function request<T = unknown>(
  apiKey: ApiKey,
  data?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const api = apiConfig[apiKey] as ApiConfigItem

  // 1. 处理 pathParams：URL 占位符替换 + 从 body/params 里剔除
  let url = api.url
  let body: unknown = data
  if (api.pathParams && api.pathParams.length > 0 && body && typeof body === 'object') {
    const bodyObj = { ...(body as Record<string, unknown>) }
    for (const param of api.pathParams) {
      const value = bodyObj[param]
      if (value !== undefined && value !== null) {
        url = url.replace(`:${param}`, encodeURIComponent(String(value)))
        delete bodyObj[param]
      }
    }
    body = bodyObj
  }

  const axiosConfig: AxiosRequestConfig & RequestOptions = {
    url,
    method: api.method,
    timeout: api.timeout,
    params: api.method === 'get' ? body : undefined,
    data: api.method === 'get' ? undefined : body,
    silent: options.silent,
    ...options.axios,
  }
  return (await client.request(axiosConfig)) as T
}

export default request
