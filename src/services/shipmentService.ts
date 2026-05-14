import { getAccessToken } from './AccessTokenProvider';
import { API_ROUTES } from './ApiRoutes';
import type { Shipment } from '../data/mockData';

const SHIPMENTS_URL = API_ROUTES.SHIPMENTS;

const formatShipmentDate = (rawDate: unknown): string => {
  const dateString =
    typeof rawDate === 'string' ? rawDate : String(rawDate ?? '');
  if (!dateString) {
    return '';
  }

  const parsedDate = new Date(dateString);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateString;
  }

  return parsedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const mapApiShipmentToShipment = (item: any): Shipment => ({
  id: String(item.id ?? item.no ?? ''),
  bolNumber: String(item.no ?? ''),
  date: formatShipmentDate(item.shipmentDate),
  status: 'Pending',
  photoCount: 0,
});

export const shipmentService = {
  fetchShipments: async (): Promise<Shipment[]> => {
    const accessToken = await getAccessToken();

    const response = await fetch(SHIPMENTS_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      const message =
        responseText || `Shipment fetch failed with status ${response.status}`;
      throw new Error(message);
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error('Unable to parse shipment response.');
    }

    if (!Array.isArray(data.value)) {
      return [];
    }

    return data.value.map(mapApiShipmentToShipment);
  },
};
