import { getAccessToken } from './AccessTokenProvider';
import { API_ROUTES } from './ApiRoutes';
import { useShipmentStore } from '../store/shipmentStore';
import type { ShipmentSharePointLink } from '../types/shipment';
import type { PhotoItem } from '../store/photoStore';
import {
  usePendingUploadsStore,
  type PendingUpload,
} from '../store/pendingUploadsStore';
import RNFS from 'react-native-fs';

export interface UploadResult {
  success: boolean;
  shipmentId: string;
  uploadedCount: number;
}

interface SalesAttachment {
  postedShipmentNo: string;
  fileName: string;
  base64Image?: string;
  url1?: string;
}

const uploadImagesToServer = async (
  attachments: SalesAttachment[],
): Promise<SalesAttachment[]> => {
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
      console.log('Image API Response:', responseText);
      const message =
        responseText || `Upload failed with status ${response.status}`;
      throw new Error(message);
    }

    const json = await response.json();
    // Expecting { salesAttachment: [...] }
    return Array.isArray(json?.salesAttachment) ? json.salesAttachment : [];
  } catch (error) {
    throw error;
  }
};

/**
 * Merge newly returned salesAttachment items into local shipment's sharePointLinks.
 * - Preserve existing links
 * - Avoid duplicate url1 entries
 * - Generate attachmentNo sequence locally
 */
const mergeAttachmentsIntoShipment = async (
  shipmentNumber: string,
  newAttachments: SalesAttachment[],
) => {
  if (!newAttachments || !newAttachments.length) return;

  const shipmentStore = useShipmentStore.getState();
  const { shipments } = shipmentStore;
  const idx = shipments.findIndex(s => s.bolNumber === shipmentNumber);
  if (idx === -1) return;

  const shipment = shipments[idx];
  const existing = Array.isArray(shipment.sharePointLinks)
    ? [...shipment.sharePointLinks]
    : ([] as ShipmentSharePointLink[]);

  // Build set of existing URLs to avoid duplicates
  const existingUrls = new Set(existing.map(e => e.url1));

  // Determine highest attachmentNo
  let maxNo = existing.reduce((acc, cur) => Math.max(acc, cur.attachmentNo), 0);

  const toAppend: ShipmentSharePointLink[] = [];
  for (const a of newAttachments) {
    const url = a.url1;
    const fileName = a.fileName || '';
    if (!url) continue;
    if (existingUrls.has(url)) continue;
    maxNo += 1;
    toAppend.push({ attachmentNo: maxNo, url1: url, fileName });
    existingUrls.add(url);
  }

  if (toAppend.length === 0) return;

  const updatedLinks = [...existing, ...toAppend];
  const updatedShipment = {
    ...shipment,
    sharePointLinks: updatedLinks,
    status:
      updatedLinks.length > 0 ? ('Uploaded' as const) : ('Pending' as const),
    photoCount: updatedLinks.length,
  };

  const updatedShipments = [...shipments];
  updatedShipments[idx] = updatedShipment;

  // Update store and persist using zustand setState
  useShipmentStore.setState({
    shipments: updatedShipments,
    filteredShipments: updatedShipments,
  } as any);

  const storeState = useShipmentStore.getState();
  if (storeState.persistShipments) {
    await storeState.persistShipments();
  }
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getHighestImageIndexForShipment = (
  shipmentNumber: string,
  pendingUploads: PendingUpload[],
): number => {
  const shipmentStore = useShipmentStore.getState();
  const shipment = shipmentStore.shipments.find(
    s => s.bolNumber === shipmentNumber,
  );

  const indices: number[] = [];

  if (shipment?.sharePointLinks?.length) {
    shipment.sharePointLinks.forEach(link => {
      const match = link.fileName.match(
        new RegExp(`^${escapeRegExp(shipmentNumber)}_(\\d+)\\.png$`, 'i'),
      );
      if (match) {
        indices.push(Number(match[1]));
      }
    });
  }

  pendingUploads.forEach(upload => {
    const match = upload.fileName.match(
      new RegExp(`^${escapeRegExp(shipmentNumber)}_(\\d+)\\.png$`, 'i'),
    );
    if (match) {
      indices.push(Number(match[1]));
    }
  });

  return indices.length ? Math.max(...indices) : 0;
};

const getOfflineUploadBase64 = async (
  upload: PendingUpload,
): Promise<string> => {
  if (upload.base64Image) {
    return upload.base64Image;
  }

  if (!upload.uri) {
    throw new Error('Offline upload is missing a local image URI.');
  }

  return await RNFS.readFile(upload.uri, 'base64');
};

const buildAttachmentsFromPending = async (
  uploads: PendingUpload[],
): Promise<SalesAttachment[]> => {
  const attachments: SalesAttachment[] = [];

  for (const upload of uploads) {
    const base64Image = await getOfflineUploadBase64(upload);
    attachments.push({
      postedShipmentNo: upload.shipmentNumber,
      fileName: upload.fileName,
      base64Image,
    });
  }

  return attachments;
};

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
      const pendingUploadsStore = usePendingUploadsStore.getState();
      const existingPendingUploads = pendingUploadsStore
        .getAllPendingUploads()
        .filter(u => u.shipmentNumber === shipmentNumber);
      const startIndex = getHighestImageIndexForShipment(
        shipmentNumber,
        existingPendingUploads,
      );

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];

        // If base64 is missing (we don't persist base64 to storage), try to
        // regenerate it from the stored file URI. This keeps uploads working
        // after app restarts where persisted photos only contain metadata.
        let base64Image = photo.base64;
        if (!base64Image && photo.uri) {
          try {
            base64Image = await RNFS.readFile(photo.uri, 'base64');
          } catch {
            throw new Error(`Image ${i + 1} could not be processed.`);
          }
        }

        if (!base64Image) {
          throw new Error(`Image ${i + 1} could not be processed.`);
        }

        // Generate file name using shipmentNumber and a sequential index.
        const index = startIndex + i + 1;
        const fileName = `${shipmentNumber}_${index}.png`;

        attachments.push({
          postedShipmentNo: shipmentNumber,
          fileName,
          base64Image,
        });
      }

      const returned = await uploadImagesToServer(attachments);

      // Merge returned salesAttachment info into local shipment data
      await mergeAttachmentsIntoShipment(shipmentNumber, returned);

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

      // Determine starting index based on existing server uploads and pending uploads.
      const existingPendingUploads = pendingUploadsStore
        .getAllPendingUploads()
        .filter(u => u.shipmentNumber === shipmentNumber);
      const startIndex = getHighestImageIndexForShipment(
        shipmentNumber,
        existingPendingUploads,
      );

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];

        const index = startIndex + i + 1;
        const fileName = `${shipmentNumber}_${index}.png`;
        const uri = await ensureOfflinePhotoUri(photo, fileName);

        pendingUploads.push({
          id: `${shipmentId}-${photo.id}`,
          shipmentNumber,
          fileName,
          uri,
          uploadStatus: 'pending',
        });
      }

      await pendingUploadsStore.addPendingUpload(pendingUploads);
    } catch (error) {
      throw error;
    }
  },

  uploadPendingUploadsForShipment: async (
    shipmentId: string,
    shipmentNumber: string,
    pendingUploads: PendingUpload[],
  ): Promise<UploadResult> => {
    if (!pendingUploads.length) {
      throw new Error('No photo uploads available.');
    }

    const pendingUploadsStore = usePendingUploadsStore.getState();
    const attachments = await buildAttachmentsFromPending(pendingUploads);

    const returned = await uploadImagesToServer(attachments);

    // Merge into local shipment
    await mergeAttachmentsIntoShipment(shipmentNumber, returned);

    await pendingUploadsStore.markUploadsAsCompleted(
      pendingUploads.map(upload => upload.id),
    );

    return {
      success: true,
      shipmentId,
      uploadedCount: pendingUploads.length,
    };
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
        const attachments = await buildAttachmentsFromPending(uploads);

        const returned = await uploadImagesToServer(attachments);

        // Merge into local shipment for this group
        await mergeAttachmentsIntoShipment(uploads[0].shipmentNumber, returned);

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
