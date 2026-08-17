import { storage } from '../utils/storage';
import { handle401, SessionExpiredError } from '../utils/handle401';

const logRequest = (method: string, url: string, body?: unknown): void => {
  console.log(`[API] ${method} ${url}`);
  if (body !== undefined) {
    console.log('[API] Request Body:', JSON.stringify(body, null, 2));
  }
};

const logResponse = async (response: Response): Promise<void> => {
  const text = await response.clone().text();
  console.log(`[API] Response [${response.status}]:`, text);
};

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
    logRequest('GET', url);
    const authHeaders = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
    });
    await logResponse(response);
    return intercept401(response);
  },

  getPublic: async (url: string): Promise<Response> => {
    logRequest('GET', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    await logResponse(response);
    return response;
  },

  post: async (url: string, body: unknown): Promise<Response> => {
    logRequest('POST', url, body);
    const authHeaders = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(body),
    });
    await logResponse(response);
    return intercept401(response);
  },

  postMultipart: async (url: string, formData: FormData): Promise<Response> => {
    logRequest('POST (multipart)', url);
    const authHeaders = await getAuthHeaders();
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...authHeaders },
      body: formData,
    });
    await logResponse(response);
    return intercept401(response);
  },
};
