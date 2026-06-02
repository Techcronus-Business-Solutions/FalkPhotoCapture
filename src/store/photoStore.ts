import { create } from 'zustand';

export interface PhotoItem {
  id: string;
  uri: string;
  fileName?: string;
  fileSize?: number;
  type?: string;
  base64?: string;
  pendingUploadId?: string;
  isServerImage?: boolean;
  isPlaceholder?: boolean;
}

interface PhotoState {
  photosByShipment: Record<string, PhotoItem[]>;
  addPhoto: (shipmentId: string, photo: PhotoItem) => Promise<void>;
  addPhotos: (shipmentId: string, photos: PhotoItem[]) => Promise<void>;
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
  },

  addPhotos: async (shipmentId: string, photos: PhotoItem[]) => {
    set(state => ({
      photosByShipment: {
        ...state.photosByShipment,
        [shipmentId]: [
          ...(state.photosByShipment[shipmentId] ?? []),
          ...photos,
        ],
      },
    }));
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
  },

  getPhotos: (shipmentId: string) => get().photosByShipment[shipmentId] ?? [],

  clearPhotos: async (shipmentId: string) => {
    set(state => ({
      photosByShipment: {
        ...state.photosByShipment,
        [shipmentId]: [],
      },
    }));
  },

  persistPhotos: async () => {
    // Photo selection is temporary and should not be persisted unless upload fails offline.
    return;
  },

  loadPhotos: async () => {
    // Do not restore temporary photo selections from storage.
    return;
  },
}));
