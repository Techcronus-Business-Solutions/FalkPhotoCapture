import Config from 'react-native-config';

const ENVIRONMENT = Config.ENVIRONMENT as string;
const COMPANY_ID = Config.COMPANY_ID as string;

const BASE_URL = `https://api.businesscentral.dynamics.com/v2.0/${ENVIRONMENT}/api/techcronus/falk/v2.0/companies(${COMPANY_ID})`;

export const API_ROUTES = {
  LOGIN: `${BASE_URL}/driverLogin`,
  SHIPMENTS: `${BASE_URL}/postedSalesShipment`,
  IMAGE_UPLOAD: `${BASE_URL}/image`,
} as const;
