import { apiClient } from './client';

export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const { data } = await apiClient.post('/graphql', { query, variables });

  if (data.errors?.length) {
    throw new Error(data.errors[0].message);
  }
  return data.data as T;
}
