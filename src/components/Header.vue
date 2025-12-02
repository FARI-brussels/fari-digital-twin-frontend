<script setup lang="ts">
import { computed } from 'vue';
import { useKeycloak } from '@josempgon/vue-keycloak';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import FariLogo from '@/assets/FariLogo.vue';
import { buildRedirectUri, getLogoutRedirectUri } from '@/utils/path';
import type { KeycloakTokenParsed } from '@/types';
import { LogOut } from 'lucide-vue-next';

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

const userEmail = computed<string>(() => {
  const kc = keycloak.value;
  const tokenPayload = (decodedToken.value ?? kc?.tokenParsed) as KeycloakTokenParsed | undefined;
  return tokenPayload?.email ?? '';
});

const avatarUrl = computed<string>(() => {
  const name = displayName.value || 'User';
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('+')
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${initials}&bold=true&color=FFFFFF&background=64d8bf&size=32`;
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
  <header class="flex w-full items-center justify-between py-4 px-6 bg-primary text-primary-foreground">
    <RouterLink to="/" class="flex items-center">
      <FariLogo />
    </RouterLink>

    <nav class="flex items-center gap-3">
      <!-- API Doc link -->
      <Button variant="ghost" as-child class="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
        <RouterLink to="/doc">API doc</RouterLink>
      </Button>

      <!-- Not authenticated -->
      <template v-if="!isAuthenticated">
        <Button
          variant="ghost"
          class="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          :disabled="isPending"
          @click="handleRegister"
        >
          Register
        </Button>
        <Button
          variant="secondary"
          :disabled="isPending"
          @click="handleLogin"
        >
          <span v-if="isPending">Connecting...</span>
          <span v-else>Sign in</span>
        </Button>
      </template>

      <!-- Authenticated -->
      <DropdownMenu v-else>
        <DropdownMenuTrigger as-child>
          <button class="flex items-center gap-2 rounded-full cursor-pointer hover:ring-2 hover:ring-white/20 transition-all">
            <img
              :src="avatarUrl"
              :alt="displayName"
              class="h-8 w-8 rounded-full"
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-56">
          <DropdownMenuLabel class="font-normal">
            <div class="flex flex-col space-y-1">
              <p class="text-sm font-medium">{{ displayName }}</p>
              <p v-if="userEmail" class="text-xs text-muted-foreground">{{ userEmail }}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="cursor-pointer" @click="handleLogout">
            <LogOut class="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  </header>
</template>
