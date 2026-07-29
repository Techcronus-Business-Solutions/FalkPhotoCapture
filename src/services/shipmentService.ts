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
    typeof item?.status === 'string' &&
    ['Ready to Ship', 'Uploaded', 'Offline'].includes(item.status)
      ? (item.status as ShipmentStatus)
      : sharePointLinks.length > 0
      ? 'Uploaded'
      : 'Ready to Ship';

  return {
    id: String(item.id ?? item.no ?? ''),
    bolNumber: String(item.no ?? ''),
    date: formatShipmentDate(item.shipmentDate),
    status,
    photoCount: sharePointLinks.length,
    sharePointLinks,
    salesOrderNo: String(item.salesOrderNo ?? ''),
  };
};

export const shipmentService = {
  fetchShipments: async (): Promise<Shipment[]> => {
    const accessToken = await getAccessToken();
    const employeeId = useAuthStore.getState().user?.employeeId;

    // Build URL with query parameters
    const url = new URL(SHIPMENTS_BASE_URL);
    url.searchParams.append('$expand', 'sharePointLinks');
    if (employeeId) {
      url.searchParams.append('$filter', `driver eq '${employeeId}'`);
    }

    /*
    // Original API - commented for offline demo
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
    */

    const mockShipments = [
      {
        id: 'SHIP-1001',
        no: 'BOL-1001',
        shipmentDate: '2026-07-01T00:00:00Z',
        salesOrderNo: 'SO-1001',
        status: 'Ready to Ship' as ShipmentStatus,
        sharePointLinks: [],
      },
      {
        id: 'SHIP-1002',
        no: 'BOL-1002',
        shipmentDate: '2026-07-02T00:00:00Z',
        salesOrderNo: 'SO-1002',
        status: 'Ready to Ship' as ShipmentStatus,
        sharePointLinks: [],
      },
      {
        id: 'SHIP-1003',
        no: 'BOL-1003',
        shipmentDate: '2026-07-03T00:00:00Z',
        salesOrderNo: 'SO-1003',
        status: 'Ready to Ship' as ShipmentStatus,
        sharePointLinks: [],
      },
    ];

    return mockShipments.map(mapApiShipmentToShipment);
  },
};
