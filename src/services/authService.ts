export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { username, password } = credentials;

    if (!username.trim() || !password.trim()) {
      throw new Error('Username and password are required.');
    }

    await new Promise<void>(resolve => setTimeout(resolve, 1000));

    return {
      token: `mock_token_${Date.now()}`,
      username: username.trim(),
    };
  },
};

export default authService;
