/**
 * Path normalization utilities for Keycloak redirect URIs
 */

/**
 * Normalizes a path value to ensure proper formatting
 * - Returns empty string for null/undefined/empty/'/'
 * - Ensures path starts with '/'
 *
 * @param value - The path value to normalize
 * @returns Normalized path string
 */
export function normalizePath(value: string | null | undefined): string {
  if (!value || value === '/') {
    return '';
  }
  return value.startsWith('/') ? value : `/${value}`;
}

/**
 * Builds a full URI from origin and path
 *
 * @param origin - The origin (e.g., window.location.origin)
 * @param path - The path to append (will be normalized)
 * @returns Full URI string
 */
export function buildRedirectUri(origin: string, path: string | null | undefined): string {
  const normalizedPath = normalizePath(path);
  return `${origin}${normalizedPath}`;
}

/**
 * Gets the logout redirect URI based on environment configuration
 * Returns null if logout redirect is disabled ('none')
 *
 * @param origin - The origin (e.g., window.location.origin)
 * @param logoutSetting - The VITE_KEYCLOAK_LOGOUT_REDIRECT_PATH value
 * @param fallbackLoginPath - The login redirect path to use as fallback
 * @returns Full logout URI or null if disabled
 */
export function getLogoutRedirectUri(
  origin: string,
  logoutSetting: string | undefined,
  fallbackLoginPath: string | null | undefined
): string | null {
  if (logoutSetting === undefined) {
    // Use login path as fallback
    return buildRedirectUri(origin, fallbackLoginPath);
  }

  if (logoutSetting.toLowerCase() === 'none') {
    return null;
  }

  return buildRedirectUri(origin, logoutSetting);
}
