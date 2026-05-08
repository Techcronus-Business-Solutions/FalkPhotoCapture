import Config from 'react-native-config';

let accessToken: string | null = null;
let tokenExpireTime: number | null = null;

const CLIENT_ID = Config.CLIENT_ID as string;
const CLIENT_SECRET = Config.CLIENT_SECRET as string;

const TENANT_ID = Config.TENANT_ID as string;

const ACCESS_TOKEN_URL = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

const SCOPE = 'https://api.businesscentral.dynamics.com/.default';

export const getAccessToken = async (): Promise<string> => {
  try {
    // Return existing token if still valid
    if (accessToken && tokenExpireTime && Date.now() < tokenExpireTime) {
      return accessToken;
    }

    const formBody = new URLSearchParams();

    formBody.append('grant_type', 'client_credentials');
    formBody.append('client_id', CLIENT_ID);
    formBody.append('client_secret', CLIENT_SECRET);
    formBody.append('scope', SCOPE);

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

    accessToken = data.access_token;

    // Save token expiry time
    tokenExpireTime = Date.now() + (data.expires_in - 60) * 1000;

    return accessToken!;
  } catch (error) {
    console.log('getAccessToken Error:', error);
    throw error;
  }
};
