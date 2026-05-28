import { create } from 'zustand';
import { storage } from '../utils/storage';

export interface PhotoItem {
  id: string;
  uri: string;
  fileName?: string;
  fileSize?: number;
  type?: string;
  base64?: string;
}

interface PhotoState {
  photosByShipment: Record<string, PhotoItem[]>;
  addPhoto: (shipmentId: string, photo: PhotoItem) => Promise<void>;
  removePhoto: (shipmentId: string, photoId: string) => Promise<void>;
  getPhotos: (shipmentId: string) => PhotoItem[];
  clearPhotos: (shipmentId: string) => Promise<void>;
  persistPhotos: () => Promise<void>;
  loadPhotos: () => Promise<void>;
}

export const usePhotoStore = create<PhotoState>((set, get) => ({
  photosByShipment: {},

  addPhoto: async (shipmentId: string, photo: PhotoItem) => {
    set(state => ({
      photosByShipment: {
        ...state.photosByShipment,
        [shipmentId]: [...(state.photosByShipment[shipmentId] ?? []), photo],
      },
    }));
    await get().persistPhotos();
  },

  removePhoto: async (shipmentId: string, photoId: string) => {
    set(state => ({
      photosByShipment: {
        ...state.photosByShipment,
        [shipmentId]: (state.photosByShipment[shipmentId] ?? []).filter(
          p => p.id !== photoId,
        ),
      },
    }));
    await get().persistPhotos();
  },

  getPhotos: (shipmentId: string) => get().photosByShipment[shipmentId] ?? [],

  clearPhotos: async (shipmentId: string) => {
    set(state => ({
      photosByShipment: {
        ...state.photosByShipment,
        [shipmentId]: [],
      },
    }));
    await get().persistPhotos();
  },

  persistPhotos: async () => {
    await storage.setItem(storage.KEYS.PHOTOS, get().photosByShipment);
  },

  loadPhotos: async () => {
    const data = await storage.getItem<Record<string, PhotoItem[]>>(
      storage.KEYS.PHOTOS,
    );
    if (data) {
      set({ photosByShipment: data });
    }
  },
}));
