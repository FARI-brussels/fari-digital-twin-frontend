import { createApp } from 'vue';
import { VueQueryPlugin } from '@tanstack/vue-query';
import './style.css';
import App from './App.vue';
import router from './router';
import { vueKeycloak } from '@josempgon/vue-keycloak';

// Keycloak configuration from environment variables
const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL;
const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM;
const keycloakClientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

// Validate required environment variables
if (!keycloakUrl || !keycloakRealm || !keycloakClientId) {
  console.error('[vue-keycloak]: Missing required environment variables:', {
    keycloakUrl: !!keycloakUrl,
    keycloakRealm: !!keycloakRealm,
    keycloakClientId: !!keycloakClientId,
  });
}

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
      responseMode: 'fragment',
      pkceMethod: 'S256',
      checkLoginIframe: false,
      checkLoginIframeInterval: 5,
      enableLogging: true,
      messageReceiveTimeout: 10000,
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    },
  });

app.mount('#app');
