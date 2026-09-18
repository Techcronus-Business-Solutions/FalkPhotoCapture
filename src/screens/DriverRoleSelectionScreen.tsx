import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import CustomText from '../components/CustomText';
import ModuleOptionCard from '../components/ModuleOptionCard';
import LogoutModal from '../components/LogoutModal';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useAuthStore } from '../store/authStore';
import { displayValue } from '../utils/input';
import type {
  DriverRoleConfig,
  DriverRoleSelectionNavigationProp,
} from '../navigation/types';

const ROLE_CONFIGS: DriverRoleConfig[] = [
  {
    driverRole: 'Production Combi Driver',
    defaultEntityType: 'Panel',
    defaultScanType: 'Move',
  },
  {
    driverRole: 'Trims Combi Driver',
    defaultEntityType: 'Trim Box',
    defaultScanType: 'Move',
  },
  {
    driverRole: 'Logistic Combi Driver',
    defaultEntityType: 'Panel',
    defaultScanType: 'Ship',
  },
];

interface DriverRoleSelectionScreenProps {
  navigation: DriverRoleSelectionNavigationProp;
}

const DriverRoleSelectionScreen: React.FC<DriverRoleSelectionScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedRole, setSelectedRole] = useState(ROLE_CONFIGS[0].driverRole);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);

  const handleLogout = async () => {
    setLogoutVisible(false);
    await logout();
  };

  const handleNext = () => {
    const selectedConfig = ROLE_CONFIGS.find(
      config => config.driverRole === selectedRole,
    );

    if (selectedConfig) {
      navigation.navigate('ShippingManagement', selectedConfig);
    }
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
            Welcome, {displayValue(user?.fullName) as string}
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
          Select Driver Role
        </CustomText>
        <CustomText
          size={FontSize.smallText}
          color={COLORS.greyText}
          style={[
            styles.subtitle,
            { paddingHorizontal: wp(4), marginBottom: wp(2) },
          ]}
        >
          Choose the driver role to continue.
        </CustomText>
        {ROLE_CONFIGS.map(config => (
          <ModuleOptionCard
            key={config.driverRole}
            title={config.driverRole}
            selected={selectedRole === config.driverRole}
            onPress={() => setSelectedRole(config.driverRole)}
          />
        ))}
      </View>

      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + wp(2) }]}
      >
        <CustomButton
          title="NEXT"
          onPress={handleNext}
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
  content: {
    marginTop: wp(4),
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
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
  subtitle: {
    marginTop: wp(1),
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

export default DriverRoleSelectionScreen;
