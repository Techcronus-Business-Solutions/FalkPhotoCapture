import { API_ROUTES } from '../services/ApiRoutes';

export interface ShipmentDetailsRequestConfig {
  endpoint: string;
}

export const normalizeCsvIdentifier = (csv: string): string => {
  if (!csv) return '';
  return csv.replace(/P\d+$/i, '').trim();
};

export const getShipmentDetailsRequestConfig = (
  entityType: string,
  identifier: string,
): ShipmentDetailsRequestConfig => {
  const normalized = identifier?.trim() || '';

  if (entityType === 'Panel') {
    const csv = normalizeCsvIdentifier(normalized);
    return {
      endpoint: `${API_ROUTES.SHIPMENT_DETAILS_BY_CSV}/${csv}`,
    };
  }

  return {
    endpoint: `${API_ROUTES.SHIPMENT_DETAILS_BY_ORDER}/${normalized}`,
  };
};
