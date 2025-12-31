import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useKeycloak } from '@josempgon/vue-keycloak';
import { buildRedirectUri } from '@/utils/path';
import type { KeycloakTokenParsed } from '@/types';

export function useAuth() {
  const route = useRoute();
  const { keycloak, isAuthenticated, isPending, decodedToken, username } = useKeycloak();

  const publicOrigin = window.location.origin;
  const loginRedirectPath = import.meta.env.VITE_KEYCLOAK_REDIRECT_PATH ?? '/callback';
  const keycloakRedirectUri = buildRedirectUri(publicOrigin, loginRedirectPath);

  const displayName = computed(() => {
    const kc = keycloak.value;
    const tokenPayload = (decodedToken.value ?? kc?.tokenParsed) as KeycloakTokenParsed | undefined;
    return tokenPayload?.name ?? tokenPayload?.preferred_username ?? username.value ?? '';
  });

  const userEmail = computed(() => {
    const kc = keycloak.value;
    const tokenPayload = (decodedToken.value ?? kc?.tokenParsed) as KeycloakTokenParsed | undefined;
    return tokenPayload?.email ?? '';
  });

  const userId = computed(() => {
    const kc = keycloak.value;
    const tokenPayload = (decodedToken.value ?? kc?.tokenParsed) as KeycloakTokenParsed | undefined;
    return tokenPayload?.sub ?? null;
  });

  const userRoles = computed(() => {
    const kc = keycloak.value;
    const tokenPayload = (decodedToken.value ?? kc?.tokenParsed) as KeycloakTokenParsed | undefined;
    return tokenPayload?.realm_access?.roles ?? [];
  });

  const isAdmin = computed(() => userRoles.value.includes('admin'));
  const canWrite = computed(() => isAuthenticated.value);

  const avatarUrl = computed(() => {
    const name = displayName.value || 'User';
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('+')
      .toUpperCase();
    return `https://ui-avatars.com/api/?name=${initials}&bold=true&color=FFFFFF&background=64d8bf&size=32`;
  });

  function storeReturnPath(): void {
    window.sessionStorage.setItem('auth_return_path', route.fullPath);
  }

  function login(): void {
    storeReturnPath();
    keycloak.value?.login({ redirectUri: keycloakRedirectUri });
  }

  function register(): void {
    storeReturnPath();
    keycloak.value?.register({ redirectUri: keycloakRedirectUri });
  }

  function logout(redirectUri?: string): void {
    if (redirectUri) keycloak.value?.logout({ redirectUri });
    else keycloak.value?.logout();
  }

  async function getToken(): Promise<string | null> {
    const kc = keycloak.value;
    if (!kc || !isAuthenticated.value) return null;

    try {
      await kc.updateToken(30);
      return kc.token ?? null;
    } catch {
      return kc.token ?? null;
    }
  }

  return {
    isAuthenticated,
    isPending,
    displayName,
    userEmail,
    userId,
    userRoles,
    isAdmin,
    canWrite,
    avatarUrl,
    login,
    register,
    logout,
    getToken,
    keycloak,
  };
}