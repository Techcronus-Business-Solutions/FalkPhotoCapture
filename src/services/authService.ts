import { API_ROUTES } from './ApiRoutes';
import type { AuthUser } from '../store/authStore';

export interface LoginCredentials {
  username: string;
  password: string;
}

interface ApiLoginResponse {
  success: boolean;
  message: string;
  data: AuthUser;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<{ user: AuthUser; message: string }> => {
    const username = credentials.username.trim();
    const password = credentials.password.trim();

    if (!username || !password) {
      throw new Error('Username and password are required.');
    }

    const response = await fetch(API_ROUTES.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName: username, password }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `Login failed with status ${response.status}`;
      try {
        const errData: { message?: string } = JSON.parse(responseText);
        errorMessage = errData.message || errorMessage;
      } catch {
        // use default error message
      }
      throw new Error(errorMessage);
    }

    let data: ApiLoginResponse;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error('Unable to parse login response.');
    }

    if (!data.success) {
      throw new Error(data.message || 'Login failed.');
    }

    return { user: data.data, message: data.message };
  },
};

export default authService;
