<script setup lang="ts">
import { computed } from 'vue';
import { useKeycloak } from '@josempgon/vue-keycloak';
import { Button } from '@/components/ui/button';
import FariLogo from '@/assets/FariLogo.vue';
import { buildRedirectUri, getLogoutRedirectUri } from '@/utils/path';
import type { KeycloakTokenParsed } from '@/types';

const { keycloak, isAuthenticated, isPending, decodedToken, username } = useKeycloak();

const publicOrigin = window.location.origin;
const loginRedirectPath = import.meta.env.VITE_KEYCLOAK_REDIRECT_PATH ?? '/callback';
const keycloakRedirectUri = buildRedirectUri(publicOrigin, loginRedirectPath);

const logoutRedirectUri = getLogoutRedirectUri(
  publicOrigin,
  import.meta.env.VITE_KEYCLOAK_LOGOUT_REDIRECT_PATH,
  loginRedirectPath
);

const displayName = computed<string>(() => {
  const kc = keycloak.value;
  const tokenPayload = (decodedToken.value ?? kc?.tokenParsed) as KeycloakTokenParsed | undefined;
  return tokenPayload?.name ?? tokenPayload?.preferred_username ?? username.value ?? '';
});

function handleLogin(): void {
  keycloak.value?.login({ redirectUri: keycloakRedirectUri });
}

function handleRegister(): void {
  keycloak.value?.register({ redirectUri: keycloakRedirectUri });
}

function handleLogout(): void {
  if (logoutRedirectUri) {
    keycloak.value?.logout({ redirectUri: logoutRedirectUri });
  } else {
    keycloak.value?.logout();
  }
}
</script>

<template>
  <div class="flex flex-row w-full items-center justify-between py-4 px-6 text-white bg-blue-700">
    <RouterLink to="/">
      <FariLogo />
    </RouterLink>
    <div class="flex items-center gap-3">
      <Button variant="ghost" as-child class="text-white hover:bg-white/10 hover:text-white">
        <RouterLink to="/doc"> API doc </RouterLink>
      </Button>
      <template v-if="!isAuthenticated">
        <Button
          variant="ghost"
          class="text-white hover:bg-white/10 hover:text-white"
          :disabled="isPending"
          @click="handleRegister"
        >
          Register
        </Button>
        <Button
          variant="secondary"
          class="bg-white text-blue-800 hover:bg-gray-100"
          :disabled="isPending"
          @click="handleLogin"
        >
          <span v-if="isPending">Connecting...</span>
          <span v-else>Sign in</span>
        </Button>
      </template>
      <template v-else>
        <span class="text-white text-sm font-medium">
          Username : {{ displayName || 'Authenticated' }}
        </span>
        <Button
          variant="ghost"
          class="text-white hover:bg-white/10 hover:text-white"
          @click="handleLogout"
        >
          Sign out
        </Button>
      </template>
    </div>
  </div>
</template>
