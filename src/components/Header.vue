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

const displayName = computed(() =>
  decodedToken.value?.name || decodedToken.value?.preferred_username || username.value || ''
);

const handleLogin = () => {
  keycloak.value?.login();
};

const handleRegister = () => {
  keycloak.value?.register();
};

const handleLogout = () => {
  keycloak.value?.logout({ redirectUri: window.location.origin });
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
        <span class="text-white text-sm">{{ displayName || 'Authenticated' }}</span>
        <Button variant="ghost" class="text-white hover:bg-white/10 hover:text-white" @click="handleLogout">
          Sign out
        </Button>
      </template>
    </div>
  </div>
</template>
