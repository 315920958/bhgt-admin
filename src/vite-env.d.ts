/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BHGT_SERVER_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

