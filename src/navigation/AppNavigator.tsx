import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ManagerDashboard from '../screens/ManagerDashboard';
import ShipmentDetailScreen from '../screens/ShipmentDetailScreen';
import ShippingManagementScreen from '../screens/ShippingManagementScreen';
import ShippingDetailsScreen from '../screens/ShippingDetailsScreen';
import ScanTypeScreen from '../screens/ScanTypeScreen';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const userRole = useAuthStore(state => state.user?.role);
  const initialRouteName =
    userRole === 'manager' ? 'ManagerDashboard' : 'Dashboard';

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isLoggedIn ? initialRouteName : 'Login'}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen
              name="ManagerDashboard"
              component={ManagerDashboard}
            />
            <Stack.Screen
              name="ShippingManagement"
              component={ShippingManagementScreen}
            />
            <Stack.Screen
              name="ShippingDetails"
              component={ShippingDetailsScreen}
            />
            <Stack.Screen
              name="ShipmentDetail"
              component={ShipmentDetailScreen}
            />
            <Stack.Screen name="ScanType" component={ScanTypeScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
