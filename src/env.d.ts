/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLAUDE_API_URL: string
  readonly VITE_CLAUDE_API_KEY: string
  readonly VITE_DEFAULT_MODEL: string
  readonly VITE_API_PROXY: string
  readonly VITE_LOGIN_USERNAME: string
  readonly VITE_LOGIN_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 