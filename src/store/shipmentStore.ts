import { create } from 'zustand';
import type {
  Shipment,
  ShipmentBOL,
  ShipmentBOLImage,
  ShipmentSharePointLink,
  ShipmentStatus,
} from '../types/shipment';
import { shipmentService, mapBolToShipment } from '../services/shipmentService';
import { uploadService } from '../services/uploadService';
import { storage } from '../utils/storage';

interface ShipmentState {
  shipments: Shipment[];
  shipmentBols: ShipmentBOL[];
  filteredShipments: Shipment[];
  searchQuery: string;
  isLoading: boolean;
  syncShipments: () => Promise<void>;
  syncPendingUploads: () => Promise<void>;
  searchShipments: (query: string) => void;
  persistShipments: () => Promise<void>;
  loadShipments: () => Promise<void>;
  clearAll: () => Promise<void>;
  updateShipmentStatus: (
    id: string,
    status: ShipmentStatus,
    photoCount?: number,
  ) => void;
  mergeBolImages: (bol: string, newImages: ShipmentBOLImage[]) => Promise<void>;
}

export const useShipmentStore = create<ShipmentState>((set, get) => ({
  shipments: [],
  shipmentBols: [],
  filteredShipments: [],
  searchQuery: '',
  isLoading: false,

  syncShipments: async () => {
    set({ isLoading: true });
    try {
      const shipmentBols = await shipmentService.fetchShipmentBols();
      const shipments = shipmentBols.map(mapBolToShipment);
      set({
        shipmentBols,
        shipments,
        filteredShipments: shipments,
        isLoading: false,
      });
      get().searchShipments(get().searchQuery);
      await get().persistShipments();

      if (shipments.length === 0) {
        await storage.removeItem(storage.KEYS.SHIPMENTS);
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  syncPendingUploads: async () => {
    await uploadService.syncPendingUploads(get().mergeBolImages);
  },

  persistShipments: async () => {
    const { shipments, searchQuery, shipmentBols } = get();
    await storage.setItem(storage.KEYS.SHIPMENTS, {
      shipments,
      searchQuery,
      shipmentBols,
    });
  },

  loadShipments: async () => {
    const data = await storage.getItem<{
      shipments: Shipment[];
      searchQuery: string;
      shipmentBols?: ShipmentBOL[];
    }>(storage.KEYS.SHIPMENTS);
    if (data) {
      set({
        shipments: data.shipments,
        filteredShipments: data.shipments,
        searchQuery: data.searchQuery,
        shipmentBols: data.shipmentBols ?? [],
      });
      get().searchShipments(data.searchQuery);
    } else {
      set({
        shipments: [],
        shipmentBols: [],
        filteredShipments: [],
        searchQuery: '',
      });
    }
  },

  clearAll: async () => {
    set({
      shipments: [],
      shipmentBols: [],
      filteredShipments: [],
      searchQuery: '',
      isLoading: false,
    });
    await storage.removeItem(storage.KEYS.SHIPMENTS);
  },

  searchShipments: (query: string) => {
    const { shipments } = get();
    const q = query.toLowerCase().trim();
    set({
      searchQuery: query,
      filteredShipments: q
        ? shipments.filter(
            s =>
              s.bolNumber.toLowerCase().includes(q) ||
              s.id.toLowerCase().includes(q),
          )
        : shipments,
    });
  },

  updateShipmentStatus: (
    id: string,
    status: ShipmentStatus,
    photoCount?: number,
  ) => {
    set(state => ({
      shipments: state.shipments.map(s =>
        s.id === id
          ? {
              ...s,
              status,
              ...(photoCount !== undefined ? { photoCount } : {}),
            }
          : s,
      ),
      filteredShipments: state.filteredShipments.map(s =>
        s.id === id
          ? {
              ...s,
              status,
              ...(photoCount !== undefined ? { photoCount } : {}),
            }
          : s,
      ),
    }));
  },

  mergeBolImages: async (bol: string, newImages: ShipmentBOLImage[]) => {
    const { shipmentBols, shipments, searchQuery } = get();

    // Append new images to the matching BOL, deduplicating by id
    const updatedBols = shipmentBols.map(b => {
      if (b.bol !== bol) return b;
      const existingIds = new Set(b.images.map(img => img.id));
      const toAdd = newImages.filter(img => !existingIds.has(img.id));
      return { ...b, images: [...b.images, ...toAdd] };
    });

    const targetBol = updatedBols.find(b => b.bol === bol);

    // Rebuild sharePointLinks for the matching Shipment from the updated BOL images
    const updatedShipments = shipments.map(s => {
      if (s.bolNumber !== bol) return s;
      const sharePointLinks: ShipmentSharePointLink[] = (
        targetBol?.images ?? []
      ).map((img, idx) => ({
        attachmentNo: idx + 1,
        url1: img.imageUrl ?? '',
        fileName: img.fileName ?? '',
      }));
      return {
        ...s,
        sharePointLinks,
        photoCount: sharePointLinks.length,
        status: sharePointLinks.length > 0 ? ('Uploaded' as const) : s.status,
      };
    });

    const q = searchQuery.toLowerCase().trim();
    const filteredShipments = q
      ? updatedShipments.filter(
          s =>
            s.bolNumber.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q),
        )
      : updatedShipments;

    set({
      shipmentBols: updatedBols,
      shipments: updatedShipments,
      filteredShipments,
    });
    await get().persistShipments();
  },
}));
