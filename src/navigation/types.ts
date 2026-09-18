import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { ShipmentBOL } from '../types/shipment';
import type { ShippingDetailsResponseData } from '../types/shippingDetails';

export interface ScanCompletedResult {
  entityType: 'Panel' | 'Trim Box';
  csv: string;
  orderNumber: string;
  boxNumber: string;
  scanType: string;
  location: string;
  holdLocation: string;
}

export interface BoxDetailItem {
  boxName: string;
  itemCount: number;
}

export interface AddBoxItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
}

export interface PanelLocationItem {
  csv: string;
  status: string;
  currentLocation: string;
  holdLocation: string;
  holdReason: string;
  holdNotes: string;
  lastScanType: string;
}

export type DriverRole =
  | 'Production Combi Driver'
  | 'Trims Combi Driver'
  | 'Logistic Combi Driver';

export type EntityType = 'Panel' | 'Trim Box';
export type ScanTypeValue =
  | 'Load'
  | 'Move'
  | 'Ship'
  | 'QA Hold'
  | 'Release Hold';

export interface DriverRoleConfig {
  driverRole: DriverRole;
  defaultEntityType: EntityType;
  defaultScanType: ScanTypeValue;
}

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  ManagerDashboard: undefined;
  DriverRoleSelection: undefined;
  ShippingManagement: DriverRoleConfig;

  DeliveryShippingDetails: {
    shipmentBol: ShipmentBOL;
  };
  ShippingDetails: {
    entityType?: 'Panel' | 'Trim Box';
    identifier?: string;
    shipmentDetails?: ShippingDetailsResponseData | null;
  };
  UploadImage: {
    shipmentId: string;
    bolNumber: string;
    images: import('../types/shipment').ShipmentBOLImage[];
  };
  ScanType: {
    entityType: EntityType;
    driverRole: DriverRole;
    defaultScanType: ScanTypeValue;
    csv: string;
    orderNumber: string;
    panelCurrentStatus: string;
    panelLastScanType: string;
    trimBoxStatuses: {
      boxNumber: number;
      status: string;
      lastScanType?: string;
    }[];
    onScanComplete?: (result: ScanCompletedResult) => void;
  };
  OrderFulfillment: { orderNumber: string };
  PanelLocation: {
    csv: string;
    panelLocations: PanelLocationItem[];
  };
  DriverAllocation: undefined;
  BendexBoxAllocation: undefined;
  BoxContents: {
    boxNumber: string;
  };
  BoxDetail: {
    orderNumber: string;
    boxes: BoxDetailItem[];
  };
  AddBox: {
    orderNumber: string;
    boxes?: BoxDetailItem[];
  };
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
export type DriverRoleSelectionNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DriverRoleSelection'
>;
export type UploadImageNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'UploadImage'
>;
export type ShippingManagementNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ShippingManagement'
>;
export type ShippingManagementRouteProp = RouteProp<
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

export type UploadImageRouteProp = RouteProp<RootStackParamList, 'UploadImage'>;
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
export type BendexBoxAllocationNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'BendexBoxAllocation'
>;
export type BoxContentsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'BoxContents'
>;
export type BoxContentsRouteProp = RouteProp<RootStackParamList, 'BoxContents'>;
export type BoxDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'BoxDetail'
>;
export type BoxDetailRouteProp = RouteProp<RootStackParamList, 'BoxDetail'>;
export type AddBoxNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AddBox'
>;
export type AddBoxRouteProp = RouteProp<RootStackParamList, 'AddBox'>;
export type DeliveryShippingDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DeliveryShippingDetails'
>;
export type DeliveryShippingDetailsRouteProp = RouteProp<
  RootStackParamList,
  'DeliveryShippingDetails'
>;
