import { createApp } from 'vue';
import { VueQueryPlugin } from '@tanstack/vue-query';
import './style.css';
import App from './App.vue';
import router from './router';
import { vueKeycloak } from '@josempgon/vue-keycloak';
import { normalizePath } from '@/utils/path';

// Keycloak configuration from environment variables
const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL;
const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM;
const keycloakClientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

// Validate required environment variables
if (!keycloakUrl || !keycloakRealm || !keycloakClientId) {
  console.error('[vue-keycloak]: Missing required environment variables:', {
    keycloakUrl: !!keycloakUrl,
    keycloakRealm: !!keycloakRealm,
    keycloakClientId: !!keycloakClientId
  });
}

// Redirect URIs
const publicOrigin = window.location.origin;

// Silent SSO check
const silentCheckPathRaw = import.meta.env.VITE_KEYCLOAK_SILENT_CHECK_PATH ?? '/silent-check-sso.html';
const silentCheckPath = normalizePath(silentCheckPathRaw) || '/silent-check-sso.html';
const silentCheckSsoRedirectUri = `${publicOrigin}${silentCheckPath}`;

const app = createApp(App);

app
  .use(router)
  .use(VueQueryPlugin, {
    queryClientConfig: {
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60, // 1 minute
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    },
  })
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
      silentCheckSsoRedirectUri,
      checkLoginIframeInterval: 5,
      enableLogging: true,
      messageReceiveTimeout: 10000,
    },
  });

app.mount('#app');
