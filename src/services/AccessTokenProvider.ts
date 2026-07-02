import Config from 'react-native-config';

const CLIENT_ID = Config.CLIENT_ID as string;
const CLIENT_SECRET = Config.CLIENT_SECRET as string;

const TENANT_ID = Config.TENANT_ID as string;

const ACCESS_TOKEN_URL = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

const DEFAULT_SCOPE = 'https://api.businesscentral.dynamics.com/.default';
export const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';

const accessTokens = new Map<string, string>();
const tokenExpireTimes = new Map<string, number>();

const fetchTokenForScope = async (scope: string): Promise<string> => {
  try {
    const cachedToken = accessTokens.get(scope);
    const expiry = tokenExpireTimes.get(scope);
    if (cachedToken && expiry && Date.now() < expiry) {
      return cachedToken;
    }

    /*
    // Original API - commented for offline demo
    const formBody = new URLSearchParams();

    formBody.append('grant_type', 'client_credentials');
    formBody.append('client_id', CLIENT_ID);
    formBody.append('client_secret', CLIENT_SECRET);
    formBody.append('scope', scope);

    const response = await fetch(ACCESS_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.log('Token API Error:', errorText);

      throw new Error(`Access token failed: ${response.status}`);
    }

    const data = await response.json();

    const token = data.access_token;
    accessTokens.set(scope, token);
    tokenExpireTimes.set(scope, Date.now() + (data.expires_in - 60) * 1000);

    return token;
    */

    const mockToken = `offline-demo-token-for-${scope}`;
    accessTokens.set(scope, mockToken);
    tokenExpireTimes.set(scope, Date.now() + 60 * 60 * 1000);

    return mockToken;
  } catch (error) {
    console.log('fetchTokenForScope Error:', error);
    throw error;
  }
};

export const getAccessToken = async (): Promise<string> => {
  return fetchTokenForScope(DEFAULT_SCOPE);
};

export const getGraphAccessToken = async (): Promise<string> => {
  return fetchTokenForScope(GRAPH_SCOPE);
};
