import { create } from 'zustand';
import { storage } from '../utils/storage';

export interface PendingUpload {
  id: string;
  shipmentNumber: string;
  fileName: string;
  base64Image: string;
  uploadStatus: 'pending' | 'completed';
}

interface PendingUploadsState {
  pendingUploads: PendingUpload[];
  addPendingUpload: (uploads: PendingUpload[]) => Promise<void>;
  removePendingUpload: (id: string) => Promise<void>;
  getPendingUploadsByShipment: (shipmentNumber: string) => PendingUpload[];
  getAllPendingUploads: () => PendingUpload[];
  markUploadsAsCompleted: (ids: string[]) => Promise<void>;
  persistPendingUploads: () => Promise<void>;
  loadPendingUploads: () => Promise<void>;
  clearAll: () => Promise<void>;
}

export const usePendingUploadsStore = create<PendingUploadsState>(
  (set, get) => ({
    pendingUploads: [],

    addPendingUpload: async (uploads: PendingUpload[]) => {
      set(state => ({
        pendingUploads: [...state.pendingUploads, ...uploads],
      }));
      await get().persistPendingUploads();
    },

    removePendingUpload: async (id: string) => {
      set(state => ({
        pendingUploads: state.pendingUploads.filter(u => u.id !== id),
      }));
      await get().persistPendingUploads();
    },

    getPendingUploadsByShipment: (shipmentNumber: string) =>
      get().pendingUploads.filter(u => u.shipmentNumber === shipmentNumber),

    getAllPendingUploads: () => get().pendingUploads,

    markUploadsAsCompleted: async (ids: string[]) => {
      set(state => ({
        pendingUploads: state.pendingUploads.map(u =>
          ids.includes(u.id) ? { ...u, uploadStatus: 'completed' as const } : u,
        ),
      }));
      await get().persistPendingUploads();
    },

    persistPendingUploads: async () => {
      await storage.setItem(storage.KEYS.PENDING_UPLOADS, get().pendingUploads);
    },

    loadPendingUploads: async () => {
      const data = await storage.getItem<PendingUpload[]>(
        storage.KEYS.PENDING_UPLOADS,
      );
      if (data) {
        set({ pendingUploads: data });
      }
    },

    clearAll: async () => {
      set({ pendingUploads: [] });
      await storage.removeItem(storage.KEYS.PENDING_UPLOADS);
    },
  }),
);
