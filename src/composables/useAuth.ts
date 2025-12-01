/**
 * Authentication composable for consistent auth state management
 * Provides reactive auth state and helper methods for protected features
 */
import { computed } from 'vue';
import { useKeycloak } from '@josempgon/vue-keycloak';
import { buildRedirectUri } from '@/utils/path';
import type { KeycloakTokenParsed } from '@/types';

export function useAuth() {
  const { keycloak, isAuthenticated, isPending, decodedToken, username } = useKeycloak();

  const publicOrigin = window.location.origin;
  const loginRedirectPath = import.meta.env.VITE_KEYCLOAK_REDIRECT_PATH ?? '/callback';
  const keycloakRedirectUri = buildRedirectUri(publicOrigin, loginRedirectPath);

  /**
   * Display name from token (name > preferred_username > username)
   */
  const displayName = computed<string>(() => {
    const kc = keycloak.value;
    const tokenPayload = (decodedToken.value ?? kc?.tokenParsed) as KeycloakTokenParsed | undefined;
    return tokenPayload?.name ?? tokenPayload?.preferred_username ?? username.value ?? '';
  });

  /**
   * User's Keycloak ID (sub claim)
   */
  const userId = computed<string | null>(() => {
    const kc = keycloak.value;
    const tokenPayload = (decodedToken.value ?? kc?.tokenParsed) as KeycloakTokenParsed | undefined;
    return tokenPayload?.sub ?? null;
  });

  /**
   * User's roles from realm_access
   */
  const userRoles = computed<string[]>(() => {
    const kc = keycloak.value;
    const tokenPayload = (decodedToken.value ?? kc?.tokenParsed) as KeycloakTokenParsed | undefined;
    return tokenPayload?.realm_access?.roles ?? [];
  });

  /**
   * Check if user has admin role
   */
  const isAdmin = computed<boolean>(() => {
    return userRoles.value.includes('admin');
  });

  /**
   * Can the user perform write operations (upload, edit, delete)?
   */
  const canWrite = computed<boolean>(() => {
    return isAuthenticated.value;
  });

  /**
   * Trigger login flow
   */
  function login(): void {
    keycloak.value?.login({ redirectUri: keycloakRedirectUri });
  }

  /**
   * Trigger register flow
   */
  function register(): void {
    keycloak.value?.register({ redirectUri: keycloakRedirectUri });
  }

  /**
   * Get current access token (for use with external libraries like Cesium)
   * Returns null if not authenticated
   */
  async function getToken(): Promise<string | null> {
    const kc = keycloak.value;
    if (!kc || !isAuthenticated.value) return null;

    try {
      // Refresh token if needed (within 30 seconds of expiry)
      await kc.updateToken(30);
      return kc.token ?? null;
    } catch {
      return kc.token ?? null;
    }
  }

  return {
    // State
    isAuthenticated,
    isPending,
    displayName,
    userId,
    userRoles,
    isAdmin,
    canWrite,
    // Actions
    login,
    register,
    getToken,
    // Raw keycloak instance for advanced usage
    keycloak,
  };
}
