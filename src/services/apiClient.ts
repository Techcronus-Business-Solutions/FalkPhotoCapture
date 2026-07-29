import { storage } from '../utils/storage';

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const user = await storage.getItem<{ token: string }>(storage.KEYS.AUTH_USER);
  if (user?.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return {};
};

export const apiClient = {
  get: async (url: string): Promise<Response> => {
    const authHeaders = await getAuthHeaders();
    return fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
    });
  },

  post: async (url: string, body: unknown): Promise<Response> => {
    const authHeaders = await getAuthHeaders();
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(body),
    });
  },
};
