import { create } from 'zustand';
import type { Shipment, ShipmentStatus } from '../data/mockData';
import { shipmentService } from '../services/shipmentService';
import { storage } from '../utils/storage';

interface ShipmentState {
  shipments: Shipment[];
  filteredShipments: Shipment[];
  searchQuery: string;
  isLoading: boolean;
  syncShipments: () => Promise<void>;
  syncPendingUploads: () => Promise<void>;
  searchShipments: (query: string) => void;
  persistShipments: () => Promise<void>;
  loadShipments: () => Promise<void>;
  updateShipmentStatus: (
    id: string,
    status: ShipmentStatus,
    photoCount?: number,
  ) => void;
}

export const useShipmentStore = create<ShipmentState>((set, get) => ({
  shipments: [],
  filteredShipments: [],
  searchQuery: '',
  isLoading: false,

  syncShipments: async () => {
    set({ isLoading: true });
    try {
      const shipments = await shipmentService.fetchShipments();
      set({ shipments, filteredShipments: shipments, isLoading: false });
      get().searchShipments(get().searchQuery);
      await get().persistShipments();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  syncPendingUploads: async () => {
    try {
      const { uploadService } = await import('../services/uploadService');
      const { syncedCount } = await uploadService.syncPendingUploads();

      if (syncedCount > 0) {
        const pendingUploadsStore = await import(
          '../store/pendingUploadsStore'
        ).then(m => m.usePendingUploadsStore);
        const allPendingUploads = pendingUploadsStore
          .getState()
          .getAllPendingUploads();

        const completedUploads = allPendingUploads.filter(
          u => u.uploadStatus === 'completed',
        );

        const { shipments } = get();
        const updatedShipments = shipments.map(s => {
          const hasCompletedUploads = completedUploads.some(
            u => u.shipmentNumber === s.bolNumber,
          );
          if (hasCompletedUploads) {
            return { ...s, status: 'Uploaded' as const };
          }
          return s;
        });

        set({
          shipments: updatedShipments,
          filteredShipments: updatedShipments,
        });
        await get().persistShipments();

        await pendingUploadsStore.getState().clearAll();
      }
    } catch (error) {
      throw error;
    }
  },

  persistShipments: async () => {
    const { shipments, searchQuery } = get();
    await storage.setItem(storage.KEYS.SHIPMENTS, { shipments, searchQuery });
  },

  loadShipments: async () => {
    const data = await storage.getItem<{
      shipments: Shipment[];
      searchQuery: string;
    }>(storage.KEYS.SHIPMENTS);
    if (data) {
      set({
        shipments: data.shipments,
        filteredShipments: data.shipments,
        searchQuery: data.searchQuery,
      });
      get().searchShipments(data.searchQuery);
    }
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
}));
