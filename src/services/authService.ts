import Config from 'react-native-config';
import { getAccessToken } from './AccessTokenProvider';

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

const ENVIRONMENT = Config.ENVIRONMENT as string;
const COMPANY_ID = Config.COMPANY_ID as string;

const LOGIN_URL = `https://api.businesscentral.dynamics.com/v2.0/${ENVIRONMENT}/api/techcronus/falk/v2.0/companies(${COMPANY_ID})/driverLogin`;

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
    } catch (parseError) {
      throw new Error('Unable to parse login response.');
    }

    if (typeof data.id === 'number' && data.id <= 0) {
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
