import { apiClient, API_URL, refreshAccessToken } from './client';
import { tokenStorage } from '../storage/tokenStorage';

function isGraphQlAuthError(errors: { message?: string; extensions?: { code?: string } }[]) {
  return errors.some(e =>
    e.extensions?.code === 'AUTH_NOT_AUTHENTICATED'
    || e.extensions?.code === 'AUTH_NOT_AUTHORIZED'
    || (e.message?.toLowerCase().includes('not authorized') ?? false)
    || (e.message?.toLowerCase().includes('not authenticated') ?? false),
  );
}

export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
  retried = false,
): Promise<T> {
  const { data } = await apiClient.post('/graphql', { query, variables });

  if (data.errors?.length) {
    if (!retried && isGraphQlAuthError(data.errors)) {
      const token = await refreshAccessToken();
      if (token) {
        return gql<T>(query, variables, true);
      }
    }
    throw new Error(data.errors[0].message);
  }
  return data.data as T;
}
