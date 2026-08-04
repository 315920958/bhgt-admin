import { serverConfig } from '@/config/servers'

/** token（AES-GCM 密文）在 localStorage 的读写 */
export function getToken(): string | null {
  return localStorage.getItem(serverConfig.authStorageKey)
}

export function setToken(token: string): void {
  localStorage.setItem(serverConfig.authStorageKey, token)
}

export function clearToken(): void {
  localStorage.removeItem(serverConfig.authStorageKey)
}
