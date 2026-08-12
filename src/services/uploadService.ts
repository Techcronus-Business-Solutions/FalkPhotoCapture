import { apiClient } from './apiClient';
import { API_ROUTES } from './ApiRoutes';
import type { ShipmentBOLImage } from '../types/shipment';
import type { PhotoItem } from '../store/photoStore';
import {
  usePendingUploadsStore,
  type PendingUpload,
} from '../store/pendingUploadsStore';
import RNFS from 'react-native-fs';

type MergeBolImagesFn = (bol: string, images: ShipmentBOLImage[]) => Promise<void>;

export interface UploadResult {
  success: boolean;
  uploadedCount: number;
}

interface UploadApiResponse {
  data: ShipmentBOLImage[];
}

const ensureOfflinePhotoUri = async (
  photo: PhotoItem,
  fileName: string,
): Promise<string> => {
  if (photo.uri && !photo.uri.startsWith('data:')) {
    return photo.uri;
  }

  if (!photo.base64) {
    throw new Error(
      `Image ${fileName} could not be persisted for offline upload.`,
    );
  }

  const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
  await RNFS.writeFile(path, photo.base64, 'base64');
  return path;
};

const buildMultipartForm = (
  bol: string,
  orderNumber: string,
  imageEntries: Array<{ uri: string; fileName: string }>,
): FormData => {
  const formData = new FormData();
  formData.append('Bol', bol);
  formData.append('OrderNumber', orderNumber);
  for (const entry of imageEntries) {
    formData.append('Images', {
      uri: entry.uri,
      type: 'image/png',
      name: entry.fileName,
    } as any);
  }
  return formData;
};

const callUploadApi = async (formData: FormData): Promise<ShipmentBOLImage[]> => {
  const response = await apiClient.postMultipart(API_ROUTES.UPLOAD_IMAGES, formData);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Upload failed with status ${response.status}`);
  }

  const json = (await response.json()) as UploadApiResponse;
  return Array.isArray(json?.data) ? json.data : [];
};

export const uploadService = {
  uploadPhotosOnline: async (
    bol: string,
    orderNumber: string,
    photos: PhotoItem[],
  ): Promise<ShipmentBOLImage[]> => {
    if (!photos.length) {
      throw new Error('No photos to upload.');
    }

    const imageEntries = photos.map(photo => ({
      uri: photo.uri,
      fileName: photo.fileName ?? `${photo.id}.png`,
    }));

    console.log('[uploadService] uploadPhotosOnline filenames:', imageEntries.map(e => e.fileName));

    const formData = buildMultipartForm(bol, orderNumber, imageEntries);
    return callUploadApi(formData);
  },

  uploadPhotosOffline: async (
    shipmentId: string,
    bol: string,
    orderNumber: string,
    photos: PhotoItem[],
  ): Promise<void> => {
    if (!photos.length) {
      throw new Error('No photos to upload.');
    }

    const pendingUploadsStore = usePendingUploadsStore.getState();
    const pendingUploads: PendingUpload[] = [];

    for (const photo of photos) {
      const fileName = photo.fileName ?? `${photo.id}.png`;
      const uri = await ensureOfflinePhotoUri(photo, fileName);

      pendingUploads.push({
        id: `${shipmentId}-${photo.id}`,
        shipmentNumber: bol,
        orderNumber,
        fileName,
        uri,
        uploadStatus: 'pending',
      });
    }

    await pendingUploadsStore.addPendingUpload(pendingUploads);
  },

  syncPendingUploads: async (
    mergeBolImages: MergeBolImagesFn,
  ): Promise<{
    syncedCount: number;
    failedCount: number;
  }> => {
    const pendingUploadsStore = usePendingUploadsStore.getState();
    const allPendingUploads = pendingUploadsStore
      .getAllPendingUploads()
      .filter(u => u.uploadStatus === 'pending');

    if (!allPendingUploads.length) {
      return { syncedCount: 0, failedCount: 0 };
    }

    const groupedByBol = allPendingUploads.reduce(
      (acc, upload) => {
        if (!acc[upload.shipmentNumber]) {
          acc[upload.shipmentNumber] = [];
        }
        acc[upload.shipmentNumber].push(upload);
        return acc;
      },
      {} as Record<string, PendingUpload[]>,
    );

    let syncedCount = 0;
    let failedCount = 0;
    const syncedIds: string[] = [];

    for (const [bol, uploads] of Object.entries(groupedByBol)) {
      try {
        const orderNumber = uploads[0].orderNumber ?? '';

        const imageEntries = uploads.map(u => ({
          uri: u.uri,
          fileName: u.fileName,
        }));

        console.log('[uploadService] syncPendingUploads filenames for BOL', bol, ':', imageEntries.map(e => e.fileName));

        const formData = buildMultipartForm(bol, orderNumber, imageEntries);
        const returnedImages = await callUploadApi(formData);

        await mergeBolImages(bol, returnedImages);

        syncedIds.push(...uploads.map(u => u.id));
        syncedCount += uploads.length;
      } catch {
        failedCount += uploads.length;
      }
    }

    if (syncedIds.length > 0) {
      await pendingUploadsStore.removePendingUploads(syncedIds);
    }

    return { syncedCount, failedCount };
  },
};
