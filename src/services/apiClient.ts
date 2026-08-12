import { storage } from '../utils/storage';
import { handle401, SessionExpiredError } from '../utils/handle401';

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const user = await storage.getItem<{ token: string }>(storage.KEYS.AUTH_USER);
  if (user?.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return {};
};

const intercept401 = async (response: Response): Promise<Response> => {
  if (response.status !== 401) return response;
  handle401();
  throw new SessionExpiredError();
};

export const apiClient = {
  get: async (url: string): Promise<Response> => {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
    });
    return intercept401(response);
  },

  getPublic: async (url: string): Promise<Response> => {
    return fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
  },

  post: async (url: string, body: unknown): Promise<Response> => {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(body),
    });
    return intercept401(response);
  },

  postMultipart: async (url: string, formData: FormData): Promise<Response> => {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...authHeaders },
      body: formData,
    });
    return intercept401(response);
  },
};
