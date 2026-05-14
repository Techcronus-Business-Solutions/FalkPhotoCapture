import { create } from 'zustand';
import type { Shipment, ShipmentStatus } from '../data/mockData';
import { shipmentService } from '../services/shipmentService';

interface ShipmentState {
  shipments: Shipment[];
  filteredShipments: Shipment[];
  searchQuery: string;
  isLoading: boolean;
  syncShipments: () => Promise<void>;
  searchShipments: (query: string) => void;
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
    } catch (error) {
      set({ isLoading: false });
      throw error;
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
