const BASE_URL = 'http://192.168.1.162:8080/api';

export const API_ROUTES = {
  LOGIN: `${BASE_URL}/Login`,
  SHIPMENTS: `${BASE_URL}/postedSalesShipment`,
  IMAGE_UPLOAD: `${BASE_URL}/image?$expand=salesAttachment`,
} as const;
