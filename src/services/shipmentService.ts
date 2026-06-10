import { getAccessToken } from './AccessTokenProvider';
import { API_ROUTES } from './ApiRoutes';
import { useAuthStore } from '../store/authStore';
import type {
  Shipment,
  ShipmentSharePointLink,
  ShipmentStatus,
} from '../types/shipment';

const SHIPMENTS_BASE_URL = API_ROUTES.SHIPMENTS;

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

const mapApiShipmentToShipment = (item: any): Shipment => {
  const sharePointLinks: ShipmentSharePointLink[] = Array.isArray(
    item.sharePointLinks,
  )
    ? item.sharePointLinks.map((link: any) => ({
        attachmentNo: Number(link.attachmentNo ?? 0),
        url1: String(link.url1 ?? ''),
        fileName: String(link.fileName ?? ''),
      }))
    : [];

  const status: ShipmentStatus =
    sharePointLinks.length > 0 ? 'Uploaded' : 'Pending';

  return {
    id: String(item.id ?? item.no ?? ''),
    bolNumber: String(item.no ?? ''),
    date: formatShipmentDate(item.shipmentDate),
    status,
    photoCount: sharePointLinks.length,
    sharePointLinks,
  };
};

export const shipmentService = {
  fetchShipments: async (): Promise<Shipment[]> => {
    const accessToken = await getAccessToken();
    const driverID = useAuthStore.getState().user?.driverID;

    // Build URL with query parameters
    const url = new URL(SHIPMENTS_BASE_URL);
    url.searchParams.append('$expand', 'sharePointLinks');
    if (driverID) {
      url.searchParams.append('$filter', `driver eq '${driverID}'`);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    console.log('Shipment API Response:', responseText);

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
