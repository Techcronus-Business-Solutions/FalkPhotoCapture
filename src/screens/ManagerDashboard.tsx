import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import ModuleOptionCard from '../components/ModuleOptionCard';
import CustomText from '../components/CustomText';
import CustomButton from '../components/CustomButton';
import LogoutModal from '../components/LogoutModal';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useAuthStore } from '../store/authStore';
import type { ManagerDashboardNavigationProp } from '../navigation/types';

const ManagerDashboard: React.FC<{
  navigation: ManagerDashboardNavigationProp;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState('shipping');
  const [logoutVisible, setLogoutVisible] = useState(false);
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);

  const modules = [
    { key: 'shipping', title: 'Shipping Management' },
    { key: 'bendex', title: 'Bendex Box Allocation' },
    { key: 'dashboard', title: 'Upload Images' },
  ];

  const handleLogout = async () => {
    setLogoutVisible(false);
    await logout();
  };

  return (
    <View style={styles.root}>
      <Header
        title="Dashboard"
        leftIconName="log-out-outline"
        onLeftPress={() => setLogoutVisible(true)}
      />
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeIconWrapper}>
          <Ionicons
            name="person-circle-outline"
            size={wp(8)}
            color={COLORS.primary}
          />
        </View>
        <View style={styles.welcomeTextWrapper}>
          <CustomText
            size={FontSize.normalLargeText}
            color={COLORS.primary}
            weight="semibold"
          >
            Welcome, {user?.fullName ?? ''}
          </CustomText>
        </View>
      </View>

      <View style={styles.content}>
        <CustomText
          size={FontSize.mediumLargeText}
          color={COLORS.black}
          weight="semibold"
          style={{ paddingHorizontal: wp(4) }}
        >
          Select Module
        </CustomText>
        <CustomText
          size={FontSize.smallText}
          color={COLORS.greyText}
          style={{
            paddingHorizontal: wp(4),
            marginTop: wp(1),
            marginBottom: wp(2),
          }}
        >
          Choose the dynamic logistics channel.
        </CustomText>

        {modules.map(mod => (
          <ModuleOptionCard
            key={mod.key}
            title={mod.title}
            selected={selected === mod.key}
            onPress={() => setSelected(mod.key)}
          />
        ))}
      </View>

      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + wp(2) }]}
      >
        <CustomButton
          title="NEXT"
          onPress={() => {
            if (selected === 'shipping') {
              navigation.navigate('ShippingManagement');
            } else if (selected === 'bendex') {
              navigation.navigate('BendexBoxAllocation');
            } else if (selected === 'driver') {
              navigation.navigate('DriverAllocation');
            } else if (selected === 'dashboard') {
              navigation.navigate('Dashboard');
            }
          }}
          style={styles.nextBtn}
        />
      </View>

      <LogoutModal
        visible={logoutVisible}
        onCancel={() => setLogoutVisible(false)}
        onConfirm={handleLogout}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4), // horizontal padding → wp
    paddingVertical: wp(3),
    marginHorizontal: wp(4),
    marginTop: wp(4),
    borderRadius: wp(4),
    backgroundColor: COLORS.lightgray,
  },
  welcomeIconWrapper: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(12),
    backgroundColor: COLORS.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  welcomeTextWrapper: {
    flex: 1,
  },
  content: {
    marginTop: wp(4),
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: wp(4),
    paddingTop: wp(2),
  },
  nextBtn: {
    height: wp(12),
    borderRadius: wp(2),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ManagerDashboard;
