import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  ShipmentDetail: {
    shipmentId: string;
    bolNumber: string;
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
export type ShipmentDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ShipmentDetail'
>;

export type ShipmentDetailRouteProp = RouteProp<
  RootStackParamList,
  'ShipmentDetail'
>;
