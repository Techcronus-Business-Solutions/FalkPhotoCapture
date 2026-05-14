import { getAccessToken } from './AccessTokenProvider';
import { API_ROUTES } from './ApiRoutes';
import type { PhotoItem } from '../store/photoStore';
import {
  usePendingUploadsStore,
  type PendingUpload,
} from '../store/pendingUploadsStore';

export interface UploadResult {
  success: boolean;
  shipmentId: string;
  uploadedCount: number;
}

interface SalesAttachment {
  postedShipmentNo: string;
  fileName: string;
  base64Image: string;
}

const uploadImagesToServer = async (
  attachments: SalesAttachment[],
): Promise<boolean> => {
  try {
    const accessToken = await getAccessToken();

    const payload = {
      salesAttachment: attachments,
    };

    const response = await fetch(API_ROUTES.IMAGE_UPLOAD, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseText = await response.text();
      const message =
        responseText || `Upload failed with status ${response.status}`;
      throw new Error(message);
    }

    return true;
  } catch (error) {
    throw error;
  }
};

export const uploadService = {
  uploadPhotos: async (
    shipmentId: string,
    shipmentNumber: string,
    photos: PhotoItem[],
  ): Promise<UploadResult> => {
    if (!photos.length) {
      throw new Error('No photos to upload.');
    }

    try {
      const attachments: SalesAttachment[] = [];
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];

        if (!photo.base64) {
          throw new Error(`Image ${i + 1} could not be processed.`);
        }

        const fileName = photo.fileName || `${shipmentNumber}-${i + 1}.jpg`;

        attachments.push({
          postedShipmentNo: shipmentNumber,
          fileName,
          base64Image: photo.base64,
        });
      }

      await uploadImagesToServer(attachments);

      return {
        success: true,
        shipmentId,
        uploadedCount: photos.length,
      };
    } catch (error) {
      throw error;
    }
  },

  uploadPhotosOffline: async (
    shipmentId: string,
    shipmentNumber: string,
    photos: PhotoItem[],
  ): Promise<void> => {
    if (!photos.length) {
      throw new Error('No photos to upload.');
    }

    try {
      const pendingUploadsStore = usePendingUploadsStore.getState();
      const pendingUploads: PendingUpload[] = [];

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];

        if (!photo.base64) {
          throw new Error(`Image ${i + 1} could not be processed.`);
        }

        const fileName = photo.fileName || `${shipmentNumber}-${i + 1}.jpg`;

        pendingUploads.push({
          id: `${shipmentId}-${photo.id}`,
          shipmentNumber,
          fileName,
          base64Image: photo.base64,
          uploadStatus: 'pending',
        });
      }

      await pendingUploadsStore.addPendingUpload(pendingUploads);
    } catch (error) {
      throw error;
    }
  },

  syncPendingUploads: async (): Promise<{
    syncedCount: number;
    failedCount: number;
  }> => {
    const pendingUploadsStore = usePendingUploadsStore.getState();
    const allPendingUploads = pendingUploadsStore.getAllPendingUploads();

    if (!allPendingUploads.length) {
      return { syncedCount: 0, failedCount: 0 };
    }

    // Group uploads by shipment number
    const groupedByShipment = allPendingUploads.reduce((acc, upload) => {
      if (!acc[upload.shipmentNumber]) {
        acc[upload.shipmentNumber] = [];
      }
      acc[upload.shipmentNumber].push(upload);
      return acc;
    }, {} as Record<string, PendingUpload[]>);

    let syncedCount = 0;
    let failedCount = 0;
    const syncedIds: string[] = [];

    // Upload each shipment's images
    for (const [_, uploads] of Object.entries(groupedByShipment)) {
      try {
        const attachments: SalesAttachment[] = uploads.map(u => ({
          postedShipmentNo: u.shipmentNumber,
          fileName: u.fileName,
          base64Image: u.base64Image,
        }));

        await uploadImagesToServer(attachments);

        syncedIds.push(...uploads.map(u => u.id));
        syncedCount += uploads.length;
      } catch {
        failedCount += uploads.length;
      }
    }

    // Mark successfully synced uploads as completed
    if (syncedIds.length > 0) {
      await pendingUploadsStore.markUploadsAsCompleted(syncedIds);
    }

    return { syncedCount, failedCount };
  },
};
