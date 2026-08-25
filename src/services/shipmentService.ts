import { apiClient } from './apiClient';
import { API_ROUTES } from './ApiRoutes';
import type {
  Shipment,
  ShipmentSharePointLink,
  ShipmentStatus,
  ShipmentBOL,
} from '../types/shipment';

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

export const mapBolToShipment = (bol: ShipmentBOL): Shipment => {
  const sharePointLinks: ShipmentSharePointLink[] = (bol.images ?? []).map(
    (img, idx) => ({
      attachmentNo: idx + 1,
      url1: img.imageUrl ?? '',
      fileName: img.fileName ?? '',
    }),
  );

  const status: ShipmentStatus =
    sharePointLinks.length > 0 ? 'Uploaded' : 'Ready to Ship';

  return {
    id: bol.bol,
    bolNumber: bol.bol,
    date: formatShipmentDate(bol.modified),
    status,
    photoCount: sharePointLinks.length,
    sharePointLinks,
    salesOrderNo: bol.details?.orderNumber ?? '',
  };
};

export const shipmentService = {
  fetchShipmentBols: async (): Promise<ShipmentBOL[]> => {
    const response = await apiClient.get(API_ROUTES.SHIPMENT_BOLS);
    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        responseText ||
          `Shipment BOL fetch failed with status ${response.status}`,
      );
    }

    let data: { success: boolean; message: string; data: ShipmentBOL[] | null };
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error('Unable to parse shipment BOL response.');
    }

    if (!data.success || !Array.isArray(data.data)) {
      return [];
    }

    return data.data;
  },
};
