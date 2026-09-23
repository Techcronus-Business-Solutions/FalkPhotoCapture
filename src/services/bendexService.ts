import { apiClient } from './apiClient';
import { API_ROUTES } from './ApiRoutes';
import type {
  BendexAssignmentItem,
  BendexItem,
  BoxTrimCount,
} from '../types/bendex';

export const bendexService = {
  fetchBendexData: async (orderNumber: string): Promise<BendexItem[]> => {
    const trimmedOrder = orderNumber.trim();
    if (!trimmedOrder) {
      return [];
    }

    const response = await apiClient.get(
      `${API_ROUTES.GET_BENDEX_DATA}/${trimmedOrder}`,
    );
    const json = await response.json();

    if (!json.success || !Array.isArray(json.data)) {
      return [];
    }

    return json.data as BendexItem[];
  },

  fetchBendexAssignments: async (
    orderNumber: string,
  ): Promise<BoxTrimCount[]> => {
    const trimmedOrder = orderNumber.trim();
    if (!trimmedOrder) {
      return [];
    }

    const response = await apiClient.get(
      `${API_ROUTES.GET_BENDEX_ASSIGNMENTS}/${trimmedOrder}`,
    );
    const json = await response.json();

    if (!json.success || !Array.isArray(json.data?.boxTrimCounts)) {
      return [];
    }

    return json.data.boxTrimCounts as BoxTrimCount[];
  },

  fetchBendexAssignment: async (
    orderNumber: string,
    boxNumber: number,
  ): Promise<BendexAssignmentItem[]> => {
    const trimmedOrder = orderNumber.trim();
    if (!trimmedOrder) {
      return [];
    }

    const response = await apiClient.get(
      `${API_ROUTES.BENDEX_ASSIGNMENT}?orderNumber=${trimmedOrder}&boxNumber=${boxNumber}`,
    );
    const json = await response.json();

    if (!json.success || !Array.isArray(json.data)) {
      return [];
    }

    return json.data as BendexAssignmentItem[];
  },
};
