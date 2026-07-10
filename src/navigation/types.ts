import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  ManagerDashboard: undefined;
  ShippingManagement: undefined;
  ShippingDetails: undefined;
  ShipmentDetail: {
    shipmentId: string;
    bolNumber: string;
  };
  ScanType: {
    csvNumber: string;
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
export type ScanTypeNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ScanType'
>;

export type ShipmentDetailRouteProp = RouteProp<
  RootStackParamList,
  'ShipmentDetail'
>;
export type ScanTypeRouteProp = RouteProp<RootStackParamList, 'ScanType'>;
