import { getAccessToken } from './AccessTokenProvider';
import { API_ROUTES } from './ApiRoutes';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  driverID?: string;
  name?: string;
  message?: string;
}

const LOGIN_URL = API_ROUTES.LOGIN;

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const username = credentials.username.trim();
    const password = credentials.password.trim();

    if (!username || !password) {
      throw new Error('Username and password are required.');
    }

    const accessToken = await getAccessToken();

    const response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ username, password }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      const message =
        responseText || `Login failed with status ${response.status}`;
      throw new Error(message);
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error('Unable to parse login response.');
    }

    if (typeof data.isLogin === 'boolean' && !data.isLogin) {
      throw new Error(data.message || 'Incorrect credentials.');
    }

    return {
      token: accessToken,
      username: data.username || username,
      driverID: data.driverID,
      name: data.name,
      message: data.message,
    };
  },
};

export default authService;
