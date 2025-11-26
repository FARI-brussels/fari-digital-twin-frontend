import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { vueKeycloak } from '@josempgon/vue-keycloak'

//TODO remove default values and make a example .env file

const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || 'https://keycloak.digitaltwin.brussels/'
const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM || 'master'
const keycloakClientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'front'
const publicOrigin = window.location.origin
const rawRedirectPath = import.meta.env.VITE_KEYCLOAK_REDIRECT_PATH ?? '/callback'
const redirectPath = !rawRedirectPath || rawRedirectPath === '/'
  ? ''
  : rawRedirectPath.startsWith('/')
    ? rawRedirectPath
    : `/${rawRedirectPath}`
const keycloakRedirectUri = `${publicOrigin}${redirectPath}`
const silentCheckPathRaw = import.meta.env.VITE_KEYCLOAK_SILENT_CHECK_PATH || '/silent-check-sso.html'
const silentCheckPath = silentCheckPathRaw.startsWith('/') ? silentCheckPathRaw : `/${silentCheckPathRaw}`

const app = createApp(App)

app
  .use(router)
  .use(vueKeycloak, {
    config: {
      url: keycloakUrl,
      realm: keycloakRealm,
      clientId: keycloakClientId,
    },
    initOptions: {
      onLoad: 'check-sso',
      flow: 'standard',
      checkLoginIframe: false,
      silentCheckSsoRedirectUri: `${publicOrigin}${silentCheckPath}`,
    },
  })

app.mount('#app')
