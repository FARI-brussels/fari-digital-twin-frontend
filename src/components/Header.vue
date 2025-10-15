<script setup>
import { computed } from 'vue';
import { useKeycloak } from '@josempgon/vue-keycloak';
import { Button } from '@/components/ui/button';
import FariLogo from '@/assets/FariLogo.vue';

const {
  keycloak,
  isAuthenticated,
  isPending,
  decodedToken,
  username,
} = useKeycloak();

const publicOrigin = window.location.origin;

const normalizePath = (value) => {
  if (!value || value === '/') {
    return '';
  }
  return value.startsWith('/') ? value : `/${value}`;
};

const normalizedLoginPath = normalizePath(import.meta.env.VITE_KEYCLOAK_REDIRECT_PATH ?? '/callback');
const keycloakRedirectUri = `${publicOrigin}${normalizedLoginPath}`;

const logoutSetting = import.meta.env.VITE_KEYCLOAK_LOGOUT_REDIRECT_PATH;
const normalizedLogoutPath = logoutSetting === undefined
  ? normalizedLoginPath
  : logoutSetting?.toLowerCase() === 'none'
    ? null
    : normalizePath(logoutSetting);
const logoutRedirectUri = normalizedLogoutPath === null
  ? null
  : `${publicOrigin}${normalizedLogoutPath}`;

const displayName = computed(() => {
  const kc = keycloak.value;
  const tokenPayload = decodedToken.value || kc?.tokenParsed;
  return (
    tokenPayload?.name ||
    tokenPayload?.preferred_username ||
    username.value ||
    ''
  );
});

const handleLogin = () => {
  keycloak.value?.login({ redirectUri: keycloakRedirectUri });
};

const handleRegister = () => {
  keycloak.value?.register({ redirectUri: keycloakRedirectUri });
};

const handleLogout = () => {
  if (logoutRedirectUri) {
    keycloak.value?.logout({ redirectUri: logoutRedirectUri });
  } else {
    keycloak.value?.logout();
  }
};
</script>

<template>
  <div class="flex flex-row w-full items-center justify-between py-4 px-6 text-white bg-blue-700">
    <router-link to="/">
      <FariLogo />
    </router-link>
    <div class="flex items-center gap-3">
      <Button variant="ghost" as-child class="text-white hover:bg-white/10 hover:text-white">
        <RouterLink to="/doc">
          API doc
        </RouterLink>
      </Button>
      <template v-if="!isAuthenticated">
        <Button variant="ghost" class="text-white hover:bg-white/10 hover:text-white" :disabled="isPending"
                @click="handleRegister">
          Register
        </Button>
        <Button variant="secondary" class="bg-white text-blue-800 hover:bg-gray-100" :disabled="isPending"
                @click="handleLogin">
          <span v-if="isPending">Connecting...</span>
          <span v-else>Sign in</span>
        </Button>
      </template>
      <template v-else>
        <span class="text-white text-sm font-medium">Username : {{ displayName || 'Authenticated' }}</span>
        <Button variant="ghost" class="text-white hover:bg-white/10 hover:text-white" @click="handleLogout">
          Sign out
        </Button>
      </template>
    </div>
  </div>
</template>
