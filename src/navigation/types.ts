import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

export interface PanelLocationItem {
  csv: string;
  status: string;
  currentLocation: string;
  holdLocation: string;
  holdReason: string;
  holdNotes: string;
  lastScanType: string;
}

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  ManagerDashboard: undefined;
  ShippingManagement: undefined;
  ShippingDetails: {
    entityType?: 'Panel' | 'Trip Box';
    identifier?: string;
  };
  ShipmentDetail: {
    shipmentId: string;
    bolNumber: string;
  };
  ScanType: {
    csvNumber: string;
    entryType: 'Panel' | 'Trip Box';
  };
  OrderFulfillment: { orderNumber: string };
  PanelLocation: {
    csv: string;
    panelLocations: PanelLocationItem[];
  };
  DriverAllocation: undefined;
};

export type LoginNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;
export type DashboardNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;
export type ManagerDashboardNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ManagerDashboard'
>;
export type ShipmentDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ShipmentDetail'
>;
export type ShippingManagementNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ShippingManagement'
>;
export type ShippingDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ShippingDetails'
>;
export type ShippingDetailsRouteProp = RouteProp<
  RootStackParamList,
  'ShippingDetails'
>;
export type ScanTypeNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ScanType'
>;

export type ShipmentDetailRouteProp = RouteProp<
  RootStackParamList,
  'ShipmentDetail'
>;
export type ScanTypeRouteProp = RouteProp<RootStackParamList, 'ScanType'>;
export type OrderFulfillmentNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OrderFulfillment'
>;
export type OrderFulfillmentRouteProp = RouteProp<
  RootStackParamList,
  'OrderFulfillment'
>;
export type PanelLocationNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PanelLocation'
>;
export type PanelLocationRouteProp = RouteProp<
  RootStackParamList,
  'PanelLocation'
>;
export type DriverAllocationNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DriverAllocation'
>;
