/**
 * API Client - Ky instance with auth hooks
 */
import ky from 'ky';
import { getToken } from '@josempgon/vue-keycloak';

export const apiClient = ky.create({
  prefixUrl: import.meta.env.VITE_BACKEND_URL,
  timeout: 30000,
  hooks: {
    beforeRequest: [
      async request => {
        try {
          const token = await getToken();
          if (token) {
            request.headers.set('Authorization', `Bearer ${token}`);
          }
        } catch {
          // Allow unauthenticated calls to proceed
        }
      },
    ],
  },
});
