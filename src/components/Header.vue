<template>
  <header 
    :class="[
      'flex w-full items-center justify-between px-6 text-primary-foreground transition-all duration-500 ease-in-out',
      compact ? 'py-2' : 'py-3'
    ]"
  >
    <RouterLink to="/" class="flex items-center shrink-0">
      <FariLogo class="m-2 mb-3"/>
    </RouterLink>

    <nav class="flex items-center gap-1 mx-4 p-1 rounded-2xl bg-white/5 backdrop-blur-sm">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300',
          isActive(item.to)
            ? `${item.activeBg} ${item.activeText} shadow-lg ${item.activeShadow}`
            : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10'
        ]"
      >
        <div 
          v-if="isActive(item.to)"
          :class="[
            'absolute inset-0 rounded-xl bg-gradient-to-r opacity-20 blur-sm -z-10',
            item.activeColor
          ]"
        />
        <component 
          :is="item.icon" 
          :class="[
            'h-4 w-4 transition-transform duration-300',
            isActive(item.to) ? 'scale-110' : ''
          ]" 
        />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="flex items-center gap-2 shrink-0">
      <Button 
        variant="ghost" 
        as-child 
        size="sm"
        class="text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground border border-white/20 rounded-xl"
      >
        <RouterLink to="/doc" class="flex items-center gap-2">
          <FileCode class="h-4 w-4" />
          <span>API Docs</span>
        </RouterLink>
      </Button>

      <div class="w-px h-6 bg-white/20 mx-2" />

      <template v-if="!isAuthenticated">
        <Button
          variant="ghost"
          size="sm"
          class="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground rounded-xl"
          :disabled="isPending"
          @click="openLoginDialog"
        >
          Register
        </Button>
        <Button
          variant="secondary"
          size="sm"
          class="rounded-xl"
          :disabled="isPending"
          @click="openLoginDialog"
        >
          <span v-if="isPending">Connecting...</span>
          <span v-else>Sign in</span>
        </Button>
      </template>

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
        <DropdownMenuContent align="end" class="w-56 rounded-xl">
          <DropdownMenuLabel class="font-normal">
            <div class="flex flex-col space-y-1">
              <p class="text-sm font-medium">{{ displayName }}</p>
              <p v-if="userEmail" class="text-xs text-muted-foreground">{{ userEmail }}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="cursor-pointer rounded-lg" @click="handleLogout">
            <LogOut class="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router';
  import { useAuth } from '@/composables/useAuth';
  import { useLoginDialog } from '@/composables/useLoginDialog';
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
  import { getLogoutRedirectUri } from '@/utils/path';
  import { 
    LogOut, 
    Box, 
    Map, 
    Layers, 
    Radio, 
    Play,
    FileCode,
  } from 'lucide-vue-next';
  
  defineProps<{
    compact?: boolean;
  }>();
  
  const route = useRoute();
  const { isAuthenticated, isPending, displayName, userEmail, avatarUrl, logout } = useAuth();
  const { open: openLoginDialog } = useLoginDialog();
  
  const publicOrigin = window.location.origin;
  const loginRedirectPath = import.meta.env.VITE_KEYCLOAK_REDIRECT_PATH ?? '/callback';
  
  const logoutRedirectUri = getLogoutRedirectUri(
    publicOrigin,
    import.meta.env.VITE_KEYCLOAK_LOGOUT_REDIRECT_PATH,
    loginRedirectPath
  );
  
  const navItems = [
    { 
      to: '/library/assets', 
      label: 'Assets', 
      icon: Box,
      activeColor: 'from-amber-500 to-orange-500',
      activeBg: 'bg-amber-500/20',
      activeText: 'text-amber-100',
      activeShadow: 'shadow-amber-500/30',
    },
    { 
      to: '/library/maps', 
      label: 'Maps', 
      icon: Map,
      activeColor: 'from-blue-500 to-cyan-500',
      activeBg: 'bg-blue-500/20',
      activeText: 'text-blue-100',
      activeShadow: 'shadow-blue-500/30',
    },
    { 
      to: '/library/tilesets', 
      label: 'Tilesets', 
      icon: Layers,
      activeColor: 'from-emerald-500 to-teal-500',
      activeBg: 'bg-emerald-500/20',
      activeText: 'text-emerald-100',
      activeShadow: 'shadow-emerald-500/30',
    },
    { 
      to: '/library/realtime', 
      label: 'Realtime', 
      icon: Radio,
      activeColor: 'from-violet-500 to-purple-500',
      activeBg: 'bg-violet-500/20',
      activeText: 'text-violet-100',
      activeShadow: 'shadow-violet-500/30',
    },
    { 
      to: '/library/demo', 
      label: 'Demo', 
      icon: Play,
      activeColor: 'from-rose-500 to-pink-500',
      activeBg: 'bg-rose-500/20',
      activeText: 'text-rose-100',
      activeShadow: 'shadow-rose-500/30',
    },
  ];
  
  function isActive(path: string): boolean {
    return route.path === path || route.path.startsWith(path + '/');
  }
  
  function handleLogout(): void {
    logout(logoutRedirectUri ?? undefined);
  }
  </script>
  
 