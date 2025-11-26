/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string
  readonly VITE_KEYCLOAK_URL?: string
  readonly VITE_KEYCLOAK_REALM: string
  readonly VITE_KEYCLOAK_CLIENT_ID: string
  readonly VITE_KEYCLOAK_REDIRECT_PATH: string
  readonly VITE_TWIN_API_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
