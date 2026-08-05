import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  ManagerDashboard: undefined;
  ShippingManagement: undefined;
  ShippingDetails: undefined;
  DeliveryShippingDetails: {
    shipmentId: string;
    bolNumber: string;
  };
  UploadImage: {
    shipmentId: string;
    bolNumber: string;
  };
  ScanType: {
    csvNumber: string;
    entryType: 'Panel' | 'Trip Box';
  };
  OrderFulfillment: undefined;
  PanelLocation: {
    csvNumber: string;
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
export type UploadImageNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'UploadImage'
>;
export type ShippingManagementNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ShippingManagement'
>;
export type ShippingDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ShippingDetails'
>;
export type ScanTypeNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ScanType'
>;

export type UploadImageRouteProp = RouteProp<
  RootStackParamList,
  'UploadImage'
>;
export type ScanTypeRouteProp = RouteProp<RootStackParamList, 'ScanType'>;
export type OrderFulfillmentNavigationProp = NativeStackNavigationProp<
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
export type DeliveryShippingDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DeliveryShippingDetails'
>;
export type DeliveryShippingDetailsRouteProp = RouteProp<
  RootStackParamList,
  'DeliveryShippingDetails'
>;
